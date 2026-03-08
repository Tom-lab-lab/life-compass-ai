import { useState, useRef } from "react";
import { X, Plus, Loader2, Upload } from "lucide-react";
import { createActivityLog } from "@/lib/api";
import { upsertLifeScore } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logUserActivity } from "@/lib/activityLogger";

const VALID_LOG_TYPES = ['screen_time', 'steps', 'spending', 'focus_session', 'sleep', 'study', 'exercise', 'habit', 'activity', 'expense', 'goal'];

const CSV_TYPE_MAPPING: Record<string, string> = {
  steps: 'steps',
  sleep: 'sleep',
  exercise: 'exercise',
  screen_time: 'screen_time',
  spending: 'spending',
  study_time: 'study',
  study: 'study',
  focus_session: 'focus_session',
  // Fallback aliases
  walk: 'steps',
  run: 'exercise',
  workout: 'exercise',
  expense: 'spending',
  expenses: 'spending',
  reading: 'study',
  habit: 'habit',
  activity: 'activity',
  goal: 'goal',
};

function mapLogType(rawType: string): { mapped: string; wasTransformed: boolean } {
  const normalized = rawType.trim().toLowerCase();
  if (VALID_LOG_TYPES.includes(normalized)) {
    return { mapped: normalized, wasTransformed: false };
  }
  const mapped = CSV_TYPE_MAPPING[normalized];
  if (mapped) {
    return { mapped, wasTransformed: true };
  }
  // Default fallback
  return { mapped: 'habit', wasTransformed: true };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type Tab = "activity" | "lifescore" | "csv";

const activityTypes = [
  { value: "screen_time", label: "Screen Time (min)", categories: ["social", "productive", "entertainment"] },
  { value: "steps", label: "Steps", categories: [] },
  { value: "spending", label: "Spending (₹)", categories: ["Food", "Transport", "Shopping", "Bills", "Entertainment"] },
  { value: "study", label: "Study Hours", categories: ["reading", "practice", "lecture"] },
  { value: "sleep", label: "Sleep (hours)", categories: [] },
];

const CsvUploadTab = ({ user, onSaved }: { user: any; onSaved: () => void }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const typeIdx = headers.indexOf("type");
      const valueIdx = headers.indexOf("value");
      const catIdx = headers.indexOf("category");
      const dateIdx = headers.indexOf("date");
      if (typeIdx === -1 || valueIdx === -1) throw new Error("CSV must have 'type' and 'value' columns");

      let imported = 0;
      let transformed = 0;
      const transformLog: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (!cols[typeIdx] || !cols[valueIdx]) continue;

        const rawType = cols[typeIdx];
        const { mapped, wasTransformed } = mapLogType(rawType);

        if (wasTransformed) {
          transformed++;
          transformLog.push(`Row ${i}: "${rawType}" → "${mapped}"`);
          // Log transformation for debugging
          if (user) {
            logUserActivity(user.id, "csv_type_transform", "DataEntryModal", `Mapped "${rawType}" to "${mapped}"`);
          }
        }

        const numValue = Number(cols[valueIdx].replace(/[^0-9.\-]/g, ''));
        if (isNaN(numValue)) {
          transformLog.push(`Row ${i}: skipped — invalid value "${cols[valueIdx]}"`);
          continue;
        }

        await createActivityLog({
          user_id: user.id,
          log_type: mapped,
          value: numValue,
          category: catIdx !== -1 ? cols[catIdx] || undefined : undefined,
          logged_at: dateIdx !== -1 && cols[dateIdx] ? new Date(cols[dateIdx]).toISOString() : undefined,
        });
        imported++;
      }

      const desc = transformed > 0
        ? `${imported} entries imported. ${transformed} type(s) auto-mapped.`
        : `${imported} entries imported from CSV.`;
      toast({ title: "Import complete", description: desc });
      if (transformLog.length > 0) {
        console.log("[CSV Import] Transformations:", transformLog);
      }
      onSaved();
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message || "Invalid CSV format", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Upload a CSV file with columns: <code className="text-primary">type, value, category (optional), date (optional)</code>
      </p>
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
        <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="mb-2 text-sm text-muted-foreground">Drag & drop or click to upload</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleCsvUpload}
          className="mx-auto block w-full max-w-xs text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
        />
      </div>
      {uploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Importing...
        </div>
      )}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-1 text-xs font-semibold text-foreground">Example CSV:</p>
        <pre className="text-[10px] text-muted-foreground font-mono">
{`type,value,category,date
steps,8500,,2026-03-01
spending,350,Food,2026-03-01
screen_time,45,social,2026-03-01`}
        </pre>
      </div>
    </div>
  );
};

const DataEntryModal = ({ open, onClose, onSaved }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("activity");
  const [saving, setSaving] = useState(false);

  // Activity form
  const [logType, setLogType] = useState("screen_time");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("");

  // Life score form
  const [scores, setScores] = useState({
    overall: 50,
    productivity: 50,
    wellbeing: 50,
    financial: 50,
    physical: 50,
    digital: 50,
  });

  if (!open) return null;

  const selectedActivity = activityTypes.find((a) => a.value === logType)!;

  const handleActivitySubmit = async () => {
    if (!user || !value) return;
    setSaving(true);
    try {
      await createActivityLog({
        user_id: user.id,
        log_type: logType,
        value: Number(value),
        category: category || undefined,
      });
      toast({ title: "Logged!", description: `${selectedActivity.label} entry saved.` });
      setValue("");
      setCategory("");
      onSaved();
    } catch {
      toast({ title: "Error", description: "Failed to save entry", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleScoreSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsertLifeScore({
        user_id: user.id,
        date: new Date().toISOString().split("T")[0],
        ...scores,
      });
      toast({ title: "Saved!", description: "Today's life score recorded." });
      onSaved();
    } catch {
      toast({ title: "Error", description: "Failed to save score", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-slide-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Log Your Data</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-lg bg-muted p-1">
          {(["activity", "lifescore", "csv"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t === "activity" ? "Activity" : t === "lifescore" ? "Life Score" : "CSV Upload"}
            </button>
          ))}
        </div>

        {tab === "activity" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Activity Type</label>
              <select
                value={logType}
                onChange={(e) => { setLogType(e.target.value); setCategory(""); }}
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {activityTypes.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Value</label>
              <input
                type="number"
                placeholder={logType === "steps" ? "e.g. 8000" : logType === "spending" ? "e.g. 500" : "e.g. 120"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {selectedActivity.categories.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select category</option>
                  {selectedActivity.categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleActivitySubmit}
              disabled={saving || !value}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Log Activity
            </button>
          </div>
        ) : tab === "lifescore" ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Rate each area of your life from 0–100 for today.</p>
            {(Object.keys(scores) as (keyof typeof scores)[]).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-24 text-xs font-medium capitalize text-muted-foreground">{key}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={scores[key]}
                  onChange={(e) => setScores((s) => ({ ...s, [key]: Number(e.target.value) }))}
                  className="flex-1 accent-primary"
                />
                <span className="w-8 text-right text-xs font-bold text-foreground">{scores[key]}</span>
              </div>
            ))}

            <button
              onClick={handleScoreSubmit}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save Today's Score
            </button>
          </div>
        ) : (
          <CsvUploadTab user={user} onSaved={onSaved} />
        )}
      </div>
    </div>
  );
};

export default DataEntryModal;

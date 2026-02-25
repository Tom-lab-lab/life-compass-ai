import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { createActivityLog } from "@/lib/api";
import { upsertLifeScore } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type Tab = "activity" | "lifescore";

const activityTypes = [
  { value: "screen_time", label: "Screen Time (min)", categories: ["social", "productive", "entertainment"] },
  { value: "steps", label: "Steps", categories: [] },
  { value: "spending", label: "Spending (₹)", categories: ["Food", "Transport", "Shopping", "Bills", "Entertainment"] },
];

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
          <button
            onClick={() => setTab("activity")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "activity" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Activity Log
          </button>
          <button
            onClick={() => setTab("lifescore")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "lifescore" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Life Score
          </button>
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
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default DataEntryModal;

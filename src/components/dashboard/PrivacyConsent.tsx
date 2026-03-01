import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Lock, Download, Trash2, ShieldCheck, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const CONSENT_TYPES = [
  { type: "data_collection", label: "Data Collection", desc: "Allow logging of activity, spending, and health data" },
  { type: "ai_analysis", label: "AI Analysis", desc: "Allow AI to analyze your behavioral patterns" },
  { type: "predictions", label: "Predictive Alerts", desc: "Allow AI to generate future-risk predictions" },
  { type: "notifications", label: "Smart Notifications", desc: "Allow the system to send proactive nudges" },
  { type: "research_use", label: "Anonymous Research Use", desc: "Allow anonymized data to be used for research improvement" },
];

const PrivacyConsent = () => {
  const { user, signOut } = useAuth();
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_consents")
      .select("consent_type, granted")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const map: Record<string, boolean> = {};
        CONSENT_TYPES.forEach((c) => (map[c.type] = true)); // default all on
        data?.forEach((d) => (map[d.consent_type] = d.granted));
        setConsents(map);
      });
  }, [user]);

  const toggleConsent = async (type: string, granted: boolean) => {
    if (!user) return;
    setConsents((c) => ({ ...c, [type]: granted }));
    await supabase.from("user_consents").upsert(
      {
        user_id: user.id,
        consent_type: type,
        granted,
        ...(granted ? { granted_at: new Date().toISOString(), revoked_at: null } : { revoked_at: new Date().toISOString() }),
      },
      { onConflict: "user_id,consent_type" }
    );
  };

  const exportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [scores, logs, goals, predictions, profile] = await Promise.all([
        supabase.from("life_scores").select("*").eq("user_id", user.id),
        supabase.from("activity_logs").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("predictions").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id),
      ]);

      const exportObj = {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        life_scores: scores.data,
        activity_logs: logs.data,
        goals: goals.data,
        predictions: predictions.data,
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ula-v2-data-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Your data has been downloaded." });
    } catch {
      toast({ title: "Error", description: "Failed to export data.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const deleteAllData = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure? This will delete ALL your data permanently. This cannot be undone.")) return;
    if (!window.confirm("Final confirmation: Delete everything?")) return;

    setDeleting(true);
    try {
      await Promise.all([
        supabase.from("life_scores").delete().eq("user_id", user.id),
        supabase.from("activity_logs").delete().eq("user_id", user.id),
        supabase.from("goals").delete().eq("user_id", user.id),
        supabase.from("predictions").delete().eq("user_id", user.id),
        supabase.from("prediction_feedback").delete().eq("user_id", user.id),
        supabase.from("nudges").delete().eq("user_id", user.id),
        supabase.from("coaching_plans").delete().eq("user_id", user.id),
        supabase.from("interventions").delete().eq("user_id", user.id),
        supabase.from("model_metrics").delete().eq("user_id", user.id),
        supabase.from("user_behavior_profiles").delete().eq("user_id", user.id),
        supabase.from("notification_settings").delete().eq("user_id", user.id),
        supabase.from("user_consents").delete().eq("user_id", user.id),
      ]);
      toast({ title: "Deleted", description: "All your data has been removed." });
      signOut();
    } catch {
      toast({ title: "Error", description: "Failed to delete data.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
          <Lock className="h-5 w-5 text-success" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Privacy & Consent</h2>
          <p className="text-xs text-muted-foreground">Control your data and permissions</p>
        </div>
      </div>

      {/* Consent Toggles */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Data Consent</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONSENT_TYPES.map((ct) => (
            <div key={ct.type} className="flex items-start justify-between gap-4">
              <div>
                <Label className="text-xs font-medium">{ct.label}</Label>
                <p className="text-[10px] text-muted-foreground">{ct.desc}</p>
              </div>
              <Switch checked={consents[ct.type] ?? true} onCheckedChange={(v) => toggleConsent(ct.type, v)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Export Your Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">Download all your data as a JSON file.</p>
            <button onClick={exportData} disabled={exporting} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50">
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting..." : "Export Data"}
            </button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card border-destructive/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm text-destructive">Delete All Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">Permanently delete all your data. This cannot be undone.</p>
            <button onClick={deleteAllData} disabled={deleting} className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Deleting..." : "Delete Everything"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyConsent;

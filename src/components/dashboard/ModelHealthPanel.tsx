import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Loader2, Activity } from "lucide-react";

const ModelHealthPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [health, setHealth] = useState<any>(null);
  const [retrainLog, setRetrainLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-model-health", {
        body: { action: "check-health" },
      });
      if (error) throw error;
      setHealth(data.health);
    } catch {
      toast({ title: "Error", description: "Failed to check model health.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    checkHealth();
    supabase
      .from("model_retrain_log")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setRetrainLog(data || []));
  }, [user?.id]);

  const statusColor = health?.status === "healthy" ? "text-emerald-400" : health?.status === "drift_detected" ? "text-amber-400" : "text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Self-Healing ML Monitor</h3>
          </div>
          <button onClick={checkHealth} disabled={loading} className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Check Health
          </button>
        </div>

        {!health || health.status === "no_data" ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Submit prediction feedback to see model health metrics.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              {health.status === "healthy" ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
              <span className={`text-sm font-semibold capitalize ${statusColor}`}>{health.status.replace("_", " ")}</span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {health.domains?.map((d: any) => (
                <div key={d.domain} className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">{d.domain}</p>
                  <p className="text-lg font-bold text-foreground">{d.rolling_accuracy_7d}%</p>
                  <p className="text-[10px] text-muted-foreground">30d: {d.rolling_accuracy_30d}%</p>
                  {d.drift_detected && <span className="mt-1 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-semibold text-amber-400">Drift</span>}
                  {d.needs_retrain && <span className="mt-1 inline-block rounded-full bg-destructive/20 px-2 py-0.5 text-[9px] font-semibold text-destructive">Retrain</span>}
                </div>
              ))}
            </div>

            {health.domains?.length > 0 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={health.domains}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="domain" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="rolling_accuracy_7d" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="7-Day Accuracy" />
                    <Bar dataKey="rolling_accuracy_30d" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="30-Day Accuracy" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>

      {retrainLog.length > 0 && (
        <div className="rounded-2xl border border-border bg-gradient-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground">Retrain History</h4>
          </div>
          <div className="space-y-2">
            {retrainLog.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div>
                  <span className="text-xs font-semibold text-foreground capitalize">{r.domain}</span>
                  <span className="ml-2 text-[10px] text-muted-foreground">v{r.old_version} → v{r.new_version}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{r.trigger_reason}</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelHealthPanel;

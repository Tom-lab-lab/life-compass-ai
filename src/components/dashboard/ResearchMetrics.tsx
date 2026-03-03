import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FlaskConical, TrendingUp, Users, Brain } from "lucide-react";

const COLORS = ["hsl(168,76%,40%)", "hsl(38,92%,55%)", "hsl(265,70%,60%)", "hsl(0,72%,55%)", "hsl(210,90%,60%)"];

const ResearchMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [retrainLog, setRetrainLog] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("model_metrics").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).limit(60),
      supabase.from("model_retrain_log").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).limit(30),
      supabase.from("user_behavior_clusters").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([m, r, c]) => {
      setMetrics(m.data || []);
      setRetrainLog(r.data || []);
      setClusters(c.data);
    });
  }, [user?.id]);

  const accuracyTimeline = metrics.map((m) => ({
    date: m.period_start,
    accuracy: Number(m.accuracy),
    domain: m.domain,
  }));

  const domainAgg: Record<string, { total: number; correct: number; helpful: number; wrong: number }> = metrics.reduce((acc: Record<string, { total: number; correct: number; helpful: number; wrong: number }>, m) => {
    if (!acc[m.domain]) acc[m.domain] = { total: 0, correct: 0, helpful: 0, wrong: 0 };
    acc[m.domain].total += m.total_predictions;
    acc[m.domain].correct += m.correct_predictions;
    acc[m.domain].helpful += m.feedback_helpful;
    acc[m.domain].wrong += m.feedback_wrong;
    return acc;
  }, {});

  const pieData = Object.entries(domainAgg).map(([name, v]: [string, { total: number; correct: number; helpful: number; wrong: number }]) => ({
    name,
    value: v.total,
  }));

  if (metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-gradient-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Research Metrics Dashboard</h3>
        </div>
        <p className="py-8 text-center text-sm text-muted-foreground">Generate predictions and submit feedback to see research metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Predictions", value: (Object.values(domainAgg) as { total: number; correct: number }[]).reduce((s, d) => s + d.total, 0), icon: Brain },
          { label: "Confirmed Accurate", value: (Object.values(domainAgg) as { total: number; correct: number }[]).reduce((s, d) => s + d.correct, 0), icon: TrendingUp },
          { label: "Model Retrains", value: retrainLog.length, icon: FlaskConical },
          { label: "Cluster", value: clusters?.cluster_type || "N/A", icon: Users },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
            <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
            <p className="text-lg font-bold text-foreground capitalize">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-gradient-card p-5">
          <h4 className="mb-3 text-xs font-bold text-foreground">Accuracy Over Time</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-card p-5">
          <h4 className="mb-3 text-xs font-bold text-foreground">Predictions by Domain</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {retrainLog.length > 0 && (
        <div className="rounded-2xl border border-border bg-gradient-card p-5">
          <h4 className="mb-3 text-xs font-bold text-foreground">Drift Detection & Retrain Timeline</h4>
          <div className="space-y-2">
            {retrainLog.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                <span className="font-semibold capitalize text-foreground">{r.domain} v{r.old_version}→v{r.new_version}</span>
                <span className="text-muted-foreground">{r.trigger_reason} • Drift: {r.drift_score ?? "N/A"}</span>
                <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchMetrics;

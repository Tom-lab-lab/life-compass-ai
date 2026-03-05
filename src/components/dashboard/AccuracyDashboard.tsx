import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Target, TrendingUp, CheckCircle, XCircle, RefreshCw, Loader2 } from "lucide-react";

interface ModelMetric {
  id: string;
  domain: string;
  accuracy: number;
  usefulness_rate: number;
  feedback_helpful: number;
  feedback_wrong: number;
  feedback_total: number;
  total_predictions: number;
  correct_predictions: number;
  period_start: string;
  avg_confidence: number;
  drift_score: number;
}

const AccuracyDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ModelMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);

  const loadMetrics = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("model_metrics")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setMetrics((data as ModelMetric[]) || []);
  };

  const computeMetrics = async () => {
    setComputing(true);
    try {
      await supabase.functions.invoke("ai-predict", {
        body: { action: "compute-metrics" },
      });
      await loadMetrics();
    } catch {
      // silently fail
    } finally {
      setComputing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadMetrics();

    // Realtime subscription
    const channel = supabase
      .channel("accuracy-metrics")
      .on("postgres_changes", { event: "*", schema: "public", table: "model_metrics", filter: `user_id=eq.${user.id}` }, () => {
        loadMetrics();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "prediction_feedback", filter: `user_id=eq.${user.id}` }, () => {
        loadMetrics();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  if (metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-gradient-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Prediction Accuracy</h3>
          </div>
          <button
            onClick={computeMetrics}
            disabled={computing}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            {computing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Compute Metrics
          </button>
        </div>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Click "Compute Metrics" to analyze your predictions, or generate new predictions first.
        </p>
      </div>
    );
  }

  // Aggregate by domain
  const byDomain = metrics.reduce((acc: Record<string, any>, m) => {
    if (!acc[m.domain]) {
      acc[m.domain] = { domain: m.domain, accuracy: 0, useful: 0, total: 0, helpful: 0, wrong: 0, count: 0, avgConf: 0, drift: 0 };
    }
    acc[m.domain].accuracy += m.accuracy;
    acc[m.domain].useful += m.usefulness_rate;
    acc[m.domain].total += m.total_predictions;
    acc[m.domain].helpful += m.feedback_helpful;
    acc[m.domain].wrong += m.feedback_wrong;
    acc[m.domain].avgConf += m.avg_confidence;
    acc[m.domain].drift += m.drift_score;
    acc[m.domain].count += 1;
    return acc;
  }, {});

  const domainData = Object.values(byDomain).map((d: any) => ({
    domain: d.domain,
    accuracy: Math.round(d.accuracy / d.count),
    usefulness: Math.round((d.useful / d.count) * 100),
    total: d.total,
    helpful: d.helpful,
    wrong: d.wrong,
    confidence: Math.round(d.avgConf / d.count),
    drift: Math.round((d.drift / d.count) * 10) / 10,
  }));

  const totalPredictions = domainData.reduce((s, d) => s + d.total, 0);
  const totalHelpful = domainData.reduce((s, d) => s + d.helpful, 0);
  const totalWrong = domainData.reduce((s, d) => s + d.wrong, 0);
  const overallAccuracy = domainData.length > 0 ? Math.round(domainData.reduce((s, d) => s + d.accuracy, 0) / domainData.length) : 0;

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Prediction Accuracy & Research Metrics</h3>
        </div>
        <button
          onClick={computeMetrics}
          disabled={computing}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          {computing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Overall Accuracy", value: `${overallAccuracy}%`, icon: TrendingUp, color: "text-primary" },
          { label: "Total Predictions", value: totalPredictions, icon: Target, color: "text-info" },
          { label: "Confirmed Helpful", value: totalHelpful, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Marked Wrong", value: totalWrong, icon: XCircle, color: "text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
            <stat.icon className={`mx-auto mb-1 h-4 w-4 ${stat.color}`} />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Accuracy by domain */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Accuracy by Domain</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={domainData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="domain" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Accuracy %" />
              <Bar dataKey="confidence" fill="hsl(var(--chart-amber))" radius={[4, 4, 0, 0]} name="Avg Confidence %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Domain details */}
      <div className="space-y-2">
        {domainData.map((d) => (
          <div key={d.domain} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
            <span className="text-xs font-semibold capitalize text-foreground">{d.domain}</span>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>{d.total} predictions</span>
              <span className="text-primary">{d.accuracy}% accuracy</span>
              {d.drift > 5 && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-400">Drift: {d.drift}</span>}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground text-center">
        Metrics auto-compute from predictions. Submit feedback to improve accuracy tracking.
      </p>
    </div>
  );
};

export default AccuracyDashboard;

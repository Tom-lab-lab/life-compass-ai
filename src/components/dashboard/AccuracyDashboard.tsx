import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Target, TrendingUp, CheckCircle, XCircle } from "lucide-react";

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
}

interface Props {
  metrics: ModelMetric[];
}

const COLORS = ["hsl(168, 76%, 40%)", "hsl(38, 92%, 55%)", "hsl(265, 70%, 60%)", "hsl(0, 72%, 55%)", "hsl(210, 90%, 60%)", "hsl(152, 69%, 45%)"];

const AccuracyDashboard = ({ metrics }: Props) => {
  if (metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-gradient-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Prediction Accuracy</h3>
        </div>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Submit feedback on predictions to see accuracy metrics here.
        </p>
      </div>
    );
  }

  // Aggregate by domain
  const byDomain = metrics.reduce((acc: Record<string, any>, m) => {
    if (!acc[m.domain]) {
      acc[m.domain] = { domain: m.domain, accuracy: 0, useful: 0, total: 0, helpful: 0, wrong: 0, count: 0 };
    }
    acc[m.domain].accuracy += m.accuracy;
    acc[m.domain].useful += m.usefulness_rate;
    acc[m.domain].total += m.total_predictions;
    acc[m.domain].helpful += m.feedback_helpful;
    acc[m.domain].wrong += m.feedback_wrong;
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
  }));

  const totalPredictions = domainData.reduce((s, d) => s + d.total, 0);
  const totalHelpful = domainData.reduce((s, d) => s + d.helpful, 0);
  const totalWrong = domainData.reduce((s, d) => s + d.wrong, 0);
  const overallAccuracy = totalPredictions > 0 ? Math.round((totalHelpful / totalPredictions) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Prediction Accuracy & Research Metrics</h3>
      </div>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-4 gap-3">
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
              <XAxis dataKey="domain" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "hsl(222, 40%, 9%)", border: "1px solid hsl(222, 20%, 16%)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(210, 40%, 96%)" }}
              />
              <Bar dataKey="accuracy" fill="hsl(168, 76%, 40%)" radius={[4, 4, 0, 0]} name="Accuracy %" />
              <Bar dataKey="usefulness" fill="hsl(38, 92%, 55%)" radius={[4, 4, 0, 0]} name="Usefulness %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Metrics update as you provide feedback on predictions. Used for research accuracy tracking.
      </p>
    </div>
  );
};

export default AccuracyDashboard;

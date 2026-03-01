import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/hooks/useLocale";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { Brain, TrendingUp, Lightbulb } from "lucide-react";
import type { LifeScore, ActivityLog } from "@/hooks/useDashboardData";

interface Props {
  lifeScores: LifeScore[];
  screenTimeLogs: ActivityLog[];
  stepLogs: ActivityLog[];
  spendingLogs: ActivityLog[];
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function getCorrelationLabel(r: number): string {
  const abs = Math.abs(r);
  if (abs > 0.7) return "Strong";
  if (abs > 0.4) return "Moderate";
  if (abs > 0.2) return "Weak";
  return "Negligible";
}

const AdvancedAnalytics = ({ lifeScores, screenTimeLogs, stepLogs, spendingLogs }: Props) => {
  const { t } = useLocale();

  const charts = useMemo(() => {
    const scoresByDate = new Map(lifeScores.map(s => [s.date, s]));

    // Steps vs Physical score
    const stepsVsPhysical = stepLogs.map(log => {
      const date = log.logged_at.split("T")[0];
      const score = scoresByDate.get(date);
      return score ? { steps: Number(log.value), physical: score.physical, date } : null;
    }).filter(Boolean) as { steps: number; physical: number; date: string }[];

    // Screen time vs Productivity
    const screenVsProd = screenTimeLogs.map(log => {
      const date = log.logged_at.split("T")[0];
      const score = scoresByDate.get(date);
      return score ? { screenTime: Number(log.value), productivity: score.productivity, date } : null;
    }).filter(Boolean) as { screenTime: number; productivity: number; date: string }[];

    // Spending vs Financial score
    const spendVsFinancial = spendingLogs.map(log => {
      const date = log.logged_at.split("T")[0];
      const score = scoresByDate.get(date);
      return score ? { spending: Number(log.value), financial: score.financial, date } : null;
    }).filter(Boolean) as { spending: number; financial: number; date: string }[];

    // Wellbeing trend
    const wellbeingTrend = lifeScores.slice(0, 14).reverse().map(s => ({
      date: s.date.slice(5),
      wellbeing: s.wellbeing,
      overall: s.overall,
    }));

    return {
      stepsVsPhysical,
      screenVsProd,
      spendVsFinancial,
      wellbeingTrend,
      corr: {
        stepsPhysical: pearsonCorrelation(stepsVsPhysical.map(d => d.steps), stepsVsPhysical.map(d => d.physical)),
        screenProd: pearsonCorrelation(screenVsProd.map(d => d.screenTime), screenVsProd.map(d => d.productivity)),
        spendFinancial: pearsonCorrelation(spendVsFinancial.map(d => d.spending), spendVsFinancial.map(d => d.financial)),
      },
    };
  }, [lifeScores, screenTimeLogs, stepLogs, spendingLogs]);

  const chartConfigs = [
    {
      title: "Exercise vs Physical Score",
      data: charts.stepsVsPhysical,
      xKey: "steps",
      yKey: "physical",
      xLabel: "Steps",
      yLabel: "Physical",
      corr: charts.corr.stepsPhysical,
      insight: charts.corr.stepsPhysical > 0.3
        ? "More steps correlate with higher physical scores. Keep moving!"
        : "Not enough data yet to find a clear pattern between exercise and physical wellbeing.",
      color: "hsl(var(--chart-emerald))",
    },
    {
      title: "Screen Time vs Productivity",
      data: charts.screenVsProd,
      xKey: "screenTime",
      yKey: "productivity",
      xLabel: "Screen (min)",
      yLabel: "Productivity",
      corr: charts.corr.screenProd,
      insight: charts.corr.screenProd < -0.3
        ? "Higher screen time is linked to lower productivity. Consider setting limits."
        : "Screen time impact on productivity is still being analyzed.",
      color: "hsl(var(--chart-violet))",
    },
    {
      title: "Spending vs Financial Health",
      data: charts.spendVsFinancial,
      xKey: "spending",
      yKey: "financial",
      xLabel: "Spending (₹)",
      yLabel: "Financial",
      corr: charts.corr.spendFinancial,
      insight: charts.corr.spendFinancial < -0.3
        ? "Higher spending days correlate with lower financial scores. Watch salary-day spikes."
        : "Building spending pattern insights — keep logging!",
      color: "hsl(var(--chart-amber))",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Advanced Analytics</h2>
          <p className="text-xs text-muted-foreground">Correlation analysis with AI explanations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {chartConfigs.map((cfg) => (
          <Card key={cfg.title} className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{cfg.title}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  r = {cfg.corr.toFixed(2)} • {getCorrelationLabel(cfg.corr)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {cfg.data.length < 3 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Need at least 3 data points. Keep logging!</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey={cfg.xKey} name={cfg.xLabel} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey={cfg.yKey} name={cfg.yLabel} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Scatter data={cfg.data} fill={cfg.color} fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-xs text-muted-foreground">{cfg.insight}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Wellbeing Trend */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Wellbeing & Overall Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {charts.wellbeingTrend.length < 2 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Log life scores to see your trend.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={charts.wellbeingTrend} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="wellbeing" stroke="hsl(var(--chart-cyan))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="overall" stroke="hsl(var(--chart-teal))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                Track how your overall life quality evolves over time. Consistent logging improves prediction accuracy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;

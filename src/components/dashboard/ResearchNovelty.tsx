import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, RotateCcw, Scale, ShieldAlert, AlertTriangle } from "lucide-react";
import type { LifeScore, ActivityLog } from "@/hooks/useDashboardData";

interface Props {
  lifeScores: LifeScore[];
  screenTimeLogs: ActivityLog[];
  stepLogs: ActivityLog[];
  spendingLogs: ActivityLog[];
  predictions: any[];
}

const ResearchNovelty = ({ lifeScores, screenTimeLogs, stepLogs, spendingLogs, predictions }: Props) => {
  const analysis = useMemo(() => {
    const recent7 = lifeScores.slice(0, 7);

    // Burnout Risk — low scores across multiple domains
    const burnoutFactors: string[] = [];
    if (recent7.length >= 3) {
      const avgProd = recent7.reduce((s, r) => s + r.productivity, 0) / recent7.length;
      const avgWell = recent7.reduce((s, r) => s + r.wellbeing, 0) / recent7.length;
      const avgPhys = recent7.reduce((s, r) => s + r.physical, 0) / recent7.length;
      if (avgProd < 40) burnoutFactors.push("Low productivity trend");
      if (avgWell < 40) burnoutFactors.push("Declining wellbeing");
      if (avgPhys < 40) burnoutFactors.push("Low physical activity");
      const screenAvg = screenTimeLogs.slice(0, 7).reduce((s, l) => s + Number(l.value), 0) / Math.max(screenTimeLogs.slice(0, 7).length, 1);
      if (screenAvg > 300) burnoutFactors.push("Excessive screen time (>5h/day)");
    }
    const burnoutRisk = Math.min(100, burnoutFactors.length * 25);

    // Habit Relapse — detect declining patterns
    const relapseSignals: string[] = [];
    if (stepLogs.length >= 7) {
      const recentSteps = stepLogs.slice(0, 7).map(l => Number(l.value));
      const olderSteps = stepLogs.slice(7, 14).map(l => Number(l.value));
      if (olderSteps.length >= 3) {
        const recentAvg = recentSteps.reduce((a, b) => a + b, 0) / recentSteps.length;
        const olderAvg = olderSteps.reduce((a, b) => a + b, 0) / olderSteps.length;
        if (recentAvg < olderAvg * 0.7) relapseSignals.push("Step count dropped 30%+ from previous week");
      }
    }
    if (spendingLogs.length >= 7) {
      const recentSpend = spendingLogs.slice(0, 7).map(l => Number(l.value));
      const olderSpend = spendingLogs.slice(7, 14).map(l => Number(l.value));
      if (olderSpend.length >= 3) {
        const rAvg = recentSpend.reduce((a, b) => a + b, 0) / recentSpend.length;
        const oAvg = olderSpend.reduce((a, b) => a + b, 0) / olderSpend.length;
        if (rAvg > oAvg * 1.5) relapseSignals.push("Spending spiked 50%+ from previous week");
      }
    }
    const relapseRisk = Math.min(100, relapseSignals.length * 35);

    // Life Balance Score — variance across domains
    let balanceScore = 50;
    if (recent7.length > 0) {
      const latest = recent7[0];
      const scores = [latest.productivity, latest.wellbeing, latest.physical, latest.financial, latest.digital];
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length;
      balanceScore = Math.max(0, Math.min(100, 100 - Math.sqrt(variance) * 2));
    }

    // AI Ethics — notification frequency check
    const ethicsWarnings: string[] = [];
    const predCount = predictions.filter(p => p.status === "pending").length;
    if (predCount > 10) ethicsWarnings.push("Too many active predictions — risk of notification fatigue");
    const highRisk = predictions.filter(p => p.risk_score > 80).length;
    if (highRisk > 3) ethicsWarnings.push("Multiple high-risk alerts may cause anxiety");

    return { burnoutRisk, burnoutFactors, relapseRisk, relapseSignals, balanceScore, ethicsWarnings };
  }, [lifeScores, screenTimeLogs, stepLogs, spendingLogs, predictions]);

  const modules = [
    {
      icon: Flame,
      title: "Burnout Risk Prediction",
      score: analysis.burnoutRisk,
      color: analysis.burnoutRisk > 60 ? "text-destructive" : analysis.burnoutRisk > 30 ? "text-warning" : "text-success",
      bgColor: analysis.burnoutRisk > 60 ? "bg-destructive/10" : analysis.burnoutRisk > 30 ? "bg-warning/10" : "bg-success/10",
      details: analysis.burnoutFactors.length > 0
        ? analysis.burnoutFactors
        : ["No burnout indicators detected. Keep up the balance!"],
    },
    {
      icon: RotateCcw,
      title: "Habit Relapse Detection",
      score: analysis.relapseRisk,
      color: analysis.relapseRisk > 50 ? "text-destructive" : analysis.relapseRisk > 20 ? "text-warning" : "text-success",
      bgColor: analysis.relapseRisk > 50 ? "bg-destructive/10" : analysis.relapseRisk > 20 ? "bg-warning/10" : "bg-success/10",
      details: analysis.relapseSignals.length > 0
        ? analysis.relapseSignals
        : ["Habits are consistent. No relapse patterns found."],
    },
    {
      icon: Scale,
      title: "Life Balance Score",
      score: analysis.balanceScore,
      color: analysis.balanceScore > 70 ? "text-success" : analysis.balanceScore > 40 ? "text-warning" : "text-destructive",
      bgColor: analysis.balanceScore > 70 ? "bg-success/10" : analysis.balanceScore > 40 ? "bg-warning/10" : "bg-destructive/10",
      details: [
        analysis.balanceScore > 70
          ? "Good balance across life domains."
          : analysis.balanceScore > 40
          ? "Some domains are lagging — check your weakest areas."
          : "Significant imbalance detected. Focus on neglected areas.",
      ],
    },
    {
      icon: ShieldAlert,
      title: "AI Ethics Monitor",
      score: analysis.ethicsWarnings.length === 0 ? 100 : Math.max(0, 100 - analysis.ethicsWarnings.length * 40),
      color: analysis.ethicsWarnings.length === 0 ? "text-success" : "text-warning",
      bgColor: analysis.ethicsWarnings.length === 0 ? "bg-success/10" : "bg-warning/10",
      details: analysis.ethicsWarnings.length > 0
        ? analysis.ethicsWarnings
        : ["AI notification frequency is within ethical limits."],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-violet/20">
          <AlertTriangle className="h-5 w-5 text-chart-violet" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Research Novelty Modules</h2>
          <p className="text-xs text-muted-foreground">Burnout, relapse, balance & AI ethics analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {modules.map((mod) => (
          <Card key={mod.title} className="border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${mod.bgColor}`}>
                    <mod.icon className={`h-4 w-4 ${mod.color}`} />
                  </div>
                  <CardTitle className="text-sm font-semibold">{mod.title}</CardTitle>
                </div>
                <span className={`text-lg font-bold ${mod.color}`}>{mod.score}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={mod.score} className="h-1.5" />
              <ul className="space-y-1">
                {mod.details.map((d, i) => (
                  <li key={i} className="text-xs text-muted-foreground">• {d}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Digital Life Twin Summary */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">🧬 Digital Life Twin — Simulation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Your digital twin processes {lifeScores.length} life score entries, {screenTimeLogs.length + stepLogs.length + spendingLogs.length} activity logs,
            and {predictions.length} predictions to model your behavioral patterns. Current simulation accuracy depends on consistent daily logging.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold text-foreground">{lifeScores.length}</p>
              <p className="text-[10px] text-muted-foreground">Score Entries</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold text-foreground">{screenTimeLogs.length + stepLogs.length + spendingLogs.length}</p>
              <p className="text-[10px] text-muted-foreground">Activity Logs</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold text-foreground">{predictions.length}</p>
              <p className="text-[10px] text-muted-foreground">Predictions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchNovelty;

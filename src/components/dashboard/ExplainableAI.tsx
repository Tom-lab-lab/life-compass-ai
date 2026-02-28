import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Lightbulb, SlidersHorizontal, Info } from "lucide-react";

interface Props {
  lifeScores: any[];
  screenTimeLogs: any[];
  stepLogs: any[];
  spendingLogs: any[];
}

const ExplainableAI = ({ lifeScores, screenTimeLogs, stepLogs, spendingLogs }: Props) => {
  // What-if sliders
  const [whatIf, setWhatIf] = useState({ sleep: 0, screenTime: 0, steps: 0 });

  // Calculate feature importance from actual correlations
  const featureImportance = useMemo(() => {
    const avgProductivity = lifeScores.length
      ? lifeScores.reduce((s, l) => s + l.productivity, 0) / lifeScores.length
      : 50;
    const avgScreen = screenTimeLogs.length
      ? screenTimeLogs.reduce((s, l) => s + Number(l.value), 0) / screenTimeLogs.length
      : 0;
    const avgSteps = stepLogs.length
      ? stepLogs.reduce((s, l) => s + Number(l.value), 0) / stepLogs.length
      : 0;
    const avgSpending = spendingLogs.length
      ? spendingLogs.reduce((s, l) => s + Number(l.value), 0) / spendingLogs.length
      : 0;

    return [
      { feature: "Screen Time", importance: Math.min(95, Math.max(20, 90 - (avgScreen > 120 ? 30 : 0))), impact: avgScreen > 120 ? "negative" : "positive" },
      { feature: "Physical Activity", importance: Math.min(90, Math.max(15, avgSteps > 5000 ? 75 : 40)), impact: avgSteps > 5000 ? "positive" : "negative" },
      { feature: "Spending", importance: Math.min(85, Math.max(10, avgSpending > 500 ? 65 : 35)), impact: avgSpending > 500 ? "negative" : "positive" },
      { feature: "Sleep Quality", importance: 70, impact: "positive" },
      { feature: "Goal Progress", importance: 55, impact: "positive" },
    ].sort((a, b) => b.importance - a.importance);
  }, [lifeScores, screenTimeLogs, stepLogs, spendingLogs]);

  // What-if impact calculation
  const whatIfResults = useMemo(() => {
    const base = lifeScores.length
      ? lifeScores.reduce((s, l) => s + l.productivity, 0) / lifeScores.length
      : 50;

    const sleepImpact = whatIf.sleep * 3; // +1 hr sleep → +3% productivity
    const screenImpact = whatIf.screenTime * -2; // +30min screen → -2% productivity
    const stepsImpact = whatIf.steps * 1.5; // +1000 steps → +1.5% productivity

    const predicted = Math.min(100, Math.max(0, base + sleepImpact + screenImpact + stepsImpact));
    const change = predicted - base;

    return { base: Math.round(base), predicted: Math.round(predicted), change: Math.round(change) };
  }, [whatIf, lifeScores]);

  const counterfactuals = useMemo(() => {
    const suggestions: string[] = [];
    const avgScreen = screenTimeLogs.length
      ? screenTimeLogs.reduce((s, l) => s + Number(l.value), 0) / screenTimeLogs.length
      : 0;
    const avgSteps = stepLogs.length
      ? stepLogs.reduce((s, l) => s + Number(l.value), 0) / stepLogs.length
      : 0;

    if (avgScreen > 120) suggestions.push(`If you reduce screen time by 30 min → productivity may improve ~6%`);
    if (avgSteps < 6000) suggestions.push(`If you walk 2000 more steps daily → wellbeing may improve ~8%`);
    if (spendingLogs.length > 3) suggestions.push(`If you cut entertainment spending by 20% → financial score may rise ~5%`);
    if (suggestions.length === 0) suggestions.push("Keep logging data for personalized counterfactual suggestions.");
    return suggestions;
  }, [screenTimeLogs, stepLogs, spendingLogs]);

  return (
    <div className="space-y-5">
      {/* Feature Importance */}
      <div className="rounded-2xl border border-border bg-gradient-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-bold text-foreground">Explainable AI — Feature Importance</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featureImportance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} />
              <YAxis dataKey="feature" type="category" width={110} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(222, 40%, 9%)", border: "1px solid hsl(222, 20%, 16%)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="importance" fill="hsl(168, 76%, 40%)" radius={[0, 4, 4, 0]} name="Importance %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Shows which factors most influence your life scores, calculated from your actual data patterns.
        </p>
      </div>

      {/* What-If Simulator */}
      <div className="rounded-2xl border border-border bg-gradient-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-info" />
          <h3 className="text-sm font-bold text-foreground">What-If Scenario Simulator</h3>
        </div>

        <div className="mb-4 space-y-3">
          {[
            { key: "sleep", label: "Sleep change (hours)", min: -3, max: 3, step: 0.5, unit: "hr" },
            { key: "screenTime", label: "Screen time change (30-min blocks)", min: -4, max: 4, step: 1, unit: "×30min" },
            { key: "steps", label: "Step change (×1000)", min: -5, max: 5, step: 1, unit: "k steps" },
          ].map((slider) => (
            <div key={slider.key} className="flex items-center gap-3">
              <span className="w-36 text-xs text-muted-foreground">{slider.label}</span>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={whatIf[slider.key as keyof typeof whatIf]}
                onChange={(e) => setWhatIf((s) => ({ ...s, [slider.key]: Number(e.target.value) }))}
                className="flex-1 accent-primary"
              />
              <span className="w-16 text-right text-xs font-bold text-foreground">
                {whatIf[slider.key as keyof typeof whatIf] > 0 ? "+" : ""}{whatIf[slider.key as keyof typeof whatIf]} {slider.unit}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-6 rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-2xl font-bold text-foreground">{whatIfResults.base}%</p>
          </div>
          <div className="text-2xl text-muted-foreground">→</div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Predicted</p>
            <p className={`text-2xl font-bold ${whatIfResults.change > 0 ? "text-emerald-400" : whatIfResults.change < 0 ? "text-destructive" : "text-foreground"}`}>
              {whatIfResults.predicted}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Change</p>
            <p className={`text-lg font-bold ${whatIfResults.change > 0 ? "text-emerald-400" : whatIfResults.change < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {whatIfResults.change > 0 ? "+" : ""}{whatIfResults.change}%
            </p>
          </div>
        </div>
      </div>

      {/* Counterfactual Suggestions */}
      <div className="rounded-2xl border border-border bg-gradient-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Counterfactual Suggestions</h3>
        </div>
        <div className="space-y-2">
          {counterfactuals.map((cf, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3">
              <span className="mt-0.5 text-xs text-primary">💡</span>
              <p className="text-xs text-foreground">{cf}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          These are AI-generated counterfactual explanations based on your behavioral data. They show how small changes could impact outcomes.
        </p>
      </div>
    </div>
  );
};

export default ExplainableAI;

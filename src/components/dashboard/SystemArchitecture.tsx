import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Database, Brain, Target, Sliders, BarChart3, Eye, Layout } from "lucide-react";

const steps = [
  { icon: Database, label: "User Input", desc: "Goals, priorities, constraints, daily logs", color: "bg-primary/10 text-primary" },
  { icon: BarChart3, label: "Behavior Tracking", desc: "Screen time, steps, spending, sleep patterns", color: "bg-primary/10 text-primary" },
  { icon: Target, label: "Goal Extraction", desc: "Structured variables with priority_rank & weight", color: "bg-primary/10 text-primary" },
  { icon: Sliders, label: "Priority Weighting", desc: "MCDA normalized weights: w₁…w₅ summing to 1.0", color: "bg-primary/10 text-primary" },
  { icon: Brain, label: "Decision Optimization", desc: "Weighted LifeScore = Σ(wᵢ × sᵢ) + AI conflict resolution", color: "bg-primary/10 text-primary" },
  { icon: BarChart3, label: "Life Simulation", desc: "30-day projections with behavioral change scenarios", color: "bg-primary/10 text-primary" },
  { icon: Eye, label: "Explainable AI", desc: "Feature attribution, counterfactuals, what-if analysis", color: "bg-primary/10 text-primary" },
  { icon: Layout, label: "Dashboard Visualization", desc: "Real-time analytics, trends, evaluation metrics", color: "bg-primary/10 text-primary" },
];

const modules = [
  { name: "Goal Extraction Module", tables: ["goals", "onboarding_state"], functions: ["GoalsPanel", "OnboardingWizard"] },
  { name: "Multi-Variable Decision Engine", tables: ["goals", "life_scores"], functions: ["ai-decision-engine", "mcda-engine"] },
  { name: "Life Outcome Prediction Engine", tables: ["predictions", "prediction_feedback", "model_metrics"], functions: ["ai-predict", "PredictionEngine"] },
  { name: "Scenario Simulation Module", tables: ["life_simulations"], functions: ["ai-model-health", "LifeSimulator"] },
  { name: "AI Recommendation System", tables: ["recommendation_history", "coaching_plans", "nudges"], functions: ["ai-coach", "ai-decision-engine"] },
  { name: "Dashboard Visualization", tables: ["weekly_feedback", "experiment_results"], functions: ["AdvancedAnalytics", "EvaluationPipeline", "ExperimentMode"] },
];

const SystemArchitecture = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Layout className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">System Architecture</h2>
        <p className="text-xs text-muted-foreground">End-to-end data flow pipeline</p>
      </div>
    </div>

    {/* Pipeline Flow */}
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Processing Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${step.color}`}>
                  <step.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{step.label}</p>
                  <p className="text-[9px] text-muted-foreground max-w-[140px]">{step.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Module Map */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((mod) => (
        <Card key={mod.name} className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">{mod.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Tables</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {mod.tables.map((t) => (
                  <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Components / Functions</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {mod.functions.map((f) => (
                  <span key={f} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary">{f}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* MCDA Formula */}
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Mathematical Model</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm text-foreground text-center">
          LifeScore = w₁·Productivity + w₂·Physical + w₃·Financial + w₄·Wellbeing + w₅·Digital
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground mb-1">Weight Derivation</p>
            <p className="text-[10px] text-muted-foreground">
              wᵢ = (priority_factor × goal_weight + base) / Σ(all weights)<br />
              priority_factor = (6 − priority_rank) / 5<br />
              Normalized so Σwᵢ = 1.0
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground mb-1">Evaluation Metrics</p>
            <p className="text-[10px] text-muted-foreground">
              • Recommendation Accuracy = predicted vs actual outcome<br />
              • Productivity Δ = late_avg − early_avg<br />
              • Goal Completion Rate = avg(weekly goal_progress)<br />
              • User Satisfaction = avg(weekly satisfaction_rating)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default SystemArchitecture;

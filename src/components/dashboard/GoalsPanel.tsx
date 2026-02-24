import { goals } from "@/lib/mockData";
import { Target } from "lucide-react";

const categoryBorder: Record<string, string> = {
  Digital: "border-l-chart-violet",
  Physical: "border-l-chart-emerald",
  Financial: "border-l-chart-amber",
  Productivity: "border-l-chart-teal",
};

const GoalsPanel = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Active Goals
        </h3>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className={`rounded-lg border border-border border-l-[3px] ${categoryBorder[goal.category] || ""} bg-muted/20 p-4`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{goal.title}</p>
              <span className="text-xs font-bold text-primary">{goal.progress}%</span>
            </div>
            <div className="mb-2 h-1.5 rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Current: {goal.current}</span>
              <span>Target: {goal.target}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalsPanel;

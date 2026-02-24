import { coachingPlan } from "@/lib/mockData";
import { CheckCircle2, Circle, Brain } from "lucide-react";

const categoryColors: Record<string, string> = {
  Productivity: "bg-chart-teal text-primary-foreground",
  Digital: "bg-chart-violet text-primary-foreground",
  Physical: "bg-chart-emerald text-primary-foreground",
  Financial: "bg-chart-amber text-primary-foreground",
  Wellbeing: "bg-chart-cyan text-primary-foreground",
};

const CoachingRoadmap = () => {
  const completed = coachingPlan.filter((t) => t.done).length;

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AI 30-Day Plan
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">{completed}/{coachingPlan.length} done</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-gradient-primary transition-all duration-500"
          style={{ width: `${(completed / coachingPlan.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {coachingPlan.map((item) => (
          <div
            key={item.day}
            className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              item.done ? "bg-success/5" : "bg-muted/30 hover:bg-muted/50"
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {item.task}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Day {item.day}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColors[item.category] || "bg-muted text-muted-foreground"}`}>
                  {item.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoachingRoadmap;

import { useState } from "react";
import { CheckCircle2, Circle, Brain, Loader2, Sparkles } from "lucide-react";
import { toggleDailyTask } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CoachingPlan } from "@/hooks/useDashboardData";

const categoryColors: Record<string, string> = {
  Productivity: "bg-chart-teal text-primary-foreground",
  Digital: "bg-chart-violet text-primary-foreground",
  Physical: "bg-chart-emerald text-primary-foreground",
  Financial: "bg-chart-amber text-primary-foreground",
  Wellbeing: "bg-chart-cyan text-primary-foreground",
};

interface Props {
  plan: CoachingPlan | null;
  onRefresh: () => void;
}

const CoachingRoadmap = ({ plan, onRefresh }: Props) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const tasks = plan?.daily_tasks?.sort((a, b) => a.day_number - b.day_number) || [];
  const completed = tasks.filter((t) => t.is_completed).length;

  const handleToggle = async (taskId: string, current: boolean) => {
    try {
      await toggleDailyTask(taskId, !current);
      onRefresh();
    } catch {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("ai-coach", {
        body: { action: "generate-plan" },
      });
      if (error) throw error;
      toast({ title: "Plan generated!", description: "Your AI coaching plan is ready." });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate plan", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">AI Coaching Plan</h3>
        </div>
        <button
          onClick={handleGeneratePlan}
          disabled={generating}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {generating ? "Generating..." : "New Plan"}
        </button>
      </div>

      {tasks.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{completed}/{tasks.length} completed</span>
          </div>
          <div className="mb-4 h-1.5 rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-gradient-primary transition-all duration-500" style={{ width: `${(completed / tasks.length) * 100}%` }} />
          </div>
        </>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No plan yet. Click "New Plan" to generate one with AI!
          </p>
        ) : (
          tasks.map((item) => (
            <button
              key={item.id}
              onClick={() => handleToggle(item.id, item.is_completed)}
              className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                item.is_completed ? "bg-success/5" : "bg-muted/30 hover:bg-muted/50"
              }`}
            >
              {item.is_completed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${item.is_completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {item.task}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Day {item.day_number}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColors[item.category] || "bg-muted text-muted-foreground"}`}>
                    {item.category}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default CoachingRoadmap;

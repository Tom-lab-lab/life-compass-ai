import { useState } from "react";
import { Target, Plus, Trash2, Loader2 } from "lucide-react";
import { createGoal, updateGoal, deleteGoal } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Goal } from "@/hooks/useDashboardData";

const categoryBorder: Record<string, string> = {
  Digital: "border-l-chart-violet",
  Physical: "border-l-chart-emerald",
  Financial: "border-l-chart-amber",
  Productivity: "border-l-chart-teal",
  Wellbeing: "border-l-chart-cyan",
};

interface Props {
  goals: Goal[];
  onRefresh: () => void;
}

const GoalsPanel = ({ goals, onRefresh }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Productivity");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!user || !title.trim()) return;
    setAdding(true);
    try {
      await createGoal({ user_id: user.id, title: title.trim(), category });
      setTitle("");
      setShowAdd(false);
      onRefresh();
    } catch {
      toast({ title: "Error", description: "Failed to create goal", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id);
      onRefresh();
    } catch {
      toast({ title: "Error", description: "Failed to delete goal", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Goals</h3>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <input
            placeholder="Goal title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {["Productivity", "Digital", "Physical", "Financial", "Wellbeing"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={adding || !title.trim()}
              className="rounded-md bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {goals.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No goals yet. Add one!</p>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className={`group rounded-lg border border-border border-l-[3px] ${categoryBorder[goal.category] || ""} bg-muted/20 p-4`}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{goal.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">{goal.progress}%</span>
                  <button onClick={() => handleDelete(goal.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="mb-2 h-1.5 rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-gradient-primary transition-all duration-500" style={{ width: `${goal.progress}%` }} />
              </div>
              {(goal.current_value || goal.target_value) && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Current: {goal.current_value || "—"}</span>
                  <span>Target: {goal.target_value || "—"}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GoalsPanel;

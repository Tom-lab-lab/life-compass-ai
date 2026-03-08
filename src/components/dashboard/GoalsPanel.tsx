import { useState } from "react";
import { Target, Plus, Trash2, Loader2, ChevronDown, ChevronUp, Sliders } from "lucide-react";
import { createGoal, updateGoal, deleteGoal } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logUserActivity } from "@/lib/activityLogger";
import type { Goal } from "@/hooks/useDashboardData";

const categoryBorder: Record<string, string> = {
  Digital: "border-l-chart-violet",
  Physical: "border-l-chart-emerald",
  Financial: "border-l-chart-amber",
  Productivity: "border-l-chart-teal",
  Wellbeing: "border-l-chart-cyan",
  Study: "border-l-chart-violet",
};

const priorityLabels: Record<number, string> = { 1: "Critical", 2: "High", 3: "Medium", 4: "Low", 5: "Optional" };
const priorityColors: Record<number, string> = {
  1: "text-destructive",
  2: "text-chart-amber",
  3: "text-muted-foreground",
  4: "text-muted-foreground",
  5: "text-muted-foreground",
};

interface Props {
  goals: Goal[];
  onRefresh: () => void;
}

const GoalsPanel = ({ goals, onRefresh }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Productivity");
  const [priorityRank, setPriorityRank] = useState(3);
  const [weight, setWeight] = useState(1.0);
  const [riskTolerance, setRiskTolerance] = useState("medium");
  const [timeBudget, setTimeBudget] = useState("");
  const [financialBudget, setFinancialBudget] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [qualitativeNotes, setQualitativeNotes] = useState("");
  const [adding, setAdding] = useState(false);

  const resetForm = () => {
    setTitle(""); setCategory("Productivity"); setPriorityRank(3); setWeight(1.0);
    setRiskTolerance("medium"); setTimeBudget(""); setFinancialBudget("");
    setTargetValue(""); setDeadline(""); setQualitativeNotes("");
  };

  const handleAdd = async () => {
    if (!user || !title.trim()) return;
    setAdding(true);
    try {
      await createGoal({
        user_id: user.id,
        title: title.trim(),
        category,
        target_value: targetValue || undefined,
        deadline: deadline || undefined,
        priority_rank: priorityRank,
        weight,
        risk_tolerance: riskTolerance,
        time_budget_hours: timeBudget ? parseFloat(timeBudget) : undefined,
        financial_budget: financialBudget ? parseFloat(financialBudget) : undefined,
        qualitative_notes: qualitativeNotes || undefined,
      });
      resetForm();
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

  // Sort by priority rank then weight
  const sorted = [...goals].sort((a, b) => {
    const pa = (a as any).priority_rank ?? 3;
    const pb = (b as any).priority_rank ?? 3;
    if (pa !== pb) return pa - pb;
    return ((b as any).weight ?? 1) - ((a as any).weight ?? 1);
  });

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Structured Goals
          </h3>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <input
            placeholder="Goal title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {["Productivity", "Digital", "Physical", "Financial", "Wellbeing", "Study"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Priority</label>
              <select value={priorityRank} onChange={(e) => setPriorityRank(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {[1, 2, 3, 4, 5].map((p) => (
                  <option key={p} value={p}>{priorityLabels[p]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground">
              Weight (importance: {weight.toFixed(1)})
            </label>
            <input type="range" min="0.1" max="3.0" step="0.1" value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full accent-primary" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Target Value</label>
              <input placeholder="e.g., 10000 steps" value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Risk Tolerance</label>
            <select value={riskTolerance} onChange={(e) => setRiskTolerance(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="low">Low — Prefer safe, incremental changes</option>
              <option value="medium">Medium — Balanced approach</option>
              <option value="high">High — Willing to take big leaps</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Time Budget (hrs/week)</label>
              <input type="number" min="0" step="0.5" placeholder="Optional" value={timeBudget}
                onChange={(e) => setTimeBudget(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Financial Budget (₹/mo)</label>
              <input type="number" min="0" step="100" placeholder="Optional" value={financialBudget}
                onChange={(e) => setFinancialBudget(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Notes (qualitative goals)</label>
            <textarea placeholder="Describe your goal in your own words..." value={qualitativeNotes}
              onChange={(e) => setQualitativeNotes(e.target.value)} rows={2}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>

          <button onClick={handleAdd} disabled={adding || !title.trim()}
            className="w-full rounded-md bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
            {adding ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : "Add Structured Goal"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No goals yet. Add one!</p>
        ) : (
          sorted.map((goal) => {
            const g = goal as any;
            const isExpanded = expandedGoal === goal.id;
            return (
              <div key={goal.id} className={`group rounded-lg border border-border border-l-[3px] ${categoryBorder[goal.category] || ""} bg-muted/20`}>
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{goal.title}</p>
                      <span className={`text-[10px] font-bold ${priorityColors[g.priority_rank ?? 3]}`}>
                        {priorityLabels[g.priority_rank ?? 3]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{goal.progress}%</span>
                      <button onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                        className="text-muted-foreground hover:text-foreground">
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      <button onClick={() => handleDelete(goal.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="mb-2 h-1.5 rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-gradient-primary transition-all duration-500" style={{ width: `${goal.progress}%` }} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>W: {(g.weight ?? 1).toFixed(1)}</span>
                    {goal.deadline && <span>Due: {goal.deadline}</span>}
                    {g.risk_tolerance && <span>Risk: {g.risk_tolerance}</span>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-1 text-[11px] text-muted-foreground">
                    {goal.target_value && <p><strong>Target:</strong> {goal.target_value}</p>}
                    {goal.current_value && <p><strong>Current:</strong> {goal.current_value}</p>}
                    {g.time_budget_hours && <p><strong>Time Budget:</strong> {g.time_budget_hours} hrs/week</p>}
                    {g.financial_budget && <p><strong>Financial Budget:</strong> ₹{g.financial_budget}/mo</p>}
                    {g.qualitative_notes && <p><strong>Notes:</strong> {g.qualitative_notes}</p>}
                    {goal.domain && <p><strong>Domain:</strong> {goal.domain}</p>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GoalsPanel;

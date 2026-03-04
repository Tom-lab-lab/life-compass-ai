import { useState } from "react";
import { Brain, Loader2, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Goal } from "@/hooks/useDashboardData";

interface ConflictItem {
  goals: string[];
  type: string;
  resolution: string;
}

interface RoadmapStep {
  week: number;
  action: string;
  goal: string;
  priority: string;
}

interface EngineResult {
  conflicts: ConflictItem[];
  roadmap: RoadmapStep[];
  summary: string;
}

interface Props {
  goals: Goal[];
}

const DecisionEngine = ({ goals }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EngineResult | null>(null);

  const handleAnalyze = async () => {
    if (!user || goals.length < 2) {
      toast({ title: "Need more goals", description: "Add at least 2 goals to run the decision engine.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-decision-engine", {
        body: { goals },
      });
      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to analyze", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Multi-Variable Decision Engine
          </h3>
        </div>
        <button onClick={handleAnalyze} disabled={loading || goals.length < 2}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
          {loading ? "Analyzing..." : "Analyze Goals"}
        </button>
      </div>

      {!result && !loading && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {goals.length < 2
            ? "Add at least 2 structured goals to run the decision engine."
            : "Click \"Analyze Goals\" to detect conflicts, resolve trade-offs, and generate an action roadmap."}
        </p>
      )}

      {result && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm text-foreground">{result.summary}</p>
          </div>

          {/* Conflicts */}
          {result.conflicts.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                <AlertTriangle className="h-3 w-3 text-chart-amber" /> Detected Conflicts
              </h4>
              <div className="space-y-2">
                {result.conflicts.map((c, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-foreground">
                      {c.goals.join(" vs ")} — <span className="text-chart-amber">{c.type}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{c.resolution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roadmap */}
          {result.roadmap.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                <CheckCircle2 className="h-3 w-3 text-success" /> Action Roadmap
              </h4>
              <div className="space-y-1.5">
                {result.roadmap.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/20 px-3 py-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      W{step.week}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-foreground">{step.action}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{step.goal}</span>
                        <ArrowRight className="h-2 w-2" />
                        <span>{step.priority}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DecisionEngine;

import { useState } from "react";
import { Brain, TrendingUp, TrendingDown, Minus, ThumbsUp, ThumbsDown, AlertCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { generatePredictions, submitFeedback } from "@/lib/prediction-api";
import { useToast } from "@/hooks/use-toast";

interface Prediction {
  id: string;
  domain: string;
  prediction_text: string;
  risk_score: number;
  confidence_score: number;
  trend_direction: string;
  pattern_explanation: string | null;
  status: string;
  created_at: string;
}

interface Props {
  predictions: Prediction[];
  onRefresh: () => void;
}

const domainColors: Record<string, string> = {
  spending: "text-amber-400",
  screen_time: "text-violet-400",
  sleep: "text-blue-400",
  exercise: "text-emerald-400",
  study: "text-cyan-400",
  tasks: "text-rose-400",
  general: "text-muted-foreground",
};

const domainLabels: Record<string, string> = {
  spending: "Spending",
  screen_time: "Screen Time",
  sleep: "Sleep",
  exercise: "Exercise",
  study: "Study",
  tasks: "Tasks",
  general: "General",
};

const TrendIcon = ({ dir }: { dir: string }) => {
  if (dir === "rising") return <TrendingUp className="h-3.5 w-3.5 text-destructive" />;
  if (dir === "falling") return <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const RiskBadge = ({ score }: { score: number }) => {
  const color = score >= 70 ? "bg-destructive/20 text-destructive" : score >= 40 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400";
  const label = score >= 70 ? "High Risk" : score >= 40 ? "Medium" : "Low Risk";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>{label} {score}%</span>;
};

const PredictionEngine = ({ predictions, onRefresh }: Props) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generatePredictions();
      toast({ title: "Predictions generated", description: "AI analyzed your data and created new predictions." });
      onRefresh();
    } catch {
      toast({ title: "Error", description: "Failed to generate predictions.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleFeedback = async (predId: string, type: string) => {
    try {
      await submitFeedback(predId, type);
      setFeedbackSent((s) => new Set(s).add(predId));
      toast({ title: "Feedback recorded", description: "Your input helps improve future predictions." });
      onRefresh();
    } catch {
      toast({ title: "Error", description: "Failed to submit feedback.", variant: "destructive" });
    }
  };

  const pending = predictions.filter((p) => p.status === "pending");

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Prediction Engine</h3>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {generating ? "Analyzing…" : "Generate"}
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No active predictions yet.</p>
          <p className="text-xs text-muted-foreground">Log some data, then click Generate.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((pred) => (
            <div key={pred.id} className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase ${domainColors[pred.domain] || "text-muted-foreground"}`}>
                  {domainLabels[pred.domain] || pred.domain}
                </span>
                <div className="flex items-center gap-2">
                  <TrendIcon dir={pred.trend_direction} />
                  <RiskBadge score={pred.risk_score} />
                </div>
              </div>

              <p className="mb-1.5 text-sm font-medium text-foreground">{pred.prediction_text}</p>

              {pred.pattern_explanation && (
                <p className="mb-2 text-xs text-muted-foreground">{pred.pattern_explanation}</p>
              )}

              <div className="mb-3 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>Confidence: {pred.confidence_score}%</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(pred.created_at).toLocaleDateString()}
                </span>
              </div>

              {!feedbackSent.has(pred.id) ? (
                <div className="flex items-center gap-1.5">
                  <span className="mr-1 text-[10px] text-muted-foreground">Was this helpful?</span>
                  {[
                    { type: "helpful", icon: ThumbsUp, label: "Yes" },
                    { type: "wrong", icon: ThumbsDown, label: "Wrong" },
                    { type: "too_frequent", icon: Clock, label: "Too frequent" },
                    { type: "not_relevant", icon: AlertCircle, label: "Not relevant" },
                  ].map((fb) => (
                    <button
                      key={fb.type}
                      onClick={() => handleFeedback(pred.id, fb.type)}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <fb.icon className="h-3 w-3" />
                      {fb.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-primary">✓ Feedback recorded — thank you!</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PredictionEngine;

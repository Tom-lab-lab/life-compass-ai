import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ClipboardCheck, Loader2 } from "lucide-react";

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

interface Props {
  onSubmitted?: () => void;
}

const WeeklyFeedbackPanel = ({ onSubmitted }: Props) => {
  const { user } = useAuth();
  const [productivity, setProductivity] = useState(50);
  const [goalProgress, setGoalProgress] = useState(50);
  const [decisionAccuracy, setDecisionAccuracy] = useState(50);
  const [satisfaction, setSatisfaction] = useState(50);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (productivity < 0 || productivity > 100 || goalProgress < 0 || goalProgress > 100 || decisionAccuracy < 0 || decisionAccuracy > 100 || satisfaction < 0 || satisfaction > 100) {
      toast.error("All scores must be between 0 and 100");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("weekly_feedback" as any).insert({
        user_id: user.id,
        week_number: getISOWeek(new Date()),
        productivity_score: productivity,
        goal_progress: goalProgress,
        decision_accuracy: decisionAccuracy,
        satisfaction_rating: satisfaction,
        feedback: feedback.trim() || null,
      } as any);

      if (error) throw error;
      toast.success("Weekly feedback submitted!");
      setProductivity(50);
      setGoalProgress(50);
      setDecisionAccuracy(50);
      setSatisfaction(50);
      setFeedback("");
      onSubmitted?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const sliders = [
    { label: "Productivity Score", value: productivity, set: setProductivity, color: "text-primary" },
    { label: "Goal Progress %", value: goalProgress, set: setGoalProgress, color: "text-accent" },
    { label: "AI Decision Accuracy", value: decisionAccuracy, set: setDecisionAccuracy, color: "text-secondary-foreground" },
    { label: "Satisfaction Rating", value: satisfaction, set: setSatisfaction, color: "text-primary" },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Weekly Feedback</CardTitle>
            <p className="text-xs text-muted-foreground">Week {getISOWeek(new Date())} — Rate your performance</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {sliders.map((s) => (
          <div key={s.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">{s.label}</Label>
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
            </div>
            <Slider min={0} max={100} step={1} value={[s.value]} onValueChange={([v]) => s.set(v)} />
          </div>
        ))}

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Written Feedback (optional)</Label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share thoughts on this week's AI recommendations, goals, or challenges..."
            className="min-h-[80px] resize-none text-sm"
            maxLength={1000}
          />
        </div>

        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
          Submit Weekly Report
        </Button>
      </CardContent>
    </Card>
  );
};

export default WeeklyFeedbackPanel;

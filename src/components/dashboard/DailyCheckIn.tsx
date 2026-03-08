import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Sun, CheckCircle2 } from "lucide-react";
import { logUserActivity } from "@/lib/activityLogger";

export function calculateDailyLifeScore(
  productivityScore: number,
  sleepHours: number,
  exerciseDone: boolean,
  stressLevel: number
): number {
  const score =
    productivityScore * 0.4 +
    (sleepHours / 8) * 10 * 0.2 +
    (exerciseDone ? 1 : 0) * 10 * 0.2 +
    (10 - stressLevel) * 0.2;
  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}

interface DailyCheckInProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const DailyCheckIn = ({ open, onClose, onSaved }: DailyCheckInProps) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [productivityScore, setProductivityScore] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [spendingAmount, setSpendingAmount] = useState(0);
  const [stressLevel, setStressLevel] = useState(5);
  const [optionalNote, setOptionalNote] = useState("");

  const lifeScore = calculateDailyLifeScore(productivityScore, sleepHours, exerciseDone, stressLevel);

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("daily_checkins" as any).upsert(
        {
          user_id: user.id,
          date: today,
          productivity_score: productivityScore,
          sleep_hours: sleepHours,
          exercise_done: exerciseDone,
          spending_amount: spendingAmount,
          stress_level: stressLevel,
          optional_note: optionalNote || null,
        },
        { onConflict: "user_id,date" }
      );

      if (error) throw error;

      logUserActivity(user.id, "submit", "daily_checkin", `life_score=${lifeScore}`);
      toast.success("Daily check-in saved!", { description: `Life Score: ${lifeScore}/10` });
      onSaved();
    } catch (err: any) {
      console.error("Check-in error:", err);
      toast.error("Failed to save check-in", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Sun className="h-5 w-5 text-accent" />
            Daily Check-In
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            How was your day? Quick check-in to track your progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Life Score Preview */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">Today's Life Score</span>
            <span className="text-2xl font-bold text-primary">{lifeScore}</span>
          </div>

          {/* Productivity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Productivity</Label>
              <span className="text-sm font-semibold text-primary">{productivityScore}/10</span>
            </div>
            <Slider
              value={[productivityScore]}
              onValueChange={(v) => setProductivityScore(v[0])}
              min={0} max={10} step={1}
            />
          </div>

          {/* Sleep */}
          <div className="space-y-2">
            <Label className="text-foreground">Sleep Hours</Label>
            <Input
              type="number"
              min={0} max={24} step={0.5}
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
              className="bg-muted"
            />
          </div>

          {/* Exercise */}
          <div className="flex items-center justify-between">
            <Label className="text-foreground">Exercise Done?</Label>
            <Switch checked={exerciseDone} onCheckedChange={setExerciseDone} />
          </div>

          {/* Spending */}
          <div className="space-y-2">
            <Label className="text-foreground">Spending Amount (₹)</Label>
            <Input
              type="number"
              min={0} step={10}
              value={spendingAmount}
              onChange={(e) => setSpendingAmount(parseFloat(e.target.value) || 0)}
              className="bg-muted"
            />
          </div>

          {/* Stress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Stress Level</Label>
              <span className="text-sm font-semibold text-destructive">{stressLevel}/10</span>
            </div>
            <Slider
              value={[stressLevel]}
              onValueChange={(v) => setStressLevel(v[0])}
              min={0} max={10} step={1}
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-foreground">Note (optional)</Label>
            <Textarea
              placeholder="How are you feeling today?"
              value={optionalNote}
              onChange={(e) => setOptionalNote(e.target.value)}
              className="bg-muted resize-none"
              maxLength={500}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {saving ? "Saving..." : "Submit Check-In"}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default DailyCheckIn;

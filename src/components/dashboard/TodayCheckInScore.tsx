import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { calculateDailyLifeScore } from "./DailyCheckIn";
import { Sun, Zap, Moon, Dumbbell, Brain } from "lucide-react";

const TodayCheckInScore = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    (supabase.from("daily_checkins" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle() as any)
      .then(({ data: row }: any) => {
        if (row) setData(row);
      });
  }, [user?.id]);

  if (!data) return null;

  const lifeScore = calculateDailyLifeScore(
    data.productivity_score,
    data.sleep_hours,
    data.exercise_done,
    data.stress_level
  );

  const percentage = (lifeScore / 10) * 100;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (percentage / 100) * circumference;

  const metrics = [
    { icon: Zap, label: "Productivity", value: `${data.productivity_score}/10`, color: "text-primary" },
    { icon: Moon, label: "Sleep", value: `${data.sleep_hours}h`, color: "text-chart-violet" },
    { icon: Dumbbell, label: "Exercise", value: data.exercise_done ? "Yes" : "No", color: data.exercise_done ? "text-success" : "text-muted-foreground" },
    { icon: Brain, label: "Stress", value: `${data.stress_level}/10`, color: "text-destructive" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.05s" }}>
      <div className="mb-4 flex items-center gap-2">
        <Sun className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Today's Check-In
        </h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Mini ring */}
        <div className="relative shrink-0">
          <svg width="88" height="88" className="-rotate-90">
            <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="44" cy="44" r="36" fill="none" stroke="url(#checkinGrad)" strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="checkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(38, 92%, 55%)" />
                <stop offset="100%" stopColor="hsl(168, 76%, 40%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground">{lifeScore}</span>
            <span className="text-[9px] font-medium text-muted-foreground">/ 10</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex-1 space-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
              <span className="flex-1 text-xs text-muted-foreground">{m.label}</span>
              <span className={`text-xs font-semibold ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TodayCheckInScore;

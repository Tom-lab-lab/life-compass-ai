import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { calculateDailyLifeScore } from "./DailyCheckIn";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, Moon, Brain, Loader2 } from "lucide-react";

interface CheckIn {
  date: string;
  productivity_score: number;
  sleep_hours: number;
  exercise_done: boolean;
  spending_amount: number;
  stress_level: number;
}

const CheckInAnalytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: rows, error } = await (supabase.from("daily_checkins" as any)
        .select("date, productivity_score, sleep_hours, exercise_done, spending_amount, stress_level")
        .eq("user_id", user.id)
        .order("date", { ascending: true })
        .limit(30) as any);
      if (!error && rows) setData(rows);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No check-in data yet. Complete your first daily check-in!</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    productivity: d.productivity_score,
    sleep: d.sleep_hours,
    stress: d.stress_level,
    lifeScore: calculateDailyLifeScore(d.productivity_score, d.sleep_hours, d.exercise_done, d.stress_level),
    spending: d.spending_amount,
  }));

  const last7 = chartData.slice(-7);
  const avgScore = last7.length > 0
    ? Math.round((last7.reduce((s, d) => s + d.lifeScore, 0) / last7.length) * 10) / 10
    : 0;
  const avgProductivity = last7.length > 0
    ? Math.round((last7.reduce((s, d) => s + d.productivity, 0) / last7.length) * 10) / 10
    : 0;

  const tooltipStyle = {
    background: "hsl(222, 40%, 9%)",
    border: "1px solid hsl(222, 20%, 16%)",
    borderRadius: "8px",
    fontSize: "12px",
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Brain className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Weekly Score</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-primary">{avgScore}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Productivity</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{avgProductivity}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Moon className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Check-ins</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{data.length}</p>
        </div>
      </div>

      {/* Life Score + Productivity Trend */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Life Score & Productivity Trend
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="lifeScoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(168, 76%, 40%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(168, 76%, 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area type="monotone" dataKey="lifeScore" stroke="hsl(168, 76%, 40%)" strokeWidth={2} fill="url(#lifeScoreGrad)" name="Life Score" />
              <Area type="monotone" dataKey="productivity" stroke="hsl(190, 80%, 50%)" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="Productivity" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stress vs Sleep */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Stress vs Sleep Trend
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="stress" stroke="hsl(0, 72%, 55%)" strokeWidth={2} dot={{ r: 3 }} name="Stress" />
              <Line type="monotone" dataKey="sleep" stroke="hsl(250, 70%, 60%)" strokeWidth={2} dot={{ r: 3 }} name="Sleep (hrs)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CheckInAnalytics;

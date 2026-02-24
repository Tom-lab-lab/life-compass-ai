import type { LifeScore } from "@/hooks/useDashboardData";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp } from "lucide-react";

interface Props {
  scores: LifeScore[];
}

const ProductivityForecast = ({ scores }: Props) => {
  const chartData = [...scores].reverse().map((s, i) => ({
    day: i + 1,
    score: s.overall,
    productivity: s.productivity,
  }));

  const latest = scores[0];
  const predicted = latest ? Math.min(100, latest.overall + Math.round(Math.random() * 5 + 2)) : 70;

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">30-Day Forecast</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{predicted}</span>
          <span className="flex items-center gap-1 text-xs font-medium text-success">
            <TrendingUp className="h-3 w-3" /> predicted
          </span>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(168, 76%, 40%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(168, 76%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[40, 100]} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
            <Tooltip contentStyle={{ background: "hsl(222, 40%, 9%)", border: "1px solid hsl(222, 20%, 16%)", borderRadius: "8px", fontSize: "12px" }} />
            <Area type="monotone" dataKey="score" stroke="hsl(168, 76%, 40%)" strokeWidth={2} fill="url(#forecastGrad)" name="Overall" />
            <Area type="monotone" dataKey="productivity" stroke="hsl(190, 80%, 50%)" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="Productivity" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProductivityForecast;

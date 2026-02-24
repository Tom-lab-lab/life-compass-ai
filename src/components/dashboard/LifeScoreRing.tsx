import { TrendingUp } from "lucide-react";
import type { LifeScore } from "@/hooks/useDashboardData";

interface Props {
  scores: LifeScore[];
}

const LifeScoreRing = ({ scores }: Props) => {
  const latest = scores[0];
  const prev = scores[1];

  if (!latest) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Unified Life Score</h3>
        <p className="mt-4 text-sm text-muted-foreground">No score data yet.</p>
      </div>
    );
  }

  const trend = prev ? latest.overall - prev.overall : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (latest.overall / 100) * circumference;

  const categories = [
    { key: "productivity" as const, label: "Productivity", color: "bg-chart-teal" },
    { key: "wellbeing" as const, label: "Wellbeing", color: "bg-chart-cyan" },
    { key: "financial" as const, label: "Financial", color: "bg-chart-amber" },
    { key: "physical" as const, label: "Physical", color: "bg-chart-emerald" },
    { key: "digital" as const, label: "Digital", color: "bg-chart-violet" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Unified Life Score
        </h3>
        {trend !== 0 && (
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            trend > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            <TrendingUp className={`h-3 w-3 ${trend < 0 ? "rotate-180" : ""}`} />
            {trend > 0 ? "+" : ""}{trend}
          </span>
        )}
      </div>

      <div className="flex items-center gap-8">
        <div className="relative shrink-0">
          <svg width="130" height="130" className="-rotate-90">
            <circle cx="65" cy="65" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="65" cy="65" r="54" fill="none" stroke="url(#scoreGradient)" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(168, 76%, 40%)" />
                <stop offset="100%" stopColor="hsl(190, 80%, 50%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{latest.overall}</span>
            <span className="text-[10px] font-medium text-muted-foreground">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {categories.map((cat) => (
            <div key={cat.key} className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${cat.color}`} />
              <span className="w-24 text-xs text-muted-foreground">{cat.label}</span>
              <div className="flex-1">
                <div className="h-1.5 rounded-full bg-muted">
                  <div className={`h-1.5 rounded-full ${cat.color} transition-all duration-700`} style={{ width: `${latest[cat.key]}%` }} />
                </div>
              </div>
              <span className="w-8 text-right text-xs font-semibold text-foreground">{latest[cat.key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LifeScoreRing;

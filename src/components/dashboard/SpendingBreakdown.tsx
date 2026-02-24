import type { ActivityLog } from "@/hooks/useDashboardData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  logs: ActivityLog[];
}

const COLORS: Record<string, string> = {
  Food: "hsl(168, 76%, 40%)",
  Transport: "hsl(190, 80%, 50%)",
  Shopping: "hsl(38, 92%, 55%)",
  Bills: "hsl(265, 70%, 60%)",
  Entertainment: "hsl(0, 72%, 55%)",
};

const SpendingBreakdown = ({ logs }: Props) => {
  const grouped: Record<string, number> = {};
  logs.forEach((l) => {
    const cat = l.category || "Other";
    grouped[cat] = (grouped[cat] || 0) + Number(l.value);
  });

  const data = Object.entries(grouped).map(([category, amount]) => ({
    category,
    amount: Math.round(amount),
    color: COLORS[category] || "hsl(215, 20%, 55%)",
  }));

  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Monthly Spending</h3>
      <div className="flex items-center gap-6">
        <div className="h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="amount" cx="50%" cy="50%" innerRadius={38} outerRadius={60} strokeWidth={0}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(222, 40%, 9%)", border: "1px solid hsl(222, 20%, 16%)", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2.5">
          {data.map((d) => (
            <div key={d.category} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="flex-1 text-xs text-muted-foreground">{d.category}</span>
              <span className="text-xs font-semibold text-foreground">₹{d.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total</span>
              <span className="text-sm font-bold text-foreground">₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingBreakdown;

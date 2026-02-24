import type { Intervention } from "@/hooks/useDashboardData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Lightbulb } from "lucide-react";

interface Props {
  interventions: Intervention[];
}

const InterventionReport = ({ interventions }: Props) => {
  const chartData = interventions.map((i) => ({
    name: i.name,
    accepted: i.times_shown > 0 ? Math.round((i.times_accepted / i.times_shown) * 100) : 0,
    impact: i.impact_score,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.45s" }}>
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Intervention Effectiveness</h3>
      </div>
      {chartData.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No intervention data yet.</p>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" barCategoryGap="18%">
              <XAxis type="number" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(222, 40%, 9%)", border: "1px solid hsl(222, 20%, 16%)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="accepted" fill="hsl(168, 76%, 40%)" radius={[0, 4, 4, 0]} name="Accepted %" />
              <Bar dataKey="impact" fill="hsl(190, 80%, 50%)" radius={[0, 4, 4, 0]} name="Impact Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default InterventionReport;

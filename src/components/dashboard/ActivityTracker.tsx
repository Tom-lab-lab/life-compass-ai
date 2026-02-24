import { activityData } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts";
import { Footprints } from "lucide-react";

const ActivityTracker = () => {
  const todaySteps = activityData[activityData.length - 1].steps;

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.25s" }}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Step Tracking
        </h3>
        <div className="flex items-center gap-2">
          <Footprints className="h-4 w-4 text-success" />
          <span className="text-lg font-bold text-foreground">{todaySteps.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">today</span>
        </div>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activityData}>
            <XAxis dataKey="day" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
            <Tooltip
              contentStyle={{
                background: "hsl(222, 40%, 9%)",
                border: "1px solid hsl(222, 20%, 16%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <ReferenceLine y={8000} stroke="hsl(168, 76%, 40%)" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Bar dataKey="steps" fill="hsl(152, 69%, 45%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityTracker;

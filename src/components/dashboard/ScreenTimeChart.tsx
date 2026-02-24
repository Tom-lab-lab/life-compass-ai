import { screenTimeData } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

const ScreenTimeChart = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Screen Time Breakdown
      </h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={screenTimeData} barCategoryGap="20%">
            <XAxis dataKey="day" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip
              contentStyle={{
                background: "hsl(222, 40%, 9%)",
                border: "1px solid hsl(222, 20%, 16%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value} min`]}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="productive" stackId="a" fill="hsl(168, 76%, 40%)" radius={[0, 0, 0, 0]} name="Productive" />
            <Bar dataKey="social" stackId="a" fill="hsl(265, 70%, 60%)" name="Social" />
            <Bar dataKey="entertainment" stackId="a" fill="hsl(38, 92%, 55%)" radius={[4, 4, 0, 0]} name="Entertainment" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScreenTimeChart;

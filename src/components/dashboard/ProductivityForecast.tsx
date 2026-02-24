import { productivityForecast } from "@/lib/mockData";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { AlertTriangle, TrendingUp } from "lucide-react";

const ProductivityForecast = () => {
  const { predicted, confidence, riskFactors, history } = productivityForecast;

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          30-Day Forecast
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{predicted}</span>
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1 text-xs font-medium text-success">
              <TrendingUp className="h-3 w-3" /> predicted
            </span>
            <span className="text-[10px] text-muted-foreground">{Math.round(confidence * 100)}% confidence</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-4 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(168, 76%, 40%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(168, 76%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[40, 100]} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
            <Tooltip
              contentStyle={{
                background: "hsl(222, 40%, 9%)",
                border: "1px solid hsl(222, 20%, 16%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area type="monotone" dataKey="score" stroke="hsl(168, 76%, 40%)" strokeWidth={2} fill="url(#forecastGrad)" />
            <Area type="monotone" dataKey="predicted" stroke="hsl(190, 80%, 50%)" strokeWidth={2} strokeDasharray="4 4" fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Risk factors */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Risk Factors</p>
        {riskFactors.map((rf, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${
              rf.severity === "high" ? "text-destructive" : rf.severity === "medium" ? "text-warning" : "text-muted-foreground"
            }`} />
            <span className="flex-1 text-xs text-foreground">{rf.label}</span>
            <span className="text-xs font-semibold text-destructive">{rf.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductivityForecast;

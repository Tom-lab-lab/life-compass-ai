import type { ActivityLog } from "@/hooks/useDashboardData";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));

const getColor = (value: number) => {
  if (value < 20) return "bg-muted/30";
  if (value < 40) return "bg-primary/20";
  if (value < 60) return "bg-primary/40";
  if (value < 80) return "bg-primary/60";
  return "bg-primary/90";
};

interface Props {
  logs: ActivityLog[];
}

const BehavioralHeatmap = ({ logs }: Props) => {
  // Build heatmap from screen_time logs: group by day-of-week and hour
  const heatmapData: { day: number; hour: number; value: number }[] = [];
  const grid: Record<string, number> = {};

  logs.forEach((l) => {
    const d = new Date(l.logged_at);
    const dayIdx = (d.getDay() + 6) % 7; // Mon=0
    const hour = d.getHours();
    const key = `${dayIdx}-${hour}`;
    grid[key] = (grid[key] || 0) + Number(l.value);
  });

  const maxVal = Math.max(1, ...Object.values(grid));

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const raw = grid[`${day}-${hour}`] || 0;
      heatmapData.push({ day, hour, value: Math.round((raw / maxVal) * 100) });
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.5s" }}>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Screen Time Heatmap
      </h3>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="mb-1 flex items-center gap-[2px] pl-10">
            {hours.filter((_, i) => i % 3 === 0).map((h) => (
              <span key={h} className="w-[36px] text-center text-[9px] text-muted-foreground">{h}:00</span>
            ))}
          </div>

          {/* Grid */}
          {days.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-[2px]">
              <span className="w-8 text-right text-[10px] text-muted-foreground mr-2">{day}</span>
              {Array.from({ length: 24 }, (_, hour) => {
                const cell = heatmapData.find((d) => d.day === dayIdx && d.hour === hour);
                return (
                  <div
                    key={hour}
                    className={`h-4 w-[22px] rounded-sm ${getColor(cell?.value || 0)} transition-colors`}
                    title={`${day} ${hours[hour]}:00 — ${cell?.value || 0}%`}
                  />
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="mt-3 flex items-center gap-2 pl-10">
            <span className="text-[9px] text-muted-foreground">Less</span>
            {["bg-muted/30", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/90"].map((c, i) => (
              <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
            ))}
            <span className="text-[9px] text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehavioralHeatmap;

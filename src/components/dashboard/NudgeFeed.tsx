import type { Nudge } from "@/hooks/useDashboardData";
import { Bell, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const iconMap = { warning: AlertTriangle, success: CheckCircle2, info: Info };
const styleMap = { warning: "border-warning/20 bg-warning/5", success: "border-success/20 bg-success/5", info: "border-info/20 bg-info/5" };
const iconStyleMap = { warning: "text-warning", success: "text-success", info: "text-info" };

interface Props {
  nudges: Nudge[];
}

const NudgeFeed = ({ nudges }: Props) => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: "0.35s" }}>
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Smart Nudges</h3>
      </div>
      <div className="space-y-3 max-h-72 overflow-y-auto">
        {nudges.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No nudges yet.</p>
        ) : (
          nudges.map((nudge) => {
            const type = (nudge.nudge_type as keyof typeof iconMap) || "info";
            const Icon = iconMap[type] || Info;
            return (
              <div key={nudge.id} className={`flex items-start gap-3 rounded-lg border p-3 ${styleMap[type] || styleMap.info}`}>
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconStyleMap[type] || iconStyleMap.info}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{nudge.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(nudge.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NudgeFeed;

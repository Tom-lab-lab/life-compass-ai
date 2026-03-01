import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import {
  LayoutDashboard,
  Brain,
  Target,
  Activity,
  BarChart3,
  Shield,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  TrendingUp,
  FlaskConical,
  Bell,
  Lock,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, labelKey: "nav.overview", id: "overview" },
  { icon: Brain, labelKey: "nav.coach", id: "coach" },
  { icon: Target, labelKey: "nav.goals", id: "goals" },
  { icon: Activity, labelKey: "nav.activity", id: "activity" },
  { icon: BarChart3, labelKey: "nav.predictions", id: "predictions" },
  { icon: Sparkles, labelKey: "nav.explainable", id: "explainable" },
  { icon: Shield, labelKey: "nav.accuracy", id: "accuracy" },
  { icon: TrendingUp, labelKey: "nav.analytics", id: "analytics" },
  { icon: FlaskConical, labelKey: "nav.research", id: "research" },
  { icon: Bell, labelKey: "nav.notifications", id: "notifications" },
  { icon: Lock, labelKey: "nav.privacy", id: "privacy" },
  { icon: Settings, labelKey: "nav.settings", id: "settings" },
];

interface AppSidebarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

const AppSidebar = ({ activeSection, onNavigate }: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  const { t } = useLocale();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-foreground">
            ULA<span className="text-primary"> v2</span>
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              activeSection === item.id
                ? "bg-primary/10 text-primary glow-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>{t(item.labelKey)}</span>}
          </button>
        ))}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t("nav.signout")}</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg py-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;

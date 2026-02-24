import { useState } from "react";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: Brain, label: "AI Coach", id: "coach" },
  { icon: Target, label: "Goals", id: "goals" },
  { icon: Activity, label: "Activity", id: "activity" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: Shield, label: "Safety", id: "safety" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface AppSidebarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

const AppSidebar = ({ activeSection, onNavigate }: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
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

      {/* Nav */}
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
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
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

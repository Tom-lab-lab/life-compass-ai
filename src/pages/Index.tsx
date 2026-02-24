import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import AppSidebar from "@/components/dashboard/AppSidebar";
import LifeScoreRing from "@/components/dashboard/LifeScoreRing";
import ProductivityForecast from "@/components/dashboard/ProductivityForecast";
import ScreenTimeChart from "@/components/dashboard/ScreenTimeChart";
import ActivityTracker from "@/components/dashboard/ActivityTracker";
import SpendingBreakdown from "@/components/dashboard/SpendingBreakdown";
import CoachingRoadmap from "@/components/dashboard/CoachingRoadmap";
import NudgeFeed from "@/components/dashboard/NudgeFeed";
import GoalsPanel from "@/components/dashboard/GoalsPanel";
import InterventionReport from "@/components/dashboard/InterventionReport";
import BehavioralHeatmap from "@/components/dashboard/BehavioralHeatmap";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <DashboardContent activeSection={activeSection} onNavigate={setActiveSection} />;
};

const DashboardContent = ({ activeSection, onNavigate }: { activeSection: string; onNavigate: (id: string) => void }) => {
  const data = useDashboardData();

  if (data.loading || data.seeding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {data.seeding ? "Setting up your dashboard..." : "Loading your data..."}
          </p>
        </div>
      </div>
    );
  }

  const profile = data.profile;
  const displayName = profile?.display_name || "there";

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar activeSection={activeSection} onNavigate={onNavigate} />
      <main className="pl-60 transition-all duration-300">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Hello, <span className="text-gradient-primary">{displayName}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} — Here's your life at a glance
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <LifeScoreRing scores={data.lifeScores} />
            </div>
            <NudgeFeed nudges={data.nudges} />

            <ProductivityForecast scores={data.lifeScores} />
            <CoachingRoadmap plan={data.coachingPlan} onRefresh={data.refresh} />
            <GoalsPanel goals={data.goals} onRefresh={data.refresh} />

            <ScreenTimeChart logs={data.screenTimeLogs} />
            <ActivityTracker logs={data.stepLogs} />
            <SpendingBreakdown logs={data.spendingLogs} />

            <div className="xl:col-span-2">
              <BehavioralHeatmap />
            </div>
            <InterventionReport interventions={data.interventions} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

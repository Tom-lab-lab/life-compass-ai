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
import DataEntryModal from "@/components/dashboard/DataEntryModal";
import { Loader2, Plus } from "lucide-react";

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
  const [showEntry, setShowEntry] = useState(false);

  if (data.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  const profile = data.profile;
  const displayName = profile?.display_name || "there";
  const hasData = data.lifeScores.length > 0 || data.screenTimeLogs.length > 0 || data.stepLogs.length > 0;

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEntry(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Log Data
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-8">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Welcome to ULA v2!</h2>
              <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                Start by logging your first data — screen time, steps, spending, or your life score. Your dashboard will populate as you track your daily habits.
              </p>
              <button
                onClick={() => setShowEntry(true)}
                className="flex items-center gap-2 rounded-lg bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Log Your First Entry
              </button>
            </div>
          ) : (
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
                <BehavioralHeatmap logs={data.screenTimeLogs} />
              </div>
              <InterventionReport interventions={data.interventions} />
            </div>
          )}
        </div>
      </main>

      <DataEntryModal
        open={showEntry}
        onClose={() => setShowEntry(false)}
        onSaved={() => {
          data.refresh();
          setShowEntry(false);
        }}
      />
    </div>
  );
};

export default Index;

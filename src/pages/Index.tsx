import { useState } from "react";
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

const Index = () => {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar activeSection={activeSection} onNavigate={setActiveSection} />

      {/* Main content */}
      <main className="pl-60 transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Good evening, <span className="text-gradient-primary">Alex</span>
            </h1>
            <p className="text-xs text-muted-foreground">Monday, Feb 24 — Here's your life at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
              A
            </div>
          </div>
        </header>

        {/* Dashboard grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {/* Row 1 - Key metrics */}
            <div className="xl:col-span-2">
              <LifeScoreRing />
            </div>
            <NudgeFeed />

            {/* Row 2 - Forecast + Coaching */}
            <ProductivityForecast />
            <CoachingRoadmap />
            <GoalsPanel />

            {/* Row 3 - Charts */}
            <ScreenTimeChart />
            <ActivityTracker />
            <SpendingBreakdown />

            {/* Row 4 - Deep analytics */}
            <div className="xl:col-span-2">
              <BehavioralHeatmap />
            </div>
            <InterventionReport />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

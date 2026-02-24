import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchLifeScores,
  fetchGoals,
  fetchActivityLogs,
  fetchActiveCoachingPlan,
  fetchNudges,
  fetchInterventions,
  fetchProfile,
} from "@/lib/api";
import type { Tables } from "@/integrations/supabase/types";

export type LifeScore = Tables<"life_scores">;
export type Goal = Tables<"goals">;
export type ActivityLog = Tables<"activity_logs">;
export type CoachingPlan = Tables<"coaching_plans"> & { daily_tasks: Tables<"daily_tasks">[] };
export type Nudge = Tables<"nudges">;
export type Intervention = Tables<"interventions">;
export type Profile = Tables<"profiles">;

export const useDashboardData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [lifeScores, setLifeScores] = useState<LifeScore[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [screenTimeLogs, setScreenTimeLogs] = useState<ActivityLog[]>([]);
  const [stepLogs, setStepLogs] = useState<ActivityLog[]>([]);
  const [spendingLogs, setSpendingLogs] = useState<ActivityLog[]>([]);
  const [coachingPlan, setCoachingPlan] = useState<CoachingPlan | null>(null);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [scores, g, st, steps, spending, plan, n, inter, prof] = await Promise.all([
        fetchLifeScores(user.id),
        fetchGoals(user.id),
        fetchActivityLogs(user.id, "screen_time"),
        fetchActivityLogs(user.id, "steps"),
        fetchActivityLogs(user.id, "spending"),
        fetchActiveCoachingPlan(user.id),
        fetchNudges(user.id),
        fetchInterventions(user.id),
        fetchProfile(user.id),
      ]);

      // If no data exists, seed demo data
      if (scores.length === 0) {
        setSeeding(true);
        await supabase.functions.invoke("ai-coach", {
          body: { action: "seed-demo-data" },
        });
        // Reload
        const [s2, g2, st2, steps2, sp2, plan2, n2, inter2, prof2] = await Promise.all([
          fetchLifeScores(user.id),
          fetchGoals(user.id),
          fetchActivityLogs(user.id, "screen_time"),
          fetchActivityLogs(user.id, "steps"),
          fetchActivityLogs(user.id, "spending"),
          fetchActiveCoachingPlan(user.id),
          fetchNudges(user.id),
          fetchInterventions(user.id),
          fetchProfile(user.id),
        ]);
        setLifeScores(s2);
        setGoals(g2);
        setScreenTimeLogs(st2);
        setStepLogs(steps2);
        setSpendingLogs(sp2);
        setCoachingPlan(plan2 as CoachingPlan | null);
        setNudges(n2);
        setInterventions(inter2);
        setProfile(prof2);
        setSeeding(false);
      } else {
        setLifeScores(scores);
        setGoals(g);
        setScreenTimeLogs(st);
        setStepLogs(steps);
        setSpendingLogs(spending);
        setCoachingPlan(plan as CoachingPlan | null);
        setNudges(n);
        setInterventions(inter);
        setProfile(prof);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user?.id]);

  return {
    loading,
    seeding,
    lifeScores,
    goals,
    screenTimeLogs,
    stepLogs,
    spendingLogs,
    coachingPlan,
    nudges,
    interventions,
    profile,
    refresh: loadAll,
  };
};

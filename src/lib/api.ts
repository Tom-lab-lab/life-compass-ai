import { supabase } from "@/integrations/supabase/client";

// ---- Life Scores ----
export const fetchLifeScores = async (userId: string, days = 30) => {
  const { data, error } = await supabase
    .from("life_scores")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(days);
  if (error) throw error;
  return data || [];
};

export const upsertLifeScore = async (score: {
  user_id: string;
  date: string;
  overall: number;
  productivity: number;
  wellbeing: number;
  financial: number;
  physical: number;
  digital: number;
}) => {
  const { data, error } = await supabase
    .from("life_scores")
    .upsert(score, { onConflict: "user_id,date" })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ---- Goals ----
export const fetchGoals = async (userId: string) => {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createGoal = async (goal: {
  user_id: string;
  title: string;
  category: string;
  target_value?: string;
}) => {
  const { data, error } = await supabase.from("goals").insert(goal).select().single();
  if (error) throw error;
  return data;
};

export const updateGoal = async (id: string, updates: { progress?: number; current_value?: string; status?: string }) => {
  const { data, error } = await supabase.from("goals").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
};

export const deleteGoal = async (id: string) => {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
};

// ---- Activity Logs ----
export const fetchActivityLogs = async (userId: string, logType: string, days = 7) => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_type", logType)
    .gte("logged_at", since.toISOString())
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const createActivityLog = async (log: {
  user_id: string;
  log_type: string;
  value: number;
  category?: string;
  metadata?: Record<string, any>;
  logged_at?: string;
}) => {
  const { data, error } = await supabase.from("activity_logs").insert(log).select().single();
  if (error) throw error;
  return data;
};

// ---- Coaching Plans ----
export const fetchActiveCoachingPlan = async (userId: string) => {
  const { data, error } = await supabase
    .from("coaching_plans")
    .select("*, daily_tasks(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const toggleDailyTask = async (taskId: string, completed: boolean) => {
  const { data, error } = await supabase
    .from("daily_tasks")
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ---- Nudges ----
export const fetchNudges = async (userId: string, limit = 10) => {
  const { data, error } = await supabase
    .from("nudges")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

export const markNudgeRead = async (nudgeId: string) => {
  const { error } = await supabase.from("nudges").update({ is_read: true }).eq("id", nudgeId);
  if (error) throw error;
};

// ---- Interventions ----
export const fetchInterventions = async (userId: string) => {
  const { data, error } = await supabase
    .from("interventions")
    .select("*")
    .eq("user_id", userId)
    .order("impact_score", { ascending: false });
  if (error) throw error;
  return data || [];
};

// ---- Profile ----
export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
};

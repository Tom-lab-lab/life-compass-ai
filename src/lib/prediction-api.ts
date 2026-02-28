import { supabase } from "@/integrations/supabase/client";

export const generatePredictions = async () => {
  const { data, error } = await supabase.functions.invoke("ai-predict", {
    body: { action: "generate-predictions" },
  });
  if (error) throw error;
  return data;
};

export const submitFeedback = async (predictionId: string, feedbackType: string, comment?: string) => {
  const { data, error } = await supabase.functions.invoke("ai-predict", {
    body: { action: "submit-feedback", prediction_id: predictionId, feedback_type: feedbackType, comment },
  });
  if (error) throw error;
  return data;
};

export const getModelMetrics = async () => {
  const { data, error } = await supabase.functions.invoke("ai-predict", {
    body: { action: "get-metrics" },
  });
  if (error) throw error;
  return data;
};

export const fetchPredictions = async (userId: string) => {
  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
};

export const fetchModelMetrics = async (userId: string) => {
  const { data, error } = await supabase
    .from("model_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
};

export const fetchBehaviorProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_behavior_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

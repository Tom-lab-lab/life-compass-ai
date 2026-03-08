import { supabase } from "@/integrations/supabase/client";

// Generate a unique session ID per page load
const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function getSessionId(): string {
  return sessionId;
}

/**
 * Logs a user activity to the user_activity_logs table.
 * Runs asynchronously and never throws — failures are silently logged to console.
 */
export function logUserActivity(
  userId: string,
  actionType: string,
  featureName: string,
  details?: string
): void {
  // Fire-and-forget: no await, no blocking
  supabase
    .from("user_activity_logs" as any)
    .insert({
      user_id: userId,
      action_type: actionType,
      feature_name: featureName,
      action_details: details ?? null,
      session_id: sessionId,
    })
    .then(({ error }) => {
      if (error) console.warn("[ActivityLogger]", error.message);
    })
    .catch((e) => {
      console.warn("[ActivityLogger]", e);
    });
}

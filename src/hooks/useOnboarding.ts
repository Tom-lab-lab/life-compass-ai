import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useOnboarding = () => {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setNeedsOnboarding(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("onboarding_state")
          .select("completed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setNeedsOnboarding(!data?.completed);
      } catch {
        // If no record exists, user needs onboarding
        setNeedsOnboarding(true);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [user?.id]);

  const markComplete = () => setNeedsOnboarding(false);

  return { needsOnboarding, loading, markComplete };
};

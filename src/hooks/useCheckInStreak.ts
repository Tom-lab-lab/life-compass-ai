import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useCheckInStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    const calc = async () => {
      const { data, error } = await (supabase
        .from("daily_checkins" as any)
        .select("date")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(60) as any);

      if (error || !data || data.length === 0) {
        setStreak(0);
        return;
      }

      const dates = (data as { date: string }[]).map((r) => r.date);
      let count = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 60; i++) {
        const check = new Date(today);
        check.setDate(check.getDate() - i);
        const iso = check.toISOString().split("T")[0];
        if (dates.includes(iso)) {
          count++;
        } else {
          // Allow skipping today if it hasn't been done yet (streak from yesterday)
          if (i === 0) continue;
          break;
        }
      }
      setStreak(count);
    };
    calc();
  }, [user?.id]);

  return streak;
};

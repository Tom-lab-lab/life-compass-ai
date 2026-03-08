import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Get all profiles
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, display_name");
    if (profileErr) throw profileErr;

    // Get yesterday's check-ins
    const { data: checkins, error: checkinErr } = await supabase
      .from("daily_checkins")
      .select("user_id")
      .eq("date", yesterdayStr);
    if (checkinErr) throw checkinErr;

    const checkedInUserIds = new Set((checkins || []).map((c: any) => c.user_id));
    const missedUsers = (profiles || []).filter((p: any) => !checkedInUserIds.has(p.id));

    let emailsSent = 0;
    let nudgesCreated = 0;

    for (const user of missedUsers) {
      // Get user email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      const email = authUser?.user?.email;

      // Create in-app nudge
      const { error: nudgeErr } = await supabase.from("nudges").insert({
        user_id: user.id,
        message: `You missed your daily check-in yesterday (${yesterdayStr}). Don't break your streak! 🔥`,
        nudge_type: "warning",
      });
      if (nudgeErr) {
        console.error(`Nudge insert failed for ${user.id}:`, nudgeErr.message);
      } else {
        nudgesCreated++;
      }

      // Send email via Resend
      if (email) {
        try {
          const displayName = user.display_name || "there";
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Life Compass <onboarding@resend.dev>",
              to: [email],
              subject: "You missed your daily check-in! 🔥",
              html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
                  <h2 style="color: #1a1a2e;">Hey ${displayName} 👋</h2>
                  <p style="color: #444; line-height: 1.6;">
                    You missed your daily check-in yesterday (<strong>${yesterdayStr}</strong>).
                    Consistent tracking helps our AI give you better predictions and coaching.
                  </p>
                  <p style="color: #444; line-height: 1.6;">
                    Don't break your streak — log in and complete today's check-in!
                  </p>
                  <div style="text-align: center; margin: 24px 0;">
                    <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}"
                       style="display: inline-block; background: #20b89a; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                      Complete Check-In
                    </a>
                  </div>
                  <p style="color: #999; font-size: 12px;">Life Compass AI — Your intelligent life dashboard</p>
                </div>
              `,
            }),
          });
          const body = await res.text();
          if (res.ok) {
            emailsSent++;
          } else {
            console.error(`Email failed for ${user.id}: ${body}`);
          }
        } catch (e) {
          console.error(`Email error for ${user.id}:`, e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        missed: missedUsers.length,
        emailsSent,
        nudgesCreated,
        date: yesterdayStr,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("checkin-reminder error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

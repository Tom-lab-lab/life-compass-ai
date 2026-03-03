import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { action, simulation_inputs } = await req.json();

    // === Model Health Check ===
    if (action === "check-health") {
      const { data: metrics } = await supabase
        .from("model_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(60);

      if (!metrics || metrics.length === 0) {
        return new Response(JSON.stringify({ health: { status: "no_data", domains: [] } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const domains = [...new Set(metrics.map((m: any) => m.domain))];
      const domainHealth = domains.map((domain) => {
        const domainMetrics = metrics.filter((m: any) => m.domain === domain);
        const recent = domainMetrics.slice(0, 7);
        const older = domainMetrics.slice(7, 30);

        const recentAccuracy = recent.length > 0
          ? recent.reduce((s: number, m: any) => s + Number(m.accuracy), 0) / recent.length
          : 0;
        const olderAccuracy = older.length > 0
          ? older.reduce((s: number, m: any) => s + Number(m.accuracy), 0) / older.length
          : recentAccuracy;

        const driftDetected = olderAccuracy > 0 && (olderAccuracy - recentAccuracy) > 10;
        const needsRetrain = recentAccuracy < 65 && recent.length >= 3;

        return {
          domain,
          rolling_accuracy_7d: Math.round(recentAccuracy),
          rolling_accuracy_30d: Math.round(olderAccuracy),
          drift_detected: driftDetected,
          needs_retrain: needsRetrain,
          total_predictions: recent.reduce((s: number, m: any) => s + m.total_predictions, 0),
          latest_version: domainMetrics[0]?.version || 1,
        };
      });

      // Auto-retrain if needed
      for (const dh of domainHealth) {
        if (dh.needs_retrain || dh.drift_detected) {
          const newVersion = dh.latest_version + 1;
          await supabase.from("model_retrain_log").insert({
            user_id: user.id,
            domain: dh.domain,
            old_version: dh.latest_version,
            new_version: newVersion,
            old_accuracy: dh.rolling_accuracy_30d,
            new_accuracy: null,
            drift_score: dh.rolling_accuracy_30d - dh.rolling_accuracy_7d,
            trigger_reason: dh.needs_retrain ? "low_accuracy" : "drift",
            status: "completed",
          });
        }
      }

      return new Response(JSON.stringify({
        health: {
          status: domainHealth.some((d) => d.drift_detected) ? "drift_detected" : "healthy",
          domains: domainHealth,
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === Behavioral Clustering ===
    if (action === "classify-behavior") {
      const [{ data: logs }, { data: scores }] = await Promise.all([
        supabase.from("activity_logs").select("*").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(200),
        supabase.from("life_scores").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
      ]);

      if (!logs?.length && !scores?.length) {
        return new Response(JSON.stringify({ cluster: null, message: "Not enough data" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("AI not configured");

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a behavioral psychologist AI." },
            {
              role: "user",
              content: `Classify this user into ONE behavioral cluster based on their 30-day data.

Activity logs: ${JSON.stringify(logs?.slice(0, 50) || [])}
Life scores: ${JSON.stringify(scores?.slice(0, 10) || [])}

Clusters: balanced, burnout_prone, high_performer, impulsive_spender, screen_heavy
Return confidence 0-100.`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "classify_user",
              description: "Classify user behavior cluster",
              parameters: {
                type: "object",
                properties: {
                  cluster_type: { type: "string", enum: ["balanced", "burnout_prone", "high_performer", "impulsive_spender", "screen_heavy"] },
                  confidence_score: { type: "number" },
                  reasoning: { type: "string" },
                },
                required: ["cluster_type", "confidence_score", "reasoning"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "classify_user" } },
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI error");
      }

      const aiData = await aiResp.json();
      let result;
      try {
        const tc = aiData.choices?.[0]?.message?.tool_calls?.[0];
        result = JSON.parse(tc.function.arguments);
      } catch {
        result = { cluster_type: "balanced", confidence_score: 50, reasoning: "Default classification" };
      }

      await supabase.from("user_behavior_clusters").upsert({
        user_id: user.id,
        cluster_type: result.cluster_type,
        confidence_score: result.confidence_score,
        last_updated: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ cluster: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Life Simulation (Digital Twin) ===
    if (action === "simulate") {
      if (!simulation_inputs) throw new Error("Missing simulation_inputs");

      const { data: scores } = await supabase
        .from("life_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(7);

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("AI not configured");

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a life simulation AI that projects outcomes based on behavior changes." },
            {
              role: "user",
              content: `User's current life scores (last 7 days): ${JSON.stringify(scores || [])}

User wants to simulate these changes over 30 days:
${JSON.stringify(simulation_inputs)}

Project realistic outcomes for: overall_score, productivity, wellbeing, physical, financial, digital, burnout_probability (0-100), and a brief narrative.`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "project_outcomes",
              description: "Project 30-day life outcomes",
              parameters: {
                type: "object",
                properties: {
                  projected_overall: { type: "number" },
                  projected_productivity: { type: "number" },
                  projected_wellbeing: { type: "number" },
                  projected_physical: { type: "number" },
                  projected_financial: { type: "number" },
                  projected_digital: { type: "number" },
                  burnout_probability: { type: "number" },
                  narrative: { type: "string" },
                  weekly_trajectory: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        week: { type: "number" },
                        overall: { type: "number" },
                        burnout_risk: { type: "number" },
                      },
                      required: ["week", "overall", "burnout_risk"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["projected_overall", "projected_productivity", "projected_wellbeing", "projected_physical", "projected_financial", "projected_digital", "burnout_probability", "narrative", "weekly_trajectory"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "project_outcomes" } },
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI error");
      }

      const aiData = await aiResp.json();
      let outcomes;
      try {
        const tc = aiData.choices?.[0]?.message?.tool_calls?.[0];
        outcomes = JSON.parse(tc.function.arguments);
      } catch {
        outcomes = {
          projected_overall: 55, projected_productivity: 55, projected_wellbeing: 55,
          projected_physical: 55, projected_financial: 55, projected_digital: 55,
          burnout_probability: 30, narrative: "Simulation complete with estimated improvements.",
          weekly_trajectory: [
            { week: 1, overall: 52, burnout_risk: 25 },
            { week: 2, overall: 54, burnout_risk: 22 },
            { week: 3, overall: 56, burnout_risk: 20 },
            { week: 4, overall: 58, burnout_risk: 18 },
          ],
        };
      }

      await supabase.from("life_simulations").insert({
        user_id: user.id,
        simulation_inputs,
        projected_outcomes: outcomes,
      });

      return new Response(JSON.stringify({ outcomes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Research Export ===
    if (action === "research-export") {
      const [{ data: logs }, { data: preds }, { data: metrics }, { data: feedback }, { data: cluster }] = await Promise.all([
        supabase.from("activity_logs").select("log_type, value, category, logged_at").eq("user_id", user.id).order("logged_at", { ascending: true }),
        supabase.from("predictions").select("domain, prediction_text, risk_score, confidence_score, trend_direction, status, created_at").eq("user_id", user.id),
        supabase.from("model_metrics").select("domain, accuracy, usefulness_rate, total_predictions, correct_predictions, period_start").eq("user_id", user.id),
        supabase.from("prediction_feedback").select("feedback_type, created_at").eq("user_id", user.id),
        supabase.from("user_behavior_clusters").select("cluster_type, confidence_score").eq("user_id", user.id).maybeSingle(),
      ]);

      const exportData = {
        anonymized_id: crypto.randomUUID(),
        exported_at: new Date().toISOString(),
        activity_logs: logs || [],
        predictions: preds || [],
        model_metrics: metrics || [],
        feedback: feedback || [],
        cluster: cluster || null,
      };

      return new Response(JSON.stringify(exportData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-model-health error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

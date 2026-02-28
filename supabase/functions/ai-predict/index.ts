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

    const { action, prediction_id, feedback_type, comment } = await req.json();

    // === Generate Predictions ===
    if (action === "generate-predictions") {
      const [{ data: scores }, { data: logs }, { data: goals }, { data: existingPreds }] = await Promise.all([
        supabase.from("life_scores").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
        supabase.from("activity_logs").select("*").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(100),
        supabase.from("goals").select("*").eq("user_id", user.id).eq("status", "active"),
        supabase.from("predictions").select("id").eq("user_id", user.id).eq("status", "pending"),
      ]);

      if (!scores?.length && !logs?.length) {
        return new Response(JSON.stringify({ predictions: [], message: "Log some data first to get predictions." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get previous feedback to improve predictions
      const { data: feedback } = await supabase
        .from("prediction_feedback")
        .select("feedback_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const feedbackSummary = feedback?.reduce((acc: Record<string, number>, f) => {
        acc[f.feedback_type] = (acc[f.feedback_type] || 0) + 1;
        return acc;
      }, {}) || {};

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

      const prompt = `You are a predictive behavioral AI for a Universal Life Assistant. Analyze the user's real data and generate predictions about potential future mistakes or risks.

USER DATA:
Life Scores (last 30 days): ${JSON.stringify(scores?.slice(0, 10) || [])}
Activity Logs (recent): ${JSON.stringify(logs?.slice(0, 30) || [])}
Active Goals: ${JSON.stringify(goals || [])}

USER FEEDBACK HISTORY: ${JSON.stringify(feedbackSummary)}
${feedbackSummary.wrong ? `Note: User marked ${feedbackSummary.wrong} predictions as wrong — be more careful and precise.` : ""}
${feedbackSummary.too_frequent ? `Note: User finds predictions too frequent — only generate high-confidence ones.` : ""}

Generate 3-5 predictions across domains: spending, screen_time, sleep, exercise, study, tasks.
For each prediction, analyze real patterns in the data. Be specific with numbers and timeframes.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a behavioral prediction AI. Return structured predictions based on real data patterns." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_predictions",
              description: "Generate behavioral predictions with risk scores",
              parameters: {
                type: "object",
                properties: {
                  predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        domain: { type: "string", enum: ["spending", "screen_time", "sleep", "exercise", "study", "tasks"] },
                        prediction_text: { type: "string", description: "Human-readable prediction, max 120 chars" },
                        risk_score: { type: "number", description: "0-100 risk level" },
                        confidence_score: { type: "number", description: "0-100 confidence" },
                        trend_direction: { type: "string", enum: ["rising", "falling", "stable"] },
                        pattern_explanation: { type: "string", description: "Why this prediction was made, referencing actual data patterns" },
                      },
                      required: ["domain", "prediction_text", "risk_score", "confidence_score", "trend_direction", "pattern_explanation"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["predictions"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_predictions" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI service error");
      }

      const aiData = await aiResponse.json();
      let predictions: any[];

      try {
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        predictions = JSON.parse(toolCall.function.arguments).predictions;
      } catch {
        predictions = [{
          domain: "general",
          prediction_text: "Keep logging data to receive more accurate predictions.",
          risk_score: 30,
          confidence_score: 50,
          trend_direction: "stable",
          pattern_explanation: "Not enough data patterns detected yet.",
        }];
      }

      // Expire old pending predictions
      await supabase
        .from("predictions")
        .update({ status: "expired" })
        .eq("user_id", user.id)
        .eq("status", "pending");

      // Store new predictions
      const rows = predictions.map((p: any) => ({
        user_id: user.id,
        domain: p.domain,
        prediction_text: p.prediction_text,
        risk_score: Math.min(100, Math.max(0, p.risk_score)),
        confidence_score: Math.min(100, Math.max(0, p.confidence_score)),
        trend_direction: p.trend_direction,
        pattern_explanation: p.pattern_explanation,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { data: saved, error: saveErr } = await supabase
        .from("predictions")
        .insert(rows)
        .select();

      if (saveErr) throw saveErr;

      // Update behavior profile
      await updateBehaviorProfile(supabase, user.id, scores || [], logs || []);

      return new Response(JSON.stringify({ predictions: saved }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Submit Feedback ===
    if (action === "submit-feedback") {
      if (!prediction_id || !feedback_type) throw new Error("Missing prediction_id or feedback_type");

      const { error } = await supabase.from("prediction_feedback").insert({
        prediction_id,
        user_id: user.id,
        feedback_type,
        comment: comment || null,
      });
      if (error) throw error;

      // Update prediction status if marked wrong
      if (feedback_type === "wrong") {
        await supabase.from("predictions").update({ status: "incorrect", resolved_at: new Date().toISOString() }).eq("id", prediction_id);
      } else if (feedback_type === "helpful") {
        await supabase.from("predictions").update({ status: "confirmed", resolved_at: new Date().toISOString(), accuracy_score: 80 }).eq("id", prediction_id);
      }

      // Update model metrics
      await updateModelMetrics(supabase, user.id, prediction_id, feedback_type);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Get Model Metrics ===
    if (action === "get-metrics") {
      const { data: metrics } = await supabase
        .from("model_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      const { data: profile } = await supabase
        .from("user_behavior_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      return new Response(JSON.stringify({ metrics: metrics || [], profile }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-predict error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function updateBehaviorProfile(supabase: any, userId: string, scores: any[], logs: any[]) {
  try {
    const spendingLogs = logs.filter((l: any) => l.log_type === "spending");
    const screenLogs = logs.filter((l: any) => l.log_type === "screen_time");
    const stepLogs = logs.filter((l: any) => l.log_type === "steps");

    const avgSpending = spendingLogs.length ? spendingLogs.reduce((s: number, l: any) => s + Number(l.value), 0) / spendingLogs.length : 0;
    const avgScreen = screenLogs.length ? screenLogs.reduce((s: number, l: any) => s + Number(l.value), 0) / screenLogs.length : 0;

    const patterns: string[] = [];
    if (avgSpending > 1000) patterns.push("High daily spending detected");
    if (avgScreen > 180) patterns.push("Screen time exceeds 3 hours average");
    if (stepLogs.length && stepLogs.every((l: any) => Number(l.value) < 5000)) patterns.push("Consistently low step count");

    await supabase.from("user_behavior_profiles").upsert({
      user_id: userId,
      spending_habits: { avg_daily: Math.round(avgSpending), total_logs: spendingLogs.length },
      detected_patterns: patterns,
    }, { onConflict: "user_id" });
  } catch (e) {
    console.error("Profile update error:", e);
  }
}

async function updateModelMetrics(supabase: any, userId: string, predictionId: string, feedbackType: string) {
  try {
    const { data: pred } = await supabase.from("predictions").select("domain").eq("id", predictionId).single();
    if (!pred) return;

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("model_metrics")
      .select("*")
      .eq("user_id", userId)
      .eq("domain", pred.domain)
      .eq("period_start", periodStart)
      .maybeSingle();

    if (existing) {
      const updates: any = {
        feedback_total: existing.feedback_total + 1,
      };
      if (feedbackType === "helpful") {
        updates.feedback_helpful = existing.feedback_helpful + 1;
        updates.correct_predictions = existing.correct_predictions + 1;
      } else if (feedbackType === "wrong") {
        updates.feedback_wrong = existing.feedback_wrong + 1;
      }
      updates.total_predictions = existing.total_predictions;
      updates.usefulness_rate = updates.feedback_helpful !== undefined
        ? (updates.feedback_helpful || existing.feedback_helpful) / (updates.feedback_total)
        : existing.usefulness_rate;
      updates.accuracy = existing.total_predictions > 0
        ? ((updates.correct_predictions || existing.correct_predictions) / existing.total_predictions) * 100
        : 0;

      await supabase.from("model_metrics").update(updates).eq("id", existing.id);
    } else {
      await supabase.from("model_metrics").insert({
        user_id: userId,
        domain: pred.domain,
        total_predictions: 1,
        correct_predictions: feedbackType === "helpful" ? 1 : 0,
        accuracy: feedbackType === "helpful" ? 100 : 0,
        feedback_total: 1,
        feedback_helpful: feedbackType === "helpful" ? 1 : 0,
        feedback_wrong: feedbackType === "wrong" ? 1 : 0,
        usefulness_rate: feedbackType === "helpful" ? 1 : 0,
        period_start: periodStart,
        period_end: periodEnd,
      });
    }
  } catch (e) {
    console.error("Metrics update error:", e);
  }
}

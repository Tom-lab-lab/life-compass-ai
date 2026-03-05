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

      // Auto-compute and update model_metrics for each domain
      await autoComputeMetrics(supabase, user.id);

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

      if (feedback_type === "wrong") {
        await supabase.from("predictions").update({ status: "incorrect", resolved_at: new Date().toISOString() }).eq("id", prediction_id);
      } else if (feedback_type === "helpful") {
        await supabase.from("predictions").update({ status: "confirmed", resolved_at: new Date().toISOString(), accuracy_score: 80 }).eq("id", prediction_id);
      }

      // Re-compute all metrics after feedback
      await autoComputeMetrics(supabase, user.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Compute Metrics (callable independently) ===
    if (action === "compute-metrics") {
      await autoComputeMetrics(supabase, user.id);
      
      const { data: metrics } = await supabase
        .from("model_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      return new Response(JSON.stringify({ metrics: metrics || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Get Model Metrics ===
    if (action === "get-metrics") {
      // Auto-compute first to ensure fresh data
      await autoComputeMetrics(supabase, user.id);

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

async function autoComputeMetrics(supabase: any, userId: string) {
  try {
    // Get all predictions for this user
    const { data: allPreds } = await supabase
      .from("predictions")
      .select("id, domain, status, confidence_score, risk_score, created_at")
      .eq("user_id", userId);

    if (!allPreds || allPreds.length === 0) return;

    // Get all feedback
    const { data: allFeedback } = await supabase
      .from("prediction_feedback")
      .select("prediction_id, feedback_type")
      .eq("user_id", userId);

    const feedbackMap = new Map<string, string[]>();
    (allFeedback || []).forEach((f: any) => {
      if (!feedbackMap.has(f.prediction_id)) feedbackMap.set(f.prediction_id, []);
      feedbackMap.get(f.prediction_id)!.push(f.feedback_type);
    });

    // Group predictions by domain
    const byDomain: Record<string, any[]> = {};
    allPreds.forEach((p: any) => {
      if (!byDomain[p.domain]) byDomain[p.domain] = [];
      byDomain[p.domain].push(p);
    });

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    for (const [domain, preds] of Object.entries(byDomain)) {
      const totalPredictions = preds.length;
      const confirmed = preds.filter((p: any) => p.status === "confirmed").length;
      const incorrect = preds.filter((p: any) => p.status === "incorrect").length;
      const avgConfidence = preds.reduce((s: number, p: any) => s + p.confidence_score, 0) / totalPredictions;

      let feedbackHelpful = 0;
      let feedbackWrong = 0;
      let feedbackTotal = 0;
      preds.forEach((p: any) => {
        const fb = feedbackMap.get(p.id) || [];
        fb.forEach((type: string) => {
          feedbackTotal++;
          if (type === "helpful") feedbackHelpful++;
          if (type === "wrong") feedbackWrong++;
        });
      });

      const accuracy = totalPredictions > 0
        ? feedbackTotal > 0
          ? (feedbackHelpful / feedbackTotal) * 100
          : (confirmed / totalPredictions) * 100 || avgConfidence * 0.8
        : 0;

      const usefulnessRate = feedbackTotal > 0 ? feedbackHelpful / feedbackTotal : 0.5;

      // Calculate drift score (compare recent vs older accuracy)
      const recentPreds = preds.filter((p: any) => {
        const age = (now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return age <= 7;
      });
      const olderPreds = preds.filter((p: any) => {
        const age = (now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return age > 7 && age <= 30;
      });
      const recentAvgConf = recentPreds.length > 0 
        ? recentPreds.reduce((s: number, p: any) => s + p.confidence_score, 0) / recentPreds.length 
        : avgConfidence;
      const olderAvgConf = olderPreds.length > 0 
        ? olderPreds.reduce((s: number, p: any) => s + p.confidence_score, 0) / olderPreds.length 
        : avgConfidence;
      const driftScore = Math.abs(recentAvgConf - olderAvgConf);

      // Upsert model_metrics for this domain and period
      const { data: existing } = await supabase
        .from("model_metrics")
        .select("id")
        .eq("user_id", userId)
        .eq("domain", domain)
        .eq("period_start", periodStart)
        .maybeSingle();

      const metricsRow = {
        user_id: userId,
        domain,
        total_predictions: totalPredictions,
        correct_predictions: confirmed,
        accuracy: Math.round(accuracy * 100) / 100,
        avg_confidence: Math.round(avgConfidence * 100) / 100,
        feedback_total: feedbackTotal,
        feedback_helpful: feedbackHelpful,
        feedback_wrong: feedbackWrong,
        usefulness_rate: Math.round(usefulnessRate * 100) / 100,
        drift_score: Math.round(driftScore * 100) / 100,
        period_start: periodStart,
        period_end: periodEnd,
      };

      if (existing) {
        await supabase.from("model_metrics").update(metricsRow).eq("id", existing.id);
      } else {
        await supabase.from("model_metrics").insert(metricsRow);
      }
    }
  } catch (e) {
    console.error("Auto-compute metrics error:", e);
  }
}

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

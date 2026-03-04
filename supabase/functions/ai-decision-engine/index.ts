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

    const { goals } = await req.json();
    if (!goals || goals.length < 2) throw new Error("Need at least 2 goals");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const prompt = `You are a multi-variable decision engine for life optimization. Analyze these user goals and produce structured output.

Goals (each with priority_rank 1-5, weight 0.1-3.0, risk_tolerance, time/financial constraints):
${JSON.stringify(goals, null, 2)}

Your tasks:
1. Identify CONFLICTS between goals (time conflicts, financial conflicts, energy conflicts, contradictions)
2. RESOLVE each conflict by recommending trade-offs based on priority_rank and weight
3. Generate a weekly ACTION ROADMAP (4 weeks) with specific steps, ordered by weighted priority
4. Provide a 2-sentence SUMMARY of the optimal strategy

Return JSON with this exact structure:
{
  "conflicts": [{"goals": ["Goal A", "Goal B"], "type": "time_conflict", "resolution": "..."}],
  "roadmap": [{"week": 1, "action": "...", "goal": "...", "priority": "critical|high|medium|low"}],
  "summary": "..."
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a decision science AI. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_goals",
            description: "Analyze goals and produce conflict resolution + roadmap",
            parameters: {
              type: "object",
              properties: {
                conflicts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      goals: { type: "array", items: { type: "string" } },
                      type: { type: "string" },
                      resolution: { type: "string" },
                    },
                    required: ["goals", "type", "resolution"],
                    additionalProperties: false,
                  },
                },
                roadmap: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "number" },
                      action: { type: "string" },
                      goal: { type: "string" },
                      priority: { type: "string" },
                    },
                    required: ["week", "action", "goal", "priority"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string" },
              },
              required: ["conflicts", "roadmap", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_goals" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service error");
    }

    const aiData = await aiResponse.json();
    let result;

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      result = JSON.parse(toolCall.function.arguments);
    } catch {
      try {
        const content = aiData.choices?.[0]?.message?.content || "{}";
        result = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      } catch {
        result = {
          conflicts: [],
          roadmap: [{ week: 1, action: "Review and prioritize your goals", goal: "All", priority: "high" }],
          summary: "Unable to parse AI response. Please try again.",
        };
      }
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "decision_engine_run",
      resource_type: "goals",
      metadata: { goal_count: goals.length, conflict_count: result.conflicts?.length || 0 },
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("decision-engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

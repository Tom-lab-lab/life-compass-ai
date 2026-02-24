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

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { action } = await req.json();

    if (action === "generate-plan") {
      // Fetch user's recent data for context
      const [{ data: scores }, { data: goals }, { data: logs }] = await Promise.all([
        supabase.from("life_scores").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(7),
        supabase.from("goals").select("*").eq("user_id", user.id).eq("status", "active"),
        supabase.from("activity_logs").select("*").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(20),
      ]);

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

      const prompt = `You are a life improvement AI coach. Based on the user's data, create a personalized 10-day improvement plan.

User's recent life scores: ${JSON.stringify(scores?.slice(0, 3) || [])}
Active goals: ${JSON.stringify(goals || [])}
Recent activity: ${JSON.stringify(logs?.slice(0, 10) || [])}

Return a JSON array of exactly 10 tasks. Each task should have:
- day_number (1-10)
- task (actionable description, max 60 chars)
- category (one of: Productivity, Digital, Physical, Financial, Wellbeing)

Focus on the weakest areas. Be specific and actionable.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a life coaching AI. Always respond with valid JSON only, no markdown." },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_improvement_plan",
                description: "Create a personalized improvement plan",
                parameters: {
                  type: "object",
                  properties: {
                    tasks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          day_number: { type: "number" },
                          task: { type: "string" },
                          category: { type: "string", enum: ["Productivity", "Digital", "Physical", "Financial", "Wellbeing"] },
                        },
                        required: ["day_number", "task", "category"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["tasks"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "create_improvement_plan" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "AI rate limit exceeded, try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI service error");
      }

      const aiData = await aiResponse.json();
      let tasks: any[];

      try {
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        const parsed = JSON.parse(toolCall.function.arguments);
        tasks = parsed.tasks;
      } catch {
        // Fallback: try parsing content directly
        try {
          const content = aiData.choices?.[0]?.message?.content || "[]";
          tasks = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
        } catch {
          tasks = [
            { day_number: 1, task: "Set 3 daily focus goals", category: "Productivity" },
            { day_number: 2, task: "Limit social media to 45 min", category: "Digital" },
            { day_number: 3, task: "Walk 8000 steps", category: "Physical" },
            { day_number: 4, task: "Review weekly spending", category: "Financial" },
            { day_number: 5, task: "10-minute meditation session", category: "Wellbeing" },
            { day_number: 6, task: "Complete 2 deep work sessions", category: "Productivity" },
            { day_number: 7, task: "No phone first 30 min after waking", category: "Digital" },
            { day_number: 8, task: "Prepare weekly meal plan", category: "Wellbeing" },
            { day_number: 9, task: "Set monthly savings target", category: "Financial" },
            { day_number: 10, task: "Take a 30-min walk outdoors", category: "Physical" },
          ];
        }
      }

      // Archive existing active plans
      await supabase
        .from("coaching_plans")
        .update({ status: "archived" })
        .eq("user_id", user.id)
        .eq("status", "active");

      // Create new plan
      const { data: plan, error: planError } = await supabase
        .from("coaching_plans")
        .insert({ user_id: user.id, title: "AI-Generated Improvement Plan", description: "Personalized plan based on your activity data" })
        .select()
        .single();

      if (planError) throw planError;

      // Insert tasks
      const taskRows = tasks.map((t: any) => ({
        user_id: user.id,
        plan_id: plan.id,
        day_number: t.day_number,
        task: t.task,
        category: t.category,
      }));

      const { error: tasksError } = await supabase.from("daily_tasks").insert(taskRows);
      if (tasksError) throw tasksError;

      // Create a nudge
      await supabase.from("nudges").insert({
        user_id: user.id,
        message: "Your new AI coaching plan is ready! Check it out.",
        nudge_type: "success",
      });

      return new Response(JSON.stringify({ plan, tasks: taskRows }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "seed-demo-data") {
      // Seed demo data for new users
      const today = new Date();

      // Life scores for past 30 days
      const scoreRows = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (29 - i));
        return {
          user_id: user.id,
          date: d.toISOString().split("T")[0],
          overall: 55 + Math.round(Math.random() * 30 + i * 0.5),
          productivity: 50 + Math.round(Math.random() * 35),
          wellbeing: 45 + Math.round(Math.random() * 35),
          financial: 50 + Math.round(Math.random() * 30),
          physical: 45 + Math.round(Math.random() * 40),
          digital: 40 + Math.round(Math.random() * 35),
        };
      }).map((s) => ({
        ...s,
        overall: Math.min(s.overall, 100),
        productivity: Math.min(s.productivity, 100),
        wellbeing: Math.min(s.wellbeing, 100),
        financial: Math.min(s.financial, 100),
        physical: Math.min(s.physical, 100),
        digital: Math.min(s.digital, 100),
      }));

      await supabase.from("life_scores").upsert(scoreRows, { onConflict: "user_id,date" });

      // Activity logs
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const activityRows: any[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString();

        activityRows.push(
          { user_id: user.id, log_type: "screen_time", value: 40 + Math.round(Math.random() * 80), category: "social", logged_at: dateStr },
          { user_id: user.id, log_type: "screen_time", value: 60 + Math.round(Math.random() * 120), category: "productive", logged_at: dateStr },
          { user_id: user.id, log_type: "screen_time", value: 20 + Math.round(Math.random() * 60), category: "entertainment", logged_at: dateStr },
          { user_id: user.id, log_type: "steps", value: 4000 + Math.round(Math.random() * 8000), logged_at: dateStr },
          { user_id: user.id, log_type: "spending", value: 500 + Math.round(Math.random() * 3000), category: ["Food", "Transport", "Shopping", "Bills", "Entertainment"][Math.floor(Math.random() * 5)], logged_at: dateStr },
        );
      }
      await supabase.from("activity_logs").insert(activityRows);

      // Goals
      await supabase.from("goals").insert([
        { user_id: user.id, title: "Reduce screen time to 4h/day", category: "Digital", target_value: "4h", current_value: "5.2h", progress: 65 },
        { user_id: user.id, title: "Walk 8000 steps daily", category: "Physical", target_value: "8000", current_value: "6240", progress: 78 },
        { user_id: user.id, title: "Save ₹5000 this month", category: "Financial", target_value: "₹5000", current_value: "₹2100", progress: 42 },
        { user_id: user.id, title: "Complete 20 focus sessions", category: "Productivity", target_value: "20", current_value: "11", progress: 55 },
      ]);

      // Interventions
      await supabase.from("interventions").insert([
        { user_id: user.id, name: "Focus mode reminders", times_shown: 100, times_accepted: 82, impact_score: 12 },
        { user_id: user.id, name: "Step goal nudges", times_shown: 100, times_accepted: 65, impact_score: 8 },
        { user_id: user.id, name: "Spending alerts", times_shown: 100, times_accepted: 71, impact_score: 15 },
        { user_id: user.id, name: "Sleep schedule prompts", times_shown: 100, times_accepted: 45, impact_score: 6 },
        { user_id: user.id, name: "Break reminders", times_shown: 100, times_accepted: 78, impact_score: 10 },
      ]);

      // Welcome nudges
      await supabase.from("nudges").insert([
        { user_id: user.id, message: "Welcome to ULA v2! Your life dashboard is ready.", nudge_type: "success" },
        { user_id: user.id, message: "Try generating an AI coaching plan to get started!", nudge_type: "info" },
      ]);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

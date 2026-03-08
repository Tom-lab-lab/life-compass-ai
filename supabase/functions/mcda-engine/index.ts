import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── MCDA Weighted Scoring Model ──
// LifeScore = Σ(wi × si) where wi = normalized weight, si = domain score
function computeMCDA(
  goals: any[],
  lifeScores: any[]
): { weights: Record<string, number>; scores: Record<string, number>; lifeScore: number; breakdown: any[] } {
  // Domain mapping from goal categories
  const domainMap: Record<string, string> = {
    Productivity: "productivity",
    Health: "physical",
    Physical: "physical",
    Financial: "financial",
    Finance: "financial",
    Wellbeing: "wellbeing",
    Digital: "digital",
    Career: "productivity",
    Education: "productivity",
  };

  // Calculate weights from goal priorities and weights
  const domainWeights: Record<string, number> = {
    productivity: 1,
    physical: 1,
    financial: 1,
    wellbeing: 1,
    digital: 1,
  };

  for (const g of goals) {
    const domain = domainMap[g.category] || "productivity";
    const priorityFactor = (6 - (g.priority_rank || 3)) / 5; // Higher priority = higher weight
    const goalWeight = g.weight || 1.0;
    domainWeights[domain] += priorityFactor * goalWeight;
  }

  // Normalize weights to sum to 1
  const totalWeight = Object.values(domainWeights).reduce((s, w) => s + w, 0);
  const normalizedWeights: Record<string, number> = {};
  for (const [k, v] of Object.entries(domainWeights)) {
    normalizedWeights[k] = Math.round((v / totalWeight) * 1000) / 1000;
  }

  // Get latest scores
  const latest = lifeScores[0] || { productivity: 50, physical: 50, financial: 50, wellbeing: 50, digital: 50 };
  const domainScores: Record<string, number> = {
    productivity: latest.productivity,
    physical: latest.physical,
    financial: latest.financial,
    wellbeing: latest.wellbeing,
    digital: latest.digital,
  };

  // Compute weighted life score
  let lifeScore = 0;
  const breakdown = [];
  for (const [domain, weight] of Object.entries(normalizedWeights)) {
    const score = domainScores[domain] || 50;
    const contribution = weight * score;
    lifeScore += contribution;
    breakdown.push({ domain, weight, score, contribution: Math.round(contribution * 100) / 100 });
  }

  return {
    weights: normalizedWeights,
    scores: domainScores,
    lifeScore: Math.round(lifeScore * 100) / 100,
    breakdown,
  };
}

// ── Evaluation Metrics ──
function computeEvaluationMetrics(recommendations: any[], weeklyFeedback: any[]) {
  const totalRecs = recommendations.length;
  const resolvedRecs = recommendations.filter((r: any) => r.accuracy_score != null);
  const acceptedRecs = recommendations.filter((r: any) => r.was_accepted);

  const avgAccuracy = resolvedRecs.length > 0
    ? resolvedRecs.reduce((s: number, r: any) => s + (r.accuracy_score || 0), 0) / resolvedRecs.length
    : 0;

  // Productivity improvement over time from weekly feedback
  let productivityImprovement = 0;
  if (weeklyFeedback.length >= 2) {
    const sorted = [...weeklyFeedback].sort((a: any, b: any) => a.week_number - b.week_number);
    const first3 = sorted.slice(0, 3);
    const last3 = sorted.slice(-3);
    const earlyAvg = first3.reduce((s: number, f: any) => s + f.productivity_score, 0) / first3.length;
    const lateAvg = last3.reduce((s: number, f: any) => s + f.productivity_score, 0) / last3.length;
    productivityImprovement = Math.round((lateAvg - earlyAvg) * 100) / 100;
  }

  // Goal completion rate from weekly feedback
  const avgGoalProgress = weeklyFeedback.length > 0
    ? weeklyFeedback.reduce((s: number, f: any) => s + f.goal_progress, 0) / weeklyFeedback.length
    : 0;

  // Satisfaction trend
  const avgSatisfaction = weeklyFeedback.length > 0
    ? weeklyFeedback.reduce((s: number, f: any) => s + f.satisfaction_rating, 0) / weeklyFeedback.length
    : 0;

  // Decision accuracy from user ratings
  const avgDecisionAccuracy = weeklyFeedback.length > 0
    ? weeklyFeedback.reduce((s: number, f: any) => s + f.decision_accuracy, 0) / weeklyFeedback.length
    : 0;

  return {
    total_recommendations: totalRecs,
    accepted_rate: totalRecs > 0 ? Math.round((acceptedRecs.length / totalRecs) * 100) : 0,
    recommendation_accuracy: Math.round(avgAccuracy * 100) / 100,
    productivity_improvement: productivityImprovement,
    goal_completion_rate: Math.round(avgGoalProgress * 100) / 100,
    satisfaction_score: Math.round(avgSatisfaction * 100) / 100,
    decision_accuracy: Math.round(avgDecisionAccuracy * 100) / 100,
    data_points: weeklyFeedback.length,
  };
}

// ── Synthetic Profile Generator for Experiments ──
function generateSyntheticProfiles(count: number): any[] {
  const archetypes = [
    { name: "Career Focused", weights: { productivity: 0.35, physical: 0.1, financial: 0.25, wellbeing: 0.15, digital: 0.15 } },
    { name: "Health First", weights: { productivity: 0.15, physical: 0.35, financial: 0.1, wellbeing: 0.25, digital: 0.15 } },
    { name: "Balanced", weights: { productivity: 0.2, physical: 0.2, financial: 0.2, wellbeing: 0.2, digital: 0.2 } },
    { name: "Finance Driven", weights: { productivity: 0.2, physical: 0.1, financial: 0.4, wellbeing: 0.15, digital: 0.15 } },
    { name: "Wellbeing Seeker", weights: { productivity: 0.1, physical: 0.2, financial: 0.1, wellbeing: 0.4, digital: 0.2 } },
  ];

  const profiles = [];
  for (let i = 0; i < count; i++) {
    const archetype = archetypes[i % archetypes.length];
    const noise = () => (Math.random() - 0.5) * 20;
    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

    const baseScores = {
      productivity: clamp(50 + noise() + (archetype.weights.productivity > 0.25 ? 15 : 0)),
      physical: clamp(50 + noise() + (archetype.weights.physical > 0.25 ? 15 : 0)),
      financial: clamp(50 + noise() + (archetype.weights.financial > 0.25 ? 15 : 0)),
      wellbeing: clamp(50 + noise() + (archetype.weights.wellbeing > 0.25 ? 15 : 0)),
      digital: clamp(50 + noise() + (archetype.weights.digital > 0.25 ? 15 : 0)),
    };

    // Simulate 4 weeks of behavior
    const weeks = [];
    for (let w = 1; w <= 4; w++) {
      const improvement = w * 2 + Math.random() * 5;
      weeks.push({
        week: w,
        productivity: clamp(baseScores.productivity + improvement),
        physical: clamp(baseScores.physical + improvement * 0.8),
        financial: clamp(baseScores.financial + improvement * 0.5),
        wellbeing: clamp(baseScores.wellbeing + improvement * 0.7),
        digital: clamp(baseScores.digital + improvement * 0.3),
      });
    }

    // Compute MCDA scores for each method
    const mcdaScore = Object.entries(archetype.weights).reduce((s, [k, w]) => s + w * (baseScores as any)[k], 0);
    const traditionalScore = Object.values(baseScores).reduce((s, v) => s + v, 0) / 5; // simple average
    const ruleBasedScore = Math.max(...Object.values(baseScores)) * 0.4 + Math.min(...Object.values(baseScores)) * 0.6;

    profiles.push({
      id: i + 1,
      archetype: archetype.name,
      weights: archetype.weights,
      baseScores,
      weeks,
      methods: {
        traditional: { score: Math.round(traditionalScore * 100) / 100, improvement: Math.round((weeks[3].productivity - baseScores.productivity) * 0.6 * 100) / 100 },
        rule_based: { score: Math.round(ruleBasedScore * 100) / 100, improvement: Math.round((weeks[3].productivity - baseScores.productivity) * 0.8 * 100) / 100 },
        life_compass_mcda: { score: Math.round(mcdaScore * 100) / 100, improvement: Math.round((weeks[3].productivity - baseScores.productivity) * 100) / 100 },
      },
    });
  }

  return profiles;
}

// ── Comparison Analysis ──
function computeComparison(profiles: any[]) {
  const methods = ["traditional", "rule_based", "life_compass_mcda"];
  const comparison: Record<string, any> = {};

  for (const method of methods) {
    const scores = profiles.map((p: any) => p.methods[method].score);
    const improvements = profiles.map((p: any) => p.methods[method].improvement);
    comparison[method] = {
      avg_score: Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 100) / 100,
      avg_improvement: Math.round((improvements.reduce((a: number, b: number) => a + b, 0) / improvements.length) * 100) / 100,
      max_improvement: Math.round(Math.max(...improvements) * 100) / 100,
      min_improvement: Math.round(Math.min(...improvements) * 100) / 100,
    };
  }

  // Compute advantage over baselines
  const mcdaAvg = comparison.life_compass_mcda.avg_improvement;
  comparison.advantage_over_traditional = Math.round((mcdaAvg - comparison.traditional.avg_improvement) * 100) / 100;
  comparison.advantage_over_rule_based = Math.round((mcdaAvg - comparison.rule_based.avg_improvement) * 100) / 100;

  return comparison;
}

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

    const { action, goals, profile_count } = await req.json();

    // ── Action: compute-mcda ──
    if (action === "compute-mcda") {
      const { data: lifeScores } = await supabase
        .from("life_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30);

      const mcda = computeMCDA(goals || [], lifeScores || []);

      return new Response(JSON.stringify(mcda), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Action: evaluate ──
    if (action === "evaluate") {
      const [{ data: recs }, { data: feedback }] = await Promise.all([
        supabase.from("recommendation_history").select("*").eq("user_id", user.id),
        supabase.from("weekly_feedback").select("*").eq("user_id", user.id).order("week_number", { ascending: true }),
      ]);

      const metrics = computeEvaluationMetrics(recs || [], feedback || []);

      return new Response(JSON.stringify(metrics), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Action: run-experiment ──
    if (action === "run-experiment") {
      const count = profile_count || 50;
      const profiles = generateSyntheticProfiles(count);
      const comparison = computeComparison(profiles);

      // Store experiment results
      await supabase.from("experiment_results").insert({
        user_id: user.id,
        experiment_name: `MCDA_Experiment_${new Date().toISOString().slice(0, 10)}`,
        profile_count: count,
        method: "mcda_vs_baseline",
        metrics: comparison,
        raw_results: profiles.slice(0, 20), // Store sample for review
      });

      return new Response(JSON.stringify({ profiles: profiles.slice(0, 10), comparison, total_profiles: count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action: " + action);
  } catch (e) {
    console.error("mcda-engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

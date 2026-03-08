import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { FlaskConical, Loader2, TrendingUp, Target, ThumbsUp, Award } from "lucide-react";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

interface EvalMetrics {
  total_recommendations: number;
  accepted_rate: number;
  recommendation_accuracy: number;
  productivity_improvement: number;
  goal_completion_rate: number;
  satisfaction_score: number;
  decision_accuracy: number;
  data_points: number;
}

const EvaluationPipeline = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<EvalMetrics | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch evaluation metrics from edge function
      const { data, error } = await supabase.functions.invoke("mcda-engine", {
        body: { action: "evaluate" },
      });
      if (error) throw error;
      setMetrics(data);

      // Fetch weekly feedback for trend charts
      const { data: feedback } = await supabase
        .from("weekly_feedback" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("week_number", { ascending: true }) as any;
      setWeeklyData(feedback || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load evaluation data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const chartData = useMemo(() =>
    weeklyData.map((w: any) => ({
      week: `W${w.week_number}`,
      productivity: w.productivity_score,
      goalProgress: w.goal_progress,
      accuracy: w.decision_accuracy,
      satisfaction: w.satisfaction_rating,
    })),
    [weeklyData]
  );

  const radarData = metrics ? [
    { metric: "Accuracy", value: metrics.recommendation_accuracy },
    { metric: "Productivity", value: Math.min(100, 50 + metrics.productivity_improvement) },
    { metric: "Goal Completion", value: metrics.goal_completion_rate },
    { metric: "Satisfaction", value: metrics.satisfaction_score },
    { metric: "Decision Acc.", value: metrics.decision_accuracy },
    { metric: "Acceptance", value: metrics.accepted_rate },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Evaluation Pipeline</h2>
          <p className="text-xs text-muted-foreground">Research-grade metrics: accuracy, improvement, and satisfaction</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="ml-auto">
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Target, label: "Rec. Accuracy", value: `${metrics?.recommendation_accuracy ?? 0}%`, color: "text-primary" },
          { icon: TrendingUp, label: "Prod. Improvement", value: `${metrics?.productivity_improvement ?? 0 > 0 ? "+" : ""}${metrics?.productivity_improvement ?? 0}`, color: "text-primary" },
          { icon: Award, label: "Goal Completion", value: `${metrics?.goal_completion_rate ?? 0}%`, color: "text-primary" },
          { icon: ThumbsUp, label: "Satisfaction", value: `${metrics?.satisfaction_score ?? 0}%`, color: "text-primary" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border bg-card">
            <CardContent className="flex flex-col items-center py-4">
              <kpi.icon className={`mb-1 h-5 w-5 ${kpi.color}`} />
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Productivity Trend */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Productivity & Goal Progress Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length < 2 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Submit weekly feedback to see trends.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="productivity" name="Productivity" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="goalProgress" name="Goal Progress" stroke="hsl(var(--chart-emerald, 142 71% 45%))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendation Accuracy */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">AI Recommendation Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length < 2 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Submit weekly feedback to see accuracy trends.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="accuracy" name="Decision Accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Satisfaction Trend */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">User Satisfaction Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length < 2 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Submit weekly feedback to see satisfaction trends.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="satisfaction" name="Satisfaction" stroke="hsl(var(--chart-amber, 45 93% 47%))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">System Performance Radar</CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No evaluation data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Points Info */}
      <Card className="border-border bg-card">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground text-center">
            Based on <span className="font-bold text-foreground">{metrics?.data_points ?? 0}</span> weekly feedback entries
            and <span className="font-bold text-foreground">{metrics?.total_recommendations ?? 0}</span> AI recommendations.
            More data improves metric reliability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationPipeline;

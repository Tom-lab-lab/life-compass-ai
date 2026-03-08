import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import { Beaker, Loader2, TrendingUp, Users } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

interface ComparisonData {
  traditional: { avg_score: number; avg_improvement: number; max_improvement: number; min_improvement: number };
  rule_based: { avg_score: number; avg_improvement: number; max_improvement: number; min_improvement: number };
  life_compass_mcda: { avg_score: number; avg_improvement: number; max_improvement: number; min_improvement: number };
  advantage_over_traditional: number;
  advantage_over_rule_based: number;
}

const ExperimentMode = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileCount, setProfileCount] = useState(50);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [sampleProfiles, setSampleProfiles] = useState<any[]>([]);

  const runExperiment = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mcda-engine", {
        body: { action: "run-experiment", profile_count: profileCount },
      });
      if (error) throw error;
      setComparison(data.comparison);
      setSampleProfiles(data.profiles || []);
      toast.success(`Experiment completed with ${data.total_profiles} synthetic profiles`);
    } catch (err: any) {
      toast.error(err.message || "Experiment failed");
    } finally {
      setLoading(false);
    }
  };

  const comparisonChartData = comparison ? [
    {
      method: "Traditional",
      avgScore: comparison.traditional.avg_score,
      avgImprovement: comparison.traditional.avg_improvement,
    },
    {
      method: "Rule-Based",
      avgScore: comparison.rule_based.avg_score,
      avgImprovement: comparison.rule_based.avg_improvement,
    },
    {
      method: "Life Compass MCDA",
      avgScore: comparison.life_compass_mcda.avg_score,
      avgImprovement: comparison.life_compass_mcda.avg_improvement,
    },
  ] : [];

  const archetypeData = sampleProfiles.length > 0
    ? ["Career Focused", "Health First", "Balanced", "Finance Driven", "Wellbeing Seeker"].map((arch) => {
        const profiles = sampleProfiles.filter((p: any) => p.archetype === arch);
        if (profiles.length === 0) return null;
        const avg = (method: string) =>
          Math.round((profiles.reduce((s: number, p: any) => s + p.methods[method].improvement, 0) / profiles.length) * 100) / 100;
        return { archetype: arch, traditional: avg("traditional"), ruleBased: avg("rule_based"), mcda: avg("life_compass_mcda") };
      }).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Beaker className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Research Experiment Mode</h2>
          <p className="text-xs text-muted-foreground">Synthetic profile testing & method comparison</p>
        </div>
      </div>

      {/* Controls */}
      <Card className="border-border bg-card">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Synthetic Profiles</label>
            <span className="text-sm font-bold text-primary">{profileCount}</span>
          </div>
          <Slider min={10} max={100} step={10} value={[profileCount]} onValueChange={([v]) => setProfileCount(v)} />
          <p className="text-xs text-muted-foreground">
            Generate {profileCount} synthetic user profiles across 5 archetypes and compare Traditional, Rule-Based, and MCDA optimization methods.
          </p>
          <Button onClick={runExperiment} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Beaker className="mr-2 h-4 w-4" />}
            {loading ? "Running Experiment..." : "Run Experiment"}
          </Button>
        </CardContent>
      </Card>

      {comparison && (
        <>
          {/* Advantage Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">+{comparison.advantage_over_traditional}</p>
                  <p className="text-xs text-muted-foreground">Improvement over Traditional Planning</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">+{comparison.advantage_over_rule_based}</p>
                  <p className="text-xs text-muted-foreground">Improvement over Rule-Based System</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Method Comparison Chart */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Method Comparison: Avg Score & Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="method" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="avgScore" name="Avg Score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgImprovement" name="Avg Improvement" fill="hsl(var(--chart-emerald, 142 71% 45%))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Per-Archetype Comparison */}
          {archetypeData.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Improvement by User Archetype</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={archetypeData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="archetype" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="traditional" name="Traditional" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ruleBased" name="Rule-Based" fill="hsl(var(--chart-amber, 45 93% 47%))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="mcda" name="MCDA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Sample Profiles Table */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Sample Synthetic Profiles (first 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-3">#</th>
                      <th className="pb-2 pr-3">Archetype</th>
                      <th className="pb-2 pr-3">Traditional</th>
                      <th className="pb-2 pr-3">Rule-Based</th>
                      <th className="pb-2 pr-3">MCDA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleProfiles.slice(0, 10).map((p: any) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-medium">{p.id}</td>
                        <td className="py-2 pr-3">{p.archetype}</td>
                        <td className="py-2 pr-3">{p.methods.traditional.improvement}</td>
                        <td className="py-2 pr-3">{p.methods.rule_based.improvement}</td>
                        <td className="py-2 pr-3 font-bold text-primary">{p.methods.life_compass_mcda.improvement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ExperimentMode;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Calculator, Loader2 } from "lucide-react";
import type { Goal, LifeScore } from "@/hooks/useDashboardData";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

interface MCDAResult {
  weights: Record<string, number>;
  scores: Record<string, number>;
  lifeScore: number;
  breakdown: { domain: string; weight: number; score: number; contribution: number }[];
}

interface Props {
  goals: Goal[];
  lifeScores: LifeScore[];
}

const MCDAPanel = ({ goals, lifeScores }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MCDAResult | null>(null);

  const compute = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mcda-engine", {
        body: { action: "compute-mcda", goals },
      });
      if (error) throw error;
      setResult(data);
      toast.success("MCDA computation complete");
    } catch (err: any) {
      toast.error(err.message || "Failed to compute MCDA");
    } finally {
      setLoading(false);
    }
  };

  const domainColors: Record<string, string> = {
    productivity: "hsl(var(--primary))",
    physical: "hsl(var(--chart-emerald, 142 71% 45%))",
    financial: "hsl(var(--chart-amber, 45 93% 47%))",
    wellbeing: "hsl(var(--chart-cyan, 187 85% 53%))",
    digital: "hsl(var(--chart-violet, 263 70% 50%))",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">MCDA Decision Model</h2>
          <p className="text-xs text-muted-foreground">
            LifeScore = Σ(w<sub>i</sub> × s<sub>i</sub>) — Multi-Criteria Decision Analysis
          </p>
        </div>
        <Button onClick={compute} disabled={loading} variant="outline" size="sm" className="ml-auto">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
          Compute
        </Button>
      </div>

      {!result && !loading && (
        <Card className="border-border bg-card">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {goals.length < 1
                ? "Add goals with priority weights to compute your MCDA-optimized LifeScore."
                : "Click \"Compute\" to derive domain weights from your goals and calculate the weighted LifeScore."}
            </p>
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <p className="text-xs font-mono text-muted-foreground">
                LifeScore = w₁·Career + w₂·Health + w₃·Finance + w₄·Productivity + w₅·Digital
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Weights are derived from your goal priority rankings (1-5) and assigned weights (0.1-3.0), then normalized to sum to 1.0.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          {/* LifeScore */}
          <Card className="border-border bg-card">
            <CardContent className="flex items-center justify-center gap-6 py-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{result.lifeScore}</p>
                <p className="text-xs text-muted-foreground">Weighted LifeScore</p>
              </div>
              <div className="h-16 w-px bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{goals.length}</p>
                <p className="text-xs text-muted-foreground">Active Goals</p>
              </div>
              <div className="h-16 w-px bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{Object.keys(result.weights).length}</p>
                <p className="text-xs text-muted-foreground">Domains</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Weight Distribution */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Domain Weights (Derived from Goals)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={result.breakdown.map((b) => ({ domain: b.domain.charAt(0).toUpperCase() + b.domain.slice(1), weight: b.weight }))}
                    margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="domain" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 1]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="weight" name="Weight" radius={[4, 4, 0, 0]}>
                      {result.breakdown.map((b, i) => (
                        <Cell key={i} fill={domainColors[b.domain] || "hsl(var(--primary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contribution Breakdown */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Score Contributions (w × s)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={result.breakdown.map((b) => ({
                      domain: b.domain.charAt(0).toUpperCase() + b.domain.slice(1),
                      contribution: b.contribution,
                      score: b.score,
                    }))}
                    margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="domain" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="score" name="Raw Score" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="contribution" name="Weighted Contribution" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Mathematical Breakdown Table */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Mathematical Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Domain</th>
                      <th className="pb-2 pr-4">Weight (wᵢ)</th>
                      <th className="pb-2 pr-4">Score (sᵢ)</th>
                      <th className="pb-2 pr-4">Contribution (wᵢ × sᵢ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.map((b) => (
                      <tr key={b.domain} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium capitalize">{b.domain}</td>
                        <td className="py-2 pr-4">{b.weight}</td>
                        <td className="py-2 pr-4">{b.score}</td>
                        <td className="py-2 pr-4 font-bold text-primary">{b.contribution}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2 pr-4" colSpan={3}>Total LifeScore</td>
                      <td className="py-2 pr-4 text-primary">{result.lifeScore}</td>
                    </tr>
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

export default MCDAPanel;

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logUserActivity } from "@/lib/activityLogger";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, Sparkles, TrendingUp, AlertTriangle, History } from "lucide-react";

const LifeSimulator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    sleep_change: 0,
    screen_time_change: 0,
    exercise_change: 0,
    spending_change: 0,
    study_change: 0,
  });
  const [outcomes, setOutcomes] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("life_simulations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setHistory(data || []);
    // Load the most recent simulation result
    if (data && data.length > 0 && !outcomes) {
      setOutcomes(data[0].projected_outcomes);
      setInputs(data[0].simulation_inputs as any);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadHistory();

    // Realtime subscription
    const channel = supabase
      .channel("life-simulator-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "life_simulations", filter: `user_id=eq.${user.id}` }, (payload) => {
        setOutcomes(payload.new.projected_outcomes);
        loadHistory();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const sliders = [
    { key: "sleep_change", label: "Sleep Hours", min: -3, max: 3, unit: "hrs" },
    { key: "screen_time_change", label: "Screen Time", min: -4, max: 4, unit: "hrs" },
    { key: "exercise_change", label: "Exercise", min: -60, max: 60, unit: "min" },
    { key: "spending_change", label: "Daily Spending", min: -500, max: 500, unit: "₹" },
    { key: "study_change", label: "Study Hours", min: -3, max: 3, unit: "hrs" },
  ];

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-model-health", {
        body: { action: "simulate", simulation_inputs: inputs },
      });
      if (error) throw error;
      setOutcomes(data.outcomes);
      logUserActivity(user!.id, "run_simulation", "LifeSimulator", JSON.stringify(inputs));
      toast({ title: "Simulation complete", description: "30-day projection generated." });
    } catch {
      toast({ title: "Error", description: "Simulation failed.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadPastSimulation = (sim: any) => {
    setInputs(sim.simulation_inputs);
    setOutcomes(sim.projected_outcomes);
    if (user) logUserActivity(user.id, "load_past_simulation", "LifeSimulator", `Loaded simulation: ${sim.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Simulate My Future</h3>
        </div>
        <p className="mb-6 text-xs text-muted-foreground">
          Adjust the sliders to see how behavior changes could impact your life over 30 days.
        </p>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sliders.map((s) => (
            <div key={s.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">{s.label}</label>
                <span className="text-xs font-bold text-primary">
                  {(inputs as any)[s.key] > 0 ? "+" : ""}
                  {(inputs as any)[s.key]} {s.unit}
                </span>
              </div>
              <Slider
                min={s.min}
                max={s.max}
                step={s.key === "spending_change" ? 50 : 1}
                value={[(inputs as any)[s.key]]}
                onValueChange={([v]) => setInputs((p) => ({ ...p, [s.key]: v }))}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="mt-6 flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
          {loading ? "Simulating…" : "Run 30-Day Simulation"}
        </button>
      </div>

      {outcomes && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Overall", value: outcomes.projected_overall },
              { label: "Productivity", value: outcomes.projected_productivity },
              { label: "Wellbeing", value: outcomes.projected_wellbeing },
              { label: "Physical", value: outcomes.projected_physical },
              { label: "Financial", value: outcomes.projected_financial },
              { label: "Digital", value: outcomes.projected_digital },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-gradient-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h4 className="text-xs font-bold text-foreground">Burnout Risk: {outcomes.burnout_probability}%</h4>
              </div>
              <p className="text-xs text-muted-foreground">{outcomes.narrative}</p>
            </div>

            {outcomes.weekly_trajectory?.length > 0 && (
              <div className="rounded-2xl border border-border bg-gradient-card p-5">
                <h4 className="mb-3 text-xs font-bold text-foreground">Weekly Trajectory</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={outcomes.weekly_trajectory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(v) => `W${v}`} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="overall" stroke="hsl(var(--primary))" strokeWidth={2} name="Overall Score" />
                      <Line type="monotone" dataKey="burnout_risk" stroke="hsl(var(--destructive))" strokeWidth={2} name="Burnout Risk" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Simulation History */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-border bg-gradient-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground">Past Simulations</h4>
          </div>
          <div className="space-y-2">
            {history.map((sim) => (
              <button
                key={sim.id}
                onClick={() => loadPastSimulation(sim)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-left transition-colors hover:border-primary"
              >
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-foreground">
                    Overall: {(sim.projected_outcomes as any)?.projected_overall ?? "—"}
                  </span>
                  <span className="text-muted-foreground">
                    Burnout: {(sim.projected_outcomes as any)?.burnout_probability ?? "—"}%
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(sim.created_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LifeSimulator;

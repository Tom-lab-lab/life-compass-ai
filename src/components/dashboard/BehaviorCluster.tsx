import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Users, RefreshCw, Loader2 } from "lucide-react";

const clusterInfo: Record<string, { emoji: string; label: string; tone: string; color: string }> = {
  balanced: { emoji: "⚖️", label: "Balanced", tone: "You maintain good equilibrium across life domains.", color: "text-emerald-400" },
  burnout_prone: { emoji: "🔥", label: "Burnout Prone", tone: "You push hard — let's protect your energy.", color: "text-amber-400" },
  high_performer: { emoji: "🚀", label: "High Performer", tone: "You're optimizing — let's fine-tune further.", color: "text-primary" },
  impulsive_spender: { emoji: "💸", label: "Impulsive Spender", tone: "Financial awareness can unlock big gains.", color: "text-rose-400" },
  screen_heavy: { emoji: "📱", label: "Screen Heavy", tone: "Digital balance is your biggest lever.", color: "text-violet-400" },
};

const BehaviorCluster = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cluster, setCluster] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_behavior_clusters")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setCluster(data); });
  }, [user?.id]);

  const classify = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-model-health", {
        body: { action: "classify-behavior" },
      });
      if (error) throw error;
      if (data.cluster) {
        setCluster({ cluster_type: data.cluster.cluster_type, confidence_score: data.cluster.confidence_score });
        toast({ title: "Classification complete", description: `You're classified as: ${data.cluster.cluster_type}` });
      } else {
        toast({ title: "Not enough data", description: "Log more activity to get classified.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Classification failed.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const info = cluster ? clusterInfo[cluster.cluster_type] || clusterInfo.balanced : null;

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Behavioral Cluster</h3>
        </div>
        <button onClick={classify} disabled={loading} className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Classify
        </button>
      </div>

      {!cluster ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Click Classify to analyze your behavioral patterns.</p>
      ) : (
        <div className="text-center">
          <p className="mb-2 text-4xl">{info?.emoji}</p>
          <p className={`text-lg font-bold ${info?.color}`}>{info?.label}</p>
          <p className="mb-3 text-xs text-muted-foreground">Confidence: {cluster.confidence_score}%</p>
          <p className="text-xs text-muted-foreground">{info?.tone}</p>
        </div>
      )}
    </div>
  );
};

export default BehaviorCluster;

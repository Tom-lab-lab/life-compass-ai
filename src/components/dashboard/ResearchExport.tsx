import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, FileJson, FileSpreadsheet, Loader2, Shield } from "lucide-react";

const ResearchExport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: "json" | "csv") => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-model-health", {
        body: { action: "research-export" },
      });
      if (error) throw error;

      let blob: Blob;
      let filename: string;

      if (format === "json") {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        filename = `ula-research-${data.anonymized_id.slice(0, 8)}.json`;
      } else {
        const rows: string[] = [];
        // Activity logs CSV
        rows.push("type,value,category,date");
        (data.activity_logs || []).forEach((l: any) => {
          rows.push(`${l.log_type},${l.value},${l.category || ""},${l.logged_at}`);
        });
        rows.push("");
        rows.push("domain,prediction,risk,confidence,status,date");
        (data.predictions || []).forEach((p: any) => {
          rows.push(`${p.domain},"${p.prediction_text}",${p.risk_score},${p.confidence_score},${p.status},${p.created_at}`);
        });
        blob = new Blob([rows.join("\n")], { type: "text/csv" });
        filename = `ula-research-${data.anonymized_id.slice(0, 8)}.csv`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: `Downloaded as ${format.toUpperCase()}` });
    } catch {
      toast({ title: "Error", description: "Export failed.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Research Data Export</h3>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <div>
          <p className="text-xs font-semibold text-foreground">Privacy-Safe Export</p>
          <p className="text-[10px] text-muted-foreground">
            Exports are fully anonymized. No email, name, device info, or personal identifiers are included. Data is assigned a random anonymized ID.
          </p>
        </div>
      </div>

      <div className="mb-4 text-xs text-muted-foreground">
        <p className="mb-2 font-semibold text-foreground">Included data:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Time-series activity logs (steps, screen time, spending, sleep, study)</li>
          <li>AI predictions with risk/confidence scores</li>
          <li>Model accuracy metrics by domain</li>
          <li>Prediction feedback history</li>
          <li>Behavioral cluster classification</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleExport("json")}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
          Export JSON
        </button>
        <button
          onClick={() => handleExport("csv")}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/30 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default ResearchExport;

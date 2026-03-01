import { WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { useOffline } from "@/hooks/useOffline";
import { useLocale } from "@/hooks/useLocale";
import { cn } from "@/lib/utils";

const OfflineIndicator = () => {
  const { isOnline, isSyncing, queueCount, triggerSync } = useOffline();
  const { t } = useLocale();

  if (isOnline && queueCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      {!isOnline && (
        <>
          <WifiOff className="h-4 w-4 text-warning" />
          <span className="text-xs font-medium text-warning">{t("offline.badge")}</span>
        </>
      )}
      {queueCount > 0 && (
        <>
          <CloudOff className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {queueCount} {t("offline.queued")}
          </span>
          {isOnline && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="rounded p-1 text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
            </button>
          )}
        </>
      )}
      {isSyncing && (
        <span className="text-xs text-primary">{t("offline.syncing")}</span>
      )}
    </div>
  );
};

export default OfflineIndicator;

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { syncQueue, getQueuedActions } from "@/lib/offline-sync";

interface OfflineContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  queueCount: number;
  triggerSync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue>({
  isOnline: true,
  isSyncing: false,
  queueCount: 0,
  triggerSync: async () => {},
});

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const refreshQueueCount = useCallback(async () => {
    const actions = await getQueuedActions();
    setQueueCount(actions.length);
  }, []);

  useEffect(() => {
    refreshQueueCount();
    const interval = setInterval(refreshQueueCount, 10000);
    return () => clearInterval(interval);
  }, [refreshQueueCount]);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncQueue();
      await refreshQueueCount();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshQueueCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queueCount > 0) {
      triggerSync();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <OfflineContext.Provider value={{ isOnline, isSyncing, queueCount, triggerSync }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);

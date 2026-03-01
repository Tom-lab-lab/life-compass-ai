import { get, set, del, keys } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";

export interface QueuedAction {
  id: string;
  table: string;
  type: "insert" | "update" | "delete";
  data: Record<string, unknown>;
  createdAt: number;
}

const QUEUE_PREFIX = "sync_queue_";

export async function queueAction(action: Omit<QueuedAction, "id" | "createdAt">) {
  const item: QueuedAction = {
    ...action,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await set(`${QUEUE_PREFIX}${item.id}`, item);
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  const allKeys = await keys();
  const queueKeys = allKeys.filter((k) => String(k).startsWith(QUEUE_PREFIX));
  const items: QueuedAction[] = [];
  for (const key of queueKeys) {
    const val = await get(key);
    if (val) items.push(val as QueuedAction);
  }
  return items.sort((a, b) => a.createdAt - b.createdAt);
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const actions = await getQueuedActions();
  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      if (action.type === "insert") {
        const { error } = await supabase.from(action.table as any).insert(action.data as any);
        if (error) throw error;
      } else if (action.type === "update") {
        const { id, ...rest } = action.data;
        const { error } = await supabase.from(action.table as any).update(rest as any).eq("id", id as string);
        if (error) throw error;
      } else if (action.type === "delete") {
        const { error } = await supabase.from(action.table as any).delete().eq("id", action.data.id as string);
        if (error) throw error;
      }
      await del(`${QUEUE_PREFIX}${action.id}`);
      synced++;
    } catch (e) {
      console.error("Sync failed for action:", action.id, e);
      failed++;
    }
  }
  return { synced, failed };
}

// Cache data locally for offline reads
const CACHE_PREFIX = "cache_";

export async function cacheData(key: string, data: unknown) {
  await set(`${CACHE_PREFIX}${key}`, { data, cachedAt: Date.now() });
}

export async function getCachedData<T>(key: string): Promise<{ data: T; cachedAt: number } | null> {
  const val = await get(`${CACHE_PREFIX}${key}`);
  return val as { data: T; cachedAt: number } | null;
}

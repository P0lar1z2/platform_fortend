import { useCallback, useEffect, useRef, useState } from "react";
import { readJSON, writeJSON } from "../lib/storage";
import { WATCHLIST_CAPACITY, WATCHLIST_WARN_THRESHOLD } from "../lib/constants";
import { useAuth } from "./useAuth";
import {
  addToWatchlist as apiAdd,
  fetchWatchlist as apiFetch,
  removeFromWatchlist as apiRemove,
} from "../api/watchlist";
import type { WatchlistServerItem } from "../api/types";
import { getWatchIdentity } from "../lib/watchIdentity";

export interface WatchlistEntry {
  catalogId?: string;
  ref: string;
  brand?: string;
  name?: string;
  nameCn?: string;
  price?: string;
  thumbUrl?: string;
  addedAt: number;
}

const KEY = "raventik:watchlist";
const EVT = "raventik:watchlist:change";

function dispatch() {
  window.dispatchEvent(new Event(EVT));
}

function serverToEntry(s: WatchlistServerItem): WatchlistEntry {
  return {
    catalogId: s.catalogId,
    ref: s.ref,
    brand: s.brand,
    name: s.name,
    thumbUrl: s.thumbUrl ?? undefined,
    addedAt: new Date(s.addedAt).getTime(),
  };
}

export type AddResult =
  | { ok: true; entry: WatchlistEntry }
  | { ok: false; reason: "full" | "duplicate" };

export function useWatchlist() {
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState<WatchlistEntry[]>(() => readJSON<WatchlistEntry[]>(KEY, []));
  const lastSyncedUserId = useRef<string | null>(null);

  useEffect(() => {
    const sync = () => setList(readJSON<WatchlistEntry[]>(KEY, []));
    window.addEventListener(EVT, sync);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) sync(); };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // 登录后:把本地未上传条目静默 POST(后端 {user_id, ref} 唯一索引幂等),再拉服务端覆盖本地。
  // 登出:保留本地 cache,未登录使用仍能 add/remove。
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      lastSyncedUserId.current = null;
      return;
    }
    if (lastSyncedUserId.current === user.id) return;
    lastSyncedUserId.current = user.id;

    (async () => {
      try {
        const resp = await apiFetch();
        const serverIdentities = new Set(
          resp.items.map(i => getWatchIdentity(i.ref, i.catalogId))
        );

        const local = readJSON<WatchlistEntry[]>(KEY, []);
        const toUpload = local.filter(
          e => !serverIdentities.has(getWatchIdentity(e.ref, e.catalogId))
        );
        await Promise.all(
          toUpload.map(e => apiAdd(e.ref, e.catalogId).catch(() => null))
        );

        const authoritative = await apiFetch();
        const merged = authoritative.items.map(serverToEntry);
        writeJSON(KEY, merged);
        setList(merged);
        dispatch();
      } catch {
        // 401 / 离线: 保持本地 state
      }
    })();
  }, [user, authLoading]);

  const isWatched = useCallback(
    (ref: string, catalogId?: string) => {
      const identity = getWatchIdentity(ref, catalogId);
      return list.some(e => getWatchIdentity(e.ref, e.catalogId) === identity);
    },
    [list],
  );

  const add = useCallback((entry: Omit<WatchlistEntry, "addedAt">): AddResult => {
    const cur = readJSON<WatchlistEntry[]>(KEY, []);
    const identity = getWatchIdentity(entry.ref, entry.catalogId);
    if (cur.some(e => getWatchIdentity(e.ref, e.catalogId) === identity)) {
      return { ok: false, reason: "duplicate" };
    }
    if (cur.length >= WATCHLIST_CAPACITY) return { ok: false, reason: "full" };
    const full: WatchlistEntry = { ...entry, addedAt: Date.now() };
    const next = [full, ...cur];
    writeJSON(KEY, next);
    setList(next);
    dispatch();

    if (user) {
      apiAdd(entry.ref, entry.catalogId).catch(() => {
        const rolled = readJSON<WatchlistEntry[]>(KEY, []).filter(
          e => getWatchIdentity(e.ref, e.catalogId) !== identity
        );
        writeJSON(KEY, rolled);
        setList(rolled);
        dispatch();
      });
    }

    return { ok: true, entry: full };
  }, [user]);

  const remove = useCallback((ref: string, catalogId?: string) => {
    const cur = readJSON<WatchlistEntry[]>(KEY, []);
    const identity = getWatchIdentity(ref, catalogId);
    const removed = cur.find(e => getWatchIdentity(e.ref, e.catalogId) === identity);
    const next = cur.filter(e => getWatchIdentity(e.ref, e.catalogId) !== identity);
    writeJSON(KEY, next);
    setList(next);
    dispatch();

    if (user && removed) {
      apiRemove(ref, catalogId).catch(() => {
        const existing = readJSON<WatchlistEntry[]>(KEY, []);
        const restored = existing.some(
          e => getWatchIdentity(e.ref, e.catalogId) === identity
        ) ? existing : [removed, ...existing];
        writeJSON(KEY, restored);
        setList(restored);
        dispatch();
      });
    }
  }, [user]);

  const toggle = useCallback((entry: Omit<WatchlistEntry, "addedAt">): AddResult | { ok: true; removed: true } => {
    if (isWatched(entry.ref, entry.catalogId)) {
      remove(entry.ref, entry.catalogId);
      return { ok: true, removed: true };
    }
    return add(entry);
  }, [isWatched, add, remove]);

  const count = list.length;
  const isFull = count >= WATCHLIST_CAPACITY;
  const isNearLimit = count >= WATCHLIST_WARN_THRESHOLD;

  return { list, count, capacity: WATCHLIST_CAPACITY, isWatched, add, remove, toggle, isFull, isNearLimit };
}

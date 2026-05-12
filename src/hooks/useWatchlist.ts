import { useCallback, useEffect, useState } from "react";
import { readJSON, writeJSON } from "../lib/storage";
import { WATCHLIST_CAPACITY, WATCHLIST_WARN_THRESHOLD } from "../lib/constants";

export interface WatchlistEntry {
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

// Cross-component sync inside the same tab
function dispatch() {
  window.dispatchEvent(new Event(EVT));
}

export type AddResult =
  | { ok: true; entry: WatchlistEntry }
  | { ok: false; reason: "full" | "duplicate" };

export function useWatchlist() {
  const [list, setList] = useState<WatchlistEntry[]>(() => readJSON<WatchlistEntry[]>(KEY, []));

  useEffect(() => {
    const sync = () => setList(readJSON<WatchlistEntry[]>(KEY, []));
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", e => {
      if (e.key === KEY) sync();
    });
    return () => window.removeEventListener(EVT, sync);
  }, []);

  const isWatched = useCallback((ref: string) => list.some(e => e.ref === ref), [list]);

  const add = useCallback((entry: Omit<WatchlistEntry, "addedAt">): AddResult => {
    const cur = readJSON<WatchlistEntry[]>(KEY, []);
    if (cur.some(e => e.ref === entry.ref)) return { ok: false, reason: "duplicate" };
    if (cur.length >= WATCHLIST_CAPACITY) return { ok: false, reason: "full" };
    const full: WatchlistEntry = { ...entry, addedAt: Date.now() };
    const next = [full, ...cur];
    writeJSON(KEY, next);
    setList(next);
    dispatch();
    return { ok: true, entry: full };
  }, []);

  const remove = useCallback((ref: string) => {
    const cur = readJSON<WatchlistEntry[]>(KEY, []);
    const next = cur.filter(e => e.ref !== ref);
    writeJSON(KEY, next);
    setList(next);
    dispatch();
  }, []);

  const toggle = useCallback((entry: Omit<WatchlistEntry, "addedAt">): AddResult | { ok: true; removed: true } => {
    if (isWatched(entry.ref)) {
      remove(entry.ref);
      return { ok: true, removed: true };
    }
    return add(entry);
  }, [isWatched, add, remove]);

  const count = list.length;
  const isFull = count >= WATCHLIST_CAPACITY;
  const isNearLimit = count >= WATCHLIST_WARN_THRESHOLD;

  return { list, count, capacity: WATCHLIST_CAPACITY, isWatched, add, remove, toggle, isFull, isNearLimit };
}

import { useCallback, useEffect, useState } from "react";
import { readJSON, writeJSON } from "../lib/storage";
import { SEARCH_HISTORY_LIMIT } from "../lib/constants";

const KEY = "raventik:search-history";
const EVT = "raventik:search-history:change";

function dispatch() {
  window.dispatchEvent(new Event(EVT));
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => readJSON<string[]>(KEY, []));

  useEffect(() => {
    const sync = () => setHistory(readJSON<string[]>(KEY, []));
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);

  // Record a query. Duplicates get promoted to the front (PDF 2.2 单条规则)
  const push = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    const cur = readJSON<string[]>(KEY, []);
    const dedup = cur.filter(item => item !== q);
    const next = [q, ...dedup].slice(0, SEARCH_HISTORY_LIMIT);
    writeJSON(KEY, next);
    setHistory(next);
    dispatch();
  }, []);

  const remove = useCallback((query: string) => {
    const cur = readJSON<string[]>(KEY, []);
    const next = cur.filter(item => item !== query);
    writeJSON(KEY, next);
    setHistory(next);
    dispatch();
  }, []);

  const clear = useCallback(() => {
    writeJSON(KEY, []);
    setHistory([]);
    dispatch();
  }, []);

  return { history, push, remove, clear };
}

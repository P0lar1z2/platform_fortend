import { apiClient, API_MOCK } from "./client";
import type { WatchlistResponse, WatchlistServerItem } from "./types";
import { WATCHLIST_CAPACITY } from "../lib/constants";

// 后端 watchlist 接口 —— 强制登录，Phase 12 完成后才能 API_MOCK=0 走真接口
// 当前（Phase 9）useWatchlist hook 用 localStorage 不调这里，这些函数留给 Phase 11.F.7 切服务端时用

export async function fetchWatchlist(): Promise<WatchlistResponse> {
  if (!API_MOCK) {
    const { data } = await apiClient.get<WatchlistResponse>("/watchlist");
    return data;
  }
  return { items: [], count: 0, capacity: WATCHLIST_CAPACITY };
}

export async function addToWatchlist(ref: string, catalogId?: string): Promise<WatchlistServerItem> {
  if (!API_MOCK) {
    const { data } = await apiClient.post<WatchlistServerItem>("/watchlist", { ref, catalogId });
    return data;
  }
  return { ref, catalogId, addedAt: new Date().toISOString() };
}

export async function removeFromWatchlist(ref: string, catalogId?: string): Promise<void> {
  if (!API_MOCK) {
    await apiClient.delete(`/watchlist/${encodeURIComponent(ref)}`, {
      params: catalogId ? { catalog_id: catalogId } : undefined,
    });
    return;
  }
}

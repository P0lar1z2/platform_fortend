import { apiClient, API_MOCK } from "./client";
import type { PageEnvelope, WatchListItem } from "./types";

export interface SearchParams {
  q?: string;
  brand?: string;
  page?: number;
  size?: number;
}

export async function searchWatches(params: SearchParams): Promise<PageEnvelope<WatchListItem>> {
  if (!API_MOCK) {
    const { data } = await apiClient.get<PageEnvelope<WatchListItem>>("/search", { params });
    return data;
  }
  return MOCK_SEARCH(params);
}

function MOCK_SEARCH(p: SearchParams): PageEnvelope<WatchListItem> {
  const size = p.size ?? 12;
  return {
    items: Array.from({ length: size }, (_, i) => ({
      ref: `MOCK-${1000 + i}`,
      brand: ["Rolex", "Omega", "AP", "PP"][i % 4],
      brandSlug: ["rolex", "omega", "ap", "pp"][i % 4],
      family: "Submariner",
      name: `Mock model #${i + 1}`,
      transactions: 120 + i * 7,
    })),
    total: 247,
    page: p.page ?? 1,
    size,
  };
}

import { apiClient, API_MOCK } from "./client";
import type { PageEnvelope, WatchListItem } from "./types";

export interface SearchParams {
  q?: string;
  brand?: string;
  page?: number;
  size?: number;
  /** "tx_desc" = 按成交数从多到少；省略 = 默认按字母序 */
  sort?: string;
  /** true 显示零交易型号；省略/false = 隐藏 */
  include_zero?: boolean;
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
  const colors = ["Black", "Blue", "White", "Green", "Silver", "Grey"];
  const materials = ["Oystersteel", "Stainless Steel", "Stainless Steel / White Gold", "Everose Gold", "Titanium"];
  const families = ["Submariner", "GMT-Master II", "Daytona", "Datejust", "Nautilus", "Speedmaster"];
  const brandPool = [
    { name: "Rolex", slug: "rolex" },
    { name: "Omega", slug: "omega" },
    { name: "Audemars Piguet", slug: "audemars-piguet" },
    { name: "Patek Philippe", slug: "patek-philippe" },
  ];
  return {
    items: Array.from({ length: size }, (_, i) => {
      const b = brandPool[i % brandPool.length];
      return {
        ref: `MOCK-${1000 + (p.page ?? 1) * 100 + i}`,
        brand: b.name,
        brandSlug: b.slug,
        family: families[i % families.length],
        name: `${b.name} ${families[i % families.length]} ${i + 1}`,
        dialColor: colors[i % colors.length],
        material: materials[i % materials.length],
        transactions: 120 + i * 7,
        thumbUrl: null,
      };
    }),
    total: 247,
    page: p.page ?? 1,
    size,
  };
}

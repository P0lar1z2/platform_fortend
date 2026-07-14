import { apiClient, API_MOCK } from "./client";
import type { BrandSummary, BrandDetail, WatchListItem } from "./types";

export async function listBrands(): Promise<{ items: BrandSummary[] }> {
  if (!API_MOCK) {
    const { data } = await apiClient.get<{ items: BrandSummary[] }>("/brands");
    return data;
  }
  return {
    items: [
      { slug: "rolex", name: "Rolex", nameCn: "劳力士", modelCount: 142, totalTransactions: 12400 },
      { slug: "omega", name: "Omega", nameCn: "欧米茄", modelCount: 89, totalTransactions: 8200 },
      { slug: "patek-philippe", name: "Patek Philippe", nameCn: "百达翡丽", modelCount: 38, totalTransactions: 3100 },
      { slug: "audemars-piguet", name: "Audemars Piguet", nameCn: "爱彼", modelCount: 41, totalTransactions: 2800 },
      { slug: "cartier", name: "Cartier", nameCn: "卡地亚", modelCount: 57, totalTransactions: 4500 },
      { slug: "iwc", name: "IWC", nameCn: "万国", modelCount: 44, totalTransactions: 3900 },
      { slug: "tudor", name: "Tudor", nameCn: "帝舵", modelCount: 36, totalTransactions: 5100 },
      { slug: "grand-seiko", name: "Grand Seiko", nameCn: "冠蓝狮", modelCount: 28, totalTransactions: 2200 },
    ],
  };
}

export interface BrandWatchesParams {
  family?: string;
  page?: number;
  size?: number;
  sort_by?: "transactions";
  sort_dir?: "asc" | "desc";
  /** true 显示零交易型号；省略/false = 隐藏 */
  include_zero?: boolean;
}

export async function getBrand(slug: string, params?: BrandWatchesParams): Promise<BrandDetail> {
  if (!API_MOCK) {
    const { data } = await apiClient.get<BrandDetail>(`/brands/${encodeURIComponent(slug)}`, { params });
    return data;
  }
  const size = params?.size ?? 12;
  const items: WatchListItem[] = Array.from({ length: size }, (_, i) => ({
    ref: `${slug.toUpperCase().slice(0, 3)}-${1000 + i}`,
    brand: slug.charAt(0).toUpperCase() + slug.slice(1),
    brandSlug: slug,
    family: ["Submariner", "Daytona", "GMT-Master II"][i % 3],
    name: `${slug} model ${i + 1}`,
    transactions: 120 + i * 9,
  })).sort((a, b) => (b.transactions ?? 0) - (a.transactions ?? 0));
  return {
    brand: { slug, name: slug.charAt(0).toUpperCase() + slug.slice(1), modelCount: 142, totalTransactions: 12400 },
    families: ["Submariner", "GMT-Master II", "Daytona", "Datejust", "Day-Date", "Explorer II"],
    watches: { items, total: 142, page: params?.page ?? 1, size },
  };
}

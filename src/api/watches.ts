import { apiClient, API_MOCK } from "./client";
import type { WatchInfo, MarketResponse, MarketTransactionsPage, Period } from "./types";

export async function fetchWatch(ref: string): Promise<WatchInfo> {
  if (!API_MOCK) {
    const { data } = await apiClient.get<WatchInfo>(`/watches/${encodeURIComponent(ref)}`);
    return data;
  }
  return MOCK_WATCH(ref);
}

export async function fetchMarket(ref: string, period: Period): Promise<MarketResponse> {
  if (!API_MOCK) {
    const { data } = await apiClient.get<MarketResponse>(
      `/watches/${encodeURIComponent(ref)}/market`,
      { params: { period } }
    );
    return data;
  }
  return MOCK_MARKET(period);
}

export async function fetchTransactions(
  ref: string,
  period: Period,
  page: number,
  pageSize: number,
  sortBy?: "date" | "price",
  sortDir?: "asc" | "desc",
): Promise<MarketTransactionsPage> {
  if (!API_MOCK) {
    const { data } = await apiClient.get<MarketTransactionsPage>(
      `/watches/${encodeURIComponent(ref)}/transactions`,
      { params: { period, page, page_size: pageSize, sort_by: sortBy, sort_dir: sortDir } },
    );
    return data;
  }
  return { period, windowDays: 90, page, pageSize, total: 0, totalPages: 0, transactions: [] };
}

function MOCK_WATCH(ref: string): WatchInfo {
  return {
    ref,
    brand: "Rolex",
    brandSlug: "rolex",
    family: "Submariner",
    name: "Submariner Date",
    images: [],
    fields: [
      { label: "机芯", value: "Automatic (Cal. 3235)" },
      { label: "表径", value: "41mm" },
      { label: "表壳材质", value: "Oystersteel" },
      { label: "表圈", value: "Ceramic (Cerachrom)" },
      { label: "表镜", value: "Sapphire" },
      { label: "防水", value: "300m" },
      { label: "动力储备", value: "70 hours" },
      { label: "表带", value: "Oyster, Oystersteel" },
      { label: "表盘颜色", value: "Black" },
      { label: "生产年份", value: "2020–Present" },
      { label: "限量", value: null },
    ],
  };
}

function MOCK_MARKET(period: Period): MarketResponse {
  const days = period === "1M" ? 30 : period === "3M" ? 90 : period === "6M" ? 180 : period === "1Y" ? 365 : 730;
  const granularity = period === "1M" || period === "3M" ? "day" : period === "All" ? "month" : "week";
  const stride = granularity === "day" ? 1 : granularity === "week" ? 7 : 30;

  const points: MarketResponse["chart"]["points"] = [];
  const start = Date.now() - days * 86400000;
  for (let t = start; t <= Date.now(); t += stride * 86400000) {
    const d = new Date(t).toISOString().slice(0, 10);
    const wave = Math.sin((t - start) / 5e9);
    points.push({ date: d, starbuyer: Math.round(1300000 + wave * 80000), ecoauc: Math.round(1550000 + wave * 60000) });
  }

  return {
    period,
    windowDays: days,
    overall: { avg: 1442746, max: 1788875, min: 1028295, count: 18 },
    perSource: [
      { key: "starbuyer", name: "StarBuyers", avg: 1286419, max: 1691827, min: 1046968, count: 8 },
      { key: "ecoauc", name: "EcoAuc", avg: 1567808, max: 1788875, min: 1028295, count: 10 },
    ],
    chart: { granularity, points },
  };
}

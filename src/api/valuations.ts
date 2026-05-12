import { apiClient } from "./client";
import type { ValuationRequest, ValuationResponse, PriceRange } from "./types";

// PDF 4.3 价格校验
export async function fetchPriceRange(ref: string): Promise<PriceRange> {
  // TODO: 切真实接口
  // const { data } = await apiClient.get<PriceRange>(`/watches/${encodeURIComponent(ref)}/price-range`);
  // return data;
  void apiClient;
  await sleep(120);
  return { p5: 950000, p95: 1800000 };
}

export async function postValuation(req: ValuationRequest): Promise<ValuationResponse> {
  // TODO: 切真实接口
  // const { data } = await apiClient.post<ValuationResponse>("/valuations", req);
  // return data;
  await sleep(280);
  return MOCK_VALUATION(req);
}

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

function MOCK_VALUATION(req: ValuationRequest): ValuationResponse {
  const buy = req.mode === "price" ? req.value : 1200000;
  return {
    bestCombo: { route: "jp_domestic", platform: "starbuyer", margin: 4.4, cost: 1389500, net: 1450500, decision: "BUY" },
    level: "L3",
    samples: 21,
    windowDays: 30,
    routes: [
      {
        key: "jp_domestic",
        label: "日本境内",
        cost: Math.round(buy * 1.13),
        avgMargin: 3.2,
        avgRevenue: 1420000,
        samples: 21,
        platforms: [
          { key: "starbuyer", name: "StarBuyers", revenue: 1500000, feeRate: 0.033, net: 1450500, margin: 4.4, decision: "BUY" },
          { key: "ecoauc", name: "EcoAuc", revenue: 1420000, feeRate: 0.028, net: 1380240, margin: -0.7, decision: "SKIP" },
        ],
      },
      {
        key: "cn_to_jp",
        label: "中国→日本",
        cost: Math.round(buy * 1.22),
        avgMargin: 1.1,
        avgRevenue: 1380000,
        samples: 14,
        platforms: [
          { key: "starbuyer", name: "StarBuyers", revenue: 1430000, feeRate: 0.033, net: 1382810, margin: 0.9, decision: "SKIP" },
          { key: "ecoauc", name: "EcoAuc", revenue: 1380000, feeRate: 0.028, net: 1341360, margin: -2.1, decision: "LOSS" },
        ],
      },
    ],
    // PDF 4.4.4 询价范围 = buy × (1 - lower_pct, 1 + upper_pct) 默认 -20%/+30%
    // 后端按"价格→成色加分→附件加分"排序
    sourcing: [
      { platform: "Yahoo", title: "ROLEX Submariner Date 126610LN 美品", ref: req.ref, price: Math.round(buy * 0.92), condition: "A", accessories: { box: true, card: true }, listingUrl: "https://example.com/yahoo/1" },
      { platform: "Rakuten", title: "ロレックス サブマリーナデイト 黒 2022", ref: req.ref, price: Math.round(buy * 0.96), condition: "A", accessories: { box: true, card: false }, listingUrl: "https://example.com/rakuten/1" },
      { platform: "eBay", title: "Rolex Submariner Date Stainless Steel Black", ref: req.ref, price: Math.round(buy * 1.04), condition: "B", accessories: { box: false, card: true }, listingUrl: "https://example.com/ebay/1" },
      { platform: "闲鱼", title: "劳力士 黑水鬼 全套 2021年", ref: req.ref, price: Math.round(buy * 1.12), condition: "A", accessories: { box: true, card: true }, listingUrl: "https://example.com/xianyu/1" },
    ],
  };
}

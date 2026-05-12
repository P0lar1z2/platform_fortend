import { apiClient, API_MOCK } from "./client";

// Config 页面字段较杂，schema 完整版见 docs/api.md。
// 这里类型暂用 loose dict，等 backend 落地再收紧
export interface ConfigSourceLoose {
  key: string;
  name: string;
  type?: string;
  [k: string]: any;
}

export interface ConfigDocLoose {
  sources: ConfigSourceLoose[];
  global: Record<string, any>;
}

export async function fetchConfig(): Promise<ConfigDocLoose> {
  if (!API_MOCK) {
    const { data } = await apiClient.get<ConfigDocLoose>("/config");
    return data;
  }
  return MOCK_CONFIG;
}

export async function updateConfig(doc: ConfigDocLoose): Promise<ConfigDocLoose> {
  if (!API_MOCK) {
    const { data } = await apiClient.put<ConfigDocLoose>("/config", doc);
    return data;
  }
  await new Promise(r => setTimeout(r, 200));
  return doc;
}

const MOCK_CONFIG: ConfigDocLoose = {
  sources: [
    { key: "starbuyer", name: "StarBuyer", type: "成交价平台", buyer_fee: "5", buyer_fee_promo: "3", seller_fee: "3.3", seller_tax: "0" },
    { key: "ecoauc", name: "EcoAuc", type: "成交价平台", buyer_fee: "5", buyer_fee_promo: "", seller_fee: "2.8", seller_tax: "0" },
  ],
  global: {
    tax_rate: "10", fx_rate: "1.0000",
    domestic_ship_threshold: "3000000", domestic_ship_high: "1000", domestic_ship_low: "500",
    intl_shipping: "0", insurance_rate: "0.3",
    target_margin: "5", alert_margin: "10",
    sourcing_upper_pct: "30", sourcing_lower_pct: "20",
    l1_window: "30", l2_window: "90", l2_weight: "95",
    rank_up_coef: "5", hard_defect_coef: "70", min_sample_count: "3", outlier_trim_pct: "5",
    full_set_premium: "50000", warranty_jp_premium: "2", warranty_overseas_premium: "0",
    recent_years: "15", recent_decay_rate: "0.5", old_threshold: "15", old_decay_rate: "3",
  },
};

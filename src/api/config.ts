import { apiClient, API_MOCK } from "./client";
import type { ConfigDoc } from "./types";

export async function fetchConfig(): Promise<ConfigDoc> {
  if (!API_MOCK) {
    const { data } = await apiClient.get<ConfigDoc>("/config");
    return data;
  }
  return MOCK_CONFIG;
}

export async function updateConfig(doc: ConfigDoc): Promise<ConfigDoc> {
  if (!API_MOCK) {
    const { data } = await apiClient.put<ConfigDoc>("/config", doc);
    return data;
  }
  return doc;
}

const MOCK_CONFIG: ConfigDoc = {
  sources: [
    { key: "starbuyer", name: "StarBuyers", buyer_fee: 0.10, buyer_fee_promo: 0.08, seller_fee: 0.033, seller_tax: 0.10 },
    { key: "ecoauc", name: "EcoAuc", buyer_fee: 0.10, buyer_fee_promo: null, seller_fee: 0.028, seller_tax: 0.10 },
  ],
  global: {
    tax_rate: 0.10,
    domestic_freight_low: 500,
    domestic_freight_high: 1000,
    domestic_freight_threshold: 3000000,
    intl_freight: 3500,
    insurance_rate: 0.003,
    target_margin: 10,
    alert_margin: 25,
    sourcing_upper_pct: 30,
    sourcing_lower_pct: 20,
  },
};

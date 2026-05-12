// PDF 4.3 估值接口 schema
import type { DataSourceKey } from "../lib/constants";
import type { DecisionKey, ValuationLevel } from "../lib/labels";

export interface ValuationRequest {
  ref: string;
  mode: "price" | "margin";
  value: number;
  source: "all" | DataSourceKey;
  condition: "S" | "A" | "B" | "C" | "J";
  accessories: { box: boolean; card: boolean };
  warrantyRegion?: string;
  warrantyYear?: number | null;
}

export interface PlatformResult {
  key: DataSourceKey;
  name: string;
  revenue: number;
  feeRate: number;
  net: number;
  margin: number;
  decision: DecisionKey;
}

export interface RouteResult {
  key: string;
  label: string;
  cost: number;
  avgMargin: number;
  avgRevenue: number;
  samples: number;
  platforms: PlatformResult[];
}

export interface ValuationResponse {
  bestCombo: {
    route: string;
    platform: DataSourceKey;
    margin: number;
    cost: number;
    net: number;
    decision: DecisionKey;
  };
  level?: ValuationLevel;
  samples?: number;
  windowDays?: number;
  routes: RouteResult[];
  sourcing?: SourcingListing[];
}

export interface SourcingListing {
  platform: string;
  title: string;
  ref: string;
  price: number;
  condition?: string;
  accessories?: { box: boolean; card: boolean };
  listingUrl: string;
}

export interface PriceRange { p5: number; p95: number; }

export type Period = "1M" | "3M" | "6M" | "1Y" | "All";

export interface WatchBaseInfo {
  ref: string;
  brand: string;
  brandSlug: string;
  modelName: string;
  modelNameCn?: string;
  fields: Array<{ label: string; value: string | null }>;
  thumbUrl?: string;
}

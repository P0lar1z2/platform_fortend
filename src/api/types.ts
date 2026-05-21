// PDF 4.3 估值接口 schema —— 跟 /docs/api.md 严格对齐
import type { DataSourceKey } from "../lib/constants";
import type { DecisionKey, ValuationLevel } from "../lib/labels";

// ─── Valuations (POST /api/valuations) ─────────────────

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

export interface SourcingListing {
  platform: string;
  title: string;
  ref: string;
  price: number;
  condition?: string;
  accessories?: { box: boolean; card: boolean };
  listingUrl: string;
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
  /** margin 模式下后端反解出来的预计买入价(JPY);price 模式时与请求 value 一致 */
  inputPrice?: number;
}

export interface PriceRange { p5: number; p95: number; sampleCount?: number; }

// ─── 通用 ──────────────────────────────────────────────

export type Period = "1M" | "3M" | "6M" | "1Y" | "All";

export interface PageEnvelope<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// ─── Watches (GET /api/watches/:ref) ───────────────────

export interface WatchField {
  label: string;
  value: string | null;
}

export interface WatchInfo {
  ref: string;
  brand: string;
  brandSlug: string;
  family?: string;
  name: string;
  images?: string[];
  fields: WatchField[];
}

export interface WatchListItem {
  ref: string;
  brand: string;
  brandSlug: string;
  family?: string;
  name: string;
  dialColor?: string;
  material?: string;
  transactions?: number;
  thumbUrl?: string | null;
}

// ─── Market (GET /api/watches/:ref/market) ─────────────

export interface MarketTx {
  id: string;
  source: DataSourceKey;
  sourceName: string;
  dateTime?: string;
  date?: string;
  price: number;
  condition?: string;
  hasBox?: boolean;
  hasCard?: boolean;
  material?: string;
  dialColor?: string;
  ref?: string;
  listingUrl?: string;
  thumbUrl?: string;
}

export interface MarketOverall {
  avg: number;
  max: number;
  min: number;
  count: number;
  maxTx?: MarketTx;
  minTx?: MarketTx;
}

export interface MarketPerSource extends MarketOverall {
  key: DataSourceKey;
  name: string;
}

export interface MarketChartPoint {
  date: string;
  [sourceKey: string]: string | number | null;
}

export interface MarketChart {
  granularity: "day" | "week" | "month";
  points: MarketChartPoint[];
}

export interface MarketResponse {
  period: Period;
  windowDays: number;
  overall: MarketOverall;
  perSource: MarketPerSource[];
  chart: MarketChart;
  transactions: MarketTx[];
}

// ─── Brands ────────────────────────────────────────────

export interface BrandSummary {
  slug: string;
  name: string;
  nameCn?: string;
  modelCount: number;
  totalTransactions?: number;
  logoUrl?: string | null;
}

export interface BrandDetail {
  brand: BrandSummary;
  families: string[];
  watches: PageEnvelope<WatchListItem>;
}

// ─── Watchlist ─────────────────────────────────────────

export interface WatchlistServerItem {
  ref: string;
  brand?: string;
  name?: string;
  thumbUrl?: string | null;
  addedAt: string;
}

export interface WatchlistResponse {
  items: WatchlistServerItem[];
  count: number;
  capacity: number;
}

// ─── Auth ──────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  createdAt?: string;
}

// ─── Config ────────────────────────────────────────────

export interface ConfigSource {
  key: DataSourceKey;
  name: string;
  buyer_fee: number;
  buyer_fee_promo: number | null;
  seller_fee: number;
  seller_tax: number;
}

export interface ConfigGlobal {
  tax_rate: number;
  domestic_freight_low: number;
  domestic_freight_high: number;
  domestic_freight_threshold: number;
  intl_freight: number;
  insurance_rate: number;
  target_margin: number;
  alert_margin: number;
  sourcing_upper_pct: number;
  sourcing_lower_pct: number;
}

export interface ConfigDoc {
  sources: ConfigSource[];
  global: ConfigGlobal;
}

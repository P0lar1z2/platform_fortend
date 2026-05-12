// PDF 4.3.1.1 数据源集中配置 —— 全站唯一来源
// 新增数据源只改这一处

export type DataSourceKey = "starbuyer" | "ecoauc";

export interface DataSource {
  key: DataSourceKey;
  name: string;
  color: string;
  logoUrl: string | null;
  logoWidth: number;
  logoHeight: number;
}

export const DATA_SOURCES: DataSource[] = [
  { key: "starbuyer", name: "StarBuyers", color: "#34d399", logoUrl: null, logoWidth: 100, logoHeight: 28 },
  { key: "ecoauc", name: "EcoAuc", color: "#60a5fa", logoUrl: null, logoWidth: 100, logoHeight: 28 },
];

export const DATA_SOURCE_BY_KEY: Record<DataSourceKey, DataSource> = DATA_SOURCES.reduce(
  (acc, s) => ({ ...acc, [s.key]: s }),
  {} as Record<DataSourceKey, DataSource>
);

// PDF 4.4.1 挂牌价平台 (买入货源)
export const SOURCING_PLATFORMS = [
  { key: "yahoo", name: "Yahoo" },
  { key: "rakuten", name: "Rakuten" },
  { key: "ebay", name: "eBay" },
  { key: "xianyu", name: "闲鱼" },
  { key: "private", name: "个人卖家" },
] as const;

// PDF 4.4.2 交易路径
export const TRADE_ROUTES = [
  { key: "jp_domestic", label: "日本境内" },
  { key: "cn_to_jp", label: "中国→日本" },
] as const;

export const WATCHLIST_CAPACITY = 30;
export const WATCHLIST_WARN_THRESHOLD = 25;
export const SEARCH_HISTORY_LIMIT = 8;

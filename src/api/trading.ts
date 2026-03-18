import apiClient from './index'

export interface TradingSignal {
  _id: string
  trace_id: string
  source: string
  source_item_id: string
  source_url?: string
  model_number: string
  brand?: string
  model_name?: string
  hammer_price: number
  estimated_revenue?: number
  total_cost: number
  profit_margin?: number
  decision: string
  valuation_level: string
  confidence: string
  path_id: string
  is_alert: boolean
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
  created_at: string
}

export interface CostBreakdown {
  hammer_price: number
  acquisition_cost: number
  domestic_shipping: number
  intl_shipping: number
  insurance: number
  total: number
}

export interface LevelAttemptLog {
  level: string
  query_params: {
    model_number: string
    condition_rank?: string
    accessories_filter?: string
    window_days: number
    trim_pct: number
  }
  samples_found: number
  samples_after_trim: number
  min_required: number
  hit: boolean
  miss_reason?: string
  raw_avg?: number
  adjustments_applied: { name: string; factor: number; before: number; after: number }[]
  final_price?: number
}

export interface RevenueEstimate {
  estimated_price?: number
  level: string
  confidence: string
  sample_count: number
  min_ref_price?: number
  attempts: LevelAttemptLog[]
}

export interface ValuationResult {
  path_id: string
  cost: CostBreakdown
  revenue: RevenueEstimate
  profit_margin?: number
  decision: string
}

export interface Valuation {
  _id: string
  trace_id: string
  model_number: string
  path_id: string
  cost_breakdown: CostBreakdown
  revenue_estimate: RevenueEstimate
  profit_margin?: number
  decision: string
  config_version: string
  created_at: string
}

export interface SimulateTransaction {
  successful_bid_price?: number
  auction_date?: string
  condition_rank?: string
  has_box?: boolean
  has_warranty_card?: boolean
}

export interface SimulateRequest {
  model_number: string
  catalog_id?: string
  hammer_price: number
  currency?: string  // "JPY" | "CNY" | "EUR" | "USD" | "GBP" | "CHF"
  condition_rank?: string
  has_box?: boolean
  has_warranty_card?: boolean
  warranty_place?: string
  warranty_year?: number
  defect_type?: string
  path_id?: string
  transactions?: SimulateTransaction[]
}

export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
}

export interface FxRatesResponse {
  base: string
  rates: Record<string, number>
  currencies: CurrencyInfo[]
}

// --- Trading Config Types ---

export interface CostModelConfig {
  buyer_fee_coef: number
  buyer_fee_promo?: number | null
  tax_coef: number
  fx_rate: number
  domestic_shipping_threshold: number
  domestic_shipping_high: number
  domestic_shipping_low: number
  intl_shipping: number
  insurance_rate: number
}

export interface WarrantyYearDecay {
  recent_years: number
  recent_decay_per_year: number
  old_threshold_years: number
  old_decay_per_5years: number
}

export interface RevenueModelConfig {
  l1_window_days: number
  l2_window_days: number
  l2_time_weight: number
  rank_up_coef: number
  hard_defect_coef: number
  warranty_jp_coef: number
  warranty_overseas_coef: number
  full_set_premium: number
  min_data_samples: number
  outlier_trim_pct: number
  warranty_year_decay?: WarrantyYearDecay | null
  seller_fee_rate: number
  seller_tax_coef: number
}

export interface DecisionConfig {
  target_margin: number
  alert_margin: number
}

export interface TradingPathConfig {
  path_id: string
  version: string
  cost: CostModelConfig
  revenue: RevenueModelConfig
  decision: DecisionConfig
}

export interface TradingStats {
  unacknowledged_alerts: number
}

// --- API calls ---

export async function listSignals(params?: {
  decision?: string
  is_alert?: boolean
  acknowledged?: boolean
  limit?: number
  skip?: number
}) {
  const response = await apiClient.get<{ signals: TradingSignal[]; count: number }>(
    '/api/v1/trading/signals',
    { params }
  )
  return response.data
}

export async function getSignal(id: string) {
  const response = await apiClient.get<TradingSignal>(`/api/v1/trading/signals/${id}`)
  return response.data
}

export async function ackSignal(id: string, user?: string) {
  const response = await apiClient.post(`/api/v1/trading/signals/${id}/ack`, { user })
  return response.data
}

export async function getValuation(traceId: string) {
  const response = await apiClient.get<Valuation>(`/api/v1/trading/valuations/${traceId}`)
  return response.data
}

export async function simulate(req: SimulateRequest) {
  const response = await apiClient.post<{ results: ValuationResult[] }>(
    '/api/v1/trading/simulate',
    req
  )
  return response.data
}

export async function getTradingStats() {
  const response = await apiClient.get<TradingStats>('/api/v1/trading/stats')
  return response.data
}

export async function getFxRates() {
  const response = await apiClient.get<FxRatesResponse>('/api/v1/trading/fx-rates')
  return response.data
}

// --- Config API ---

export async function getTradingConfigs() {
  const response = await apiClient.get<{ configs: Record<string, TradingPathConfig> }>(
    '/api/v1/trading/configs'
  )
  return response.data
}

export async function getTradingConfig(pathId: string) {
  const response = await apiClient.get<TradingPathConfig>(
    `/api/v1/trading/configs/${pathId}`
  )
  return response.data
}

export async function updateTradingConfig(pathId: string, config: TradingPathConfig) {
  const response = await apiClient.put<{ saved: boolean; config: TradingPathConfig }>(
    `/api/v1/trading/configs/${pathId}`,
    config
  )
  return response.data
}

// --- Cross-platform price discovery ---

export interface PriceDiscoveryRequest {
  brand: string
  reference: string
  model_name?: string
  platforms: string[]
}

export interface DiscoveredItem {
  id: string
  name: string
  price_jpy: number
  price_text: string
  url: string
  image_url: string
  rank?: string
  match_score: number
  match_reasons: string[]
}

export interface PriceDiscoveryResult {
  platform: string
  items: DiscoveredItem[]
  error?: string
}

export async function priceDiscovery(req: PriceDiscoveryRequest) {
  const response = await apiClient.post<{ results: PriceDiscoveryResult[] }>(
    '/api/v1/trading/price-discovery',
    req,
    { timeout: 120000 }
  )
  return response.data
}

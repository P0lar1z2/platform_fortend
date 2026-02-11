import apiClient, { unwrapResponse } from './index'
import type { ApiResponse } from './types'

export interface MatcherHealth {
  status: string
  milvus: string
  embeddingBackend: string
  rerankBackend: string
}

export interface SyncStatus {
  running: boolean
  lastSyncTime: string
  totalSynced: number
  totalFailed: number
  lastError: string
  intervalSeconds: number
  fullSyncRunning: boolean
  fullSyncTotal: number
  fullSyncProgress: number
}

export interface TriggerSyncResult {
  success: boolean
  message: string
}

export interface MatcherStats {
  milvusCount: number
  collectionName: string
  databaseName: string
}

export interface UsageAggregate {
  requestsTotal: number
  requestsSuccess: number
  requestsFailed: number
  inputTokensTotal: number
  outputTokensTotal: number
  tokensTotal: number
  costUsdTotal: number
  avgTokensPerRequest: number
  avgCostUsdPerRequest: number
}

export interface UsageDailyItem {
  date: string
  totals: UsageAggregate
}

export interface UsageByModelItem {
  api: string
  model: string
  totals: UsageAggregate
}

export interface MatcherUsage {
  windowDays: number
  currency: string
  totals: UsageAggregate
  daily: UsageDailyItem[]
  byModel: UsageByModelItem[]
}

export interface MatcherSearchResult {
  id: number
  score: number
  brand: string
  modelName: string
  reference: string
  url: string
}

export interface MatcherSearchResponse {
  results: MatcherSearchResult[]
  reranked: boolean
  total: number
}

export async function getMatcherHealth(): Promise<MatcherHealth> {
  const response = await apiClient.get<ApiResponse<any>>('/api/v1/matcher/health')
  const data = unwrapResponse(response)
  return {
    status: data.status,
    milvus: data.milvus,
    embeddingBackend: data.embedding_backend,
    rerankBackend: data.rerank_backend,
  }
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const response = await apiClient.get<ApiResponse<any>>('/api/v1/matcher/sync/status')
  const data = unwrapResponse(response)
  return {
    running: data.running,
    lastSyncTime: data.last_sync_time,
    totalSynced: data.total_synced,
    totalFailed: data.total_failed,
    lastError: data.last_error,
    intervalSeconds: data.interval_seconds,
    fullSyncRunning: data.full_sync_running,
    fullSyncTotal: data.full_sync_total,
    fullSyncProgress: data.full_sync_progress,
  }
}

export async function triggerSync(full: boolean = false): Promise<TriggerSyncResult> {
  const response = await apiClient.post<ApiResponse<any>>('/api/v1/matcher/sync/trigger', { full })
  const data = unwrapResponse(response)
  return {
    success: data.success,
    message: data.message,
  }
}

export async function matcherSearch(
  query: string,
  topK: number = 10,
  rerank: boolean = false,
  rerankTopN: number = 10
): Promise<MatcherSearchResponse> {
  const response = await apiClient.post<ApiResponse<any>>('/api/v1/matcher/search', {
    query,
    top_k: topK,
    rerank,
    rerank_top_n: rerankTopN,
  })
  const data = unwrapResponse(response)
  return {
    results: (data.results || []).map((r: any) => ({
      id: r.id,
      score: r.score,
      brand: r.brand,
      modelName: r.model_name,
      reference: r.reference,
      url: r.url,
    })),
    reranked: data.reranked,
    total: data.total,
  }
}

export async function getMatcherStats(): Promise<MatcherStats> {
  const response = await apiClient.get<ApiResponse<any>>('/api/v1/matcher/stats')
  const data = unwrapResponse(response)
  return {
    milvusCount: data.milvus_count,
    collectionName: data.collection_name,
    databaseName: data.database_name,
  }
}

function mapUsageAggregate(raw: any): UsageAggregate {
  return {
    requestsTotal: raw?.requests_total ?? 0,
    requestsSuccess: raw?.requests_success ?? 0,
    requestsFailed: raw?.requests_failed ?? 0,
    inputTokensTotal: raw?.input_tokens_total ?? 0,
    outputTokensTotal: raw?.output_tokens_total ?? 0,
    tokensTotal: raw?.tokens_total ?? 0,
    costUsdTotal: raw?.cost_usd_total ?? 0,
    avgTokensPerRequest: raw?.avg_tokens_per_request ?? 0,
    avgCostUsdPerRequest: raw?.avg_cost_usd_per_request ?? 0,
  }
}

export async function getMatcherUsage(days: number = 30): Promise<MatcherUsage> {
  const response = await apiClient.get<ApiResponse<any>>('/api/v1/matcher/usage', {
    params: { days },
  })
  const data = unwrapResponse(response)
  return {
    windowDays: data.window_days ?? 30,
    currency: data.currency ?? 'USD',
    totals: mapUsageAggregate(data.totals),
    daily: (data.daily || []).map((item: any) => ({
      date: item.date,
      totals: mapUsageAggregate(item.totals),
    })),
    byModel: (data.by_model || []).map((item: any) => ({
      api: item.api,
      model: item.model,
      totals: mapUsageAggregate(item.totals),
    })),
  }
}

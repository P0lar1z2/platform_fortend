import apiClient, { unwrapResponse } from './index'
import type { ApiResponse } from './types'

export interface CorvusMatchRequest {
  source: string
  brand?: string
  modelNumber?: string
  dialColor?: string
  caseMaterial?: string
  dialIndex?: string
}

export interface CorvusMatchResponse {
  matched: boolean
  categoryId?: string
  matchType?: string
  confidence?: number
  message?: string
}

export async function getCorvusHealth(): Promise<any> {
  const response = await apiClient.get<ApiResponse<any>>('/api/v1/corvus/health')
  return unwrapResponse(response)
}

export async function corvusMatch(params: CorvusMatchRequest): Promise<CorvusMatchResponse> {
  const response = await apiClient.post<ApiResponse<any>>('/api/v1/corvus/match', {
    source: params.source,
    brand: params.brand,
    model_number: params.modelNumber,
    dial_color: params.dialColor,
    case_material: params.caseMaterial,
    dial_index: params.dialIndex,
  })
  const data = unwrapResponse(response)
  return {
    matched: data.matched,
    categoryId: data.category_id,
    matchType: data.match_type,
    confidence: data.confidence,
    message: data.message,
  }
}

export async function queryByRef(ref: string): Promise<any> {
  const response = await apiClient.get<ApiResponse<any>>('/api/v1/corvus/ref', {
    params: { ref },
  })
  return unwrapResponse(response)
}

export async function queryById(id: string): Promise<any> {
  const response = await apiClient.get<ApiResponse<any>>('/api/v1/corvus/id', {
    params: { id },
  })
  return unwrapResponse(response)
}

// --- Enriched Transactions (Corvus + MongoDB price) ---

export interface EnrichedTransaction {
  id: string
  item_id?: string
  source?: string
  brand?: string
  model_number?: string
  case_material?: string
  dial_color?: string
  match_type?: string
  confidence?: number
  successful_bid_price?: number
  auction_date?: string
  condition_rank?: string
  has_box?: boolean
  has_warranty_card?: boolean
}

export interface PriceSummary {
  avg_price?: number
  min_price?: number
  max_price?: number
  with_price_count: number
  total_count: number
}

export interface EnrichedTransactionsResponse {
  catalog_id: string
  transactions: EnrichedTransaction[]
  count: number
  price_summary: PriceSummary
}

export async function getTransactions(catalogId: string): Promise<EnrichedTransactionsResponse> {
  const response = await apiClient.get<ApiResponse<EnrichedTransactionsResponse>>(
    '/api/v1/corvus/transactions',
    { params: { catalog_id: catalogId } }
  )
  return unwrapResponse(response)
}

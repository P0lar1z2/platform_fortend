import apiClient, { unwrapResponse } from './index'
import type { ApiResponse } from './types'

export interface CorvusMatchRequest {
  source: string
  brand?: string
  modelNumber?: string
  dialColor?: string
  caseMaterial?: string
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

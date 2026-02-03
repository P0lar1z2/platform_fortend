import apiClient, { unwrapResponse } from './index'
import type { ApiResponse, SearchQuery } from './types'
import type { UnifiedWatch } from '@/types'

export async function searchWatches(query: SearchQuery): Promise<UnifiedWatch[]> {
  const response = await apiClient.get<ApiResponse<UnifiedWatch[]>>('/api/watches', {
    params: query,
  })
  return unwrapResponse(response)
}

export async function getWatch(traceId: string): Promise<UnifiedWatch> {
  const response = await apiClient.get<ApiResponse<UnifiedWatch>>(`/api/watches/${traceId}`)
  return unwrapResponse(response)
}

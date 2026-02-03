import apiClient, { unwrapResponse } from './index'
import type { ApiResponse, ReferenceQuery } from './types'
import type { ReferenceWatch } from '@/types'

export async function searchReferences(query: ReferenceQuery): Promise<ReferenceWatch[]> {
  const response = await apiClient.get<ApiResponse<ReferenceWatch[]>>('/api/references', {
    params: query,
  })
  return unwrapResponse(response)
}

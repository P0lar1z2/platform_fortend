import apiClient, { unwrapResponse } from './index'
import type { ApiResponse, VerifyRequest } from './types'
import type { MatchResult } from '@/types'

export async function getMatchResults(traceId: string): Promise<MatchResult[]> {
  const response = await apiClient.get<ApiResponse<MatchResult[]>>(`/api/matches/${traceId}`)
  return unwrapResponse(response)
}

export async function verifyMatch(
  traceId: string,
  request: VerifyRequest
): Promise<{ verified: boolean }> {
  const response = await apiClient.post<ApiResponse<{ verified: boolean }>>(
    `/api/matches/${traceId}/verify`,
    request
  )
  return unwrapResponse(response)
}

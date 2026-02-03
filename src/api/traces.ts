import apiClient, { unwrapResponse } from './index'
import type { ApiResponse, ReplayRequest } from './types'
import type { Trace, StageSnapshot } from '@/types'

export async function getTrace(traceId: string): Promise<Trace> {
  const response = await apiClient.get<ApiResponse<Trace>>(`/api/traces/${traceId}`)
  return unwrapResponse(response)
}

export async function getTraceSnapshots(traceId: string): Promise<StageSnapshot[]> {
  const response = await apiClient.get<ApiResponse<StageSnapshot[]>>(
    `/api/traces/${traceId}/snapshots`
  )
  return unwrapResponse(response)
}

export async function replayTrace(traceId: string, request: ReplayRequest): Promise<Trace> {
  const response = await apiClient.post<ApiResponse<Trace>>(
    `/api/traces/${traceId}/replay`,
    request
  )
  return unwrapResponse(response)
}

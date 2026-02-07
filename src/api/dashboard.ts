import apiClient, { unwrapResponse } from './index'
import type { ApiResponse } from './types'
import type { DashboardStats } from '@/types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<ApiResponse<DashboardStats>>('/api/v1/stats/dashboard')
  return unwrapResponse(response)
}

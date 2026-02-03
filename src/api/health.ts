import apiClient from './index'

export interface HealthStatus {
  status: string
  service: string
}

export async function checkHealth(): Promise<HealthStatus> {
  const response = await apiClient.get<HealthStatus>('/health')
  return response.data
}

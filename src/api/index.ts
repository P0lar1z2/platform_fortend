import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import type { ApiResponse } from './types'

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export function unwrapResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
  if (!response.data.success || response.data.data === null) {
    throw new Error(response.data.error || 'Unknown error')
  }
  return response.data.data
}

export default apiClient
export type { ApiResponse }

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

export interface SearchQuery {
  brand?: string
  keywords?: string
  limit?: number
}

export interface ReferenceQuery {
  brand?: string
  query?: string
  limit?: number
}

export interface VerifyRequest {
  algorithm: string
  reference_id: string
  verified_by: string
}

export interface ReplayRequest {
  from_stage: string
}

import apiClient, { unwrapResponse } from './index'
import type { ApiResponse } from './types'

export interface CollectionInfo {
  name: string
  count: number
}

export interface DocumentsResponse {
  documents: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * List all collections with their document counts
 */
export async function listCollections(): Promise<CollectionInfo[]> {
  const response = await apiClient.get<ApiResponse<CollectionInfo[]>>(
    '/api/v1/admin/collections'
  )
  return unwrapResponse(response)
}

/**
 * Browse collection documents with pagination
 */
export async function browseCollection(
  name: string,
  page: number = 1,
  pageSize: number = 20
): Promise<DocumentsResponse> {
  const response = await apiClient.get<ApiResponse<DocumentsResponse>>(
    `/api/v1/admin/collections/${encodeURIComponent(name)}`,
    {
      params: {
        page,
        page_size: pageSize,
      },
    }
  )
  const result = unwrapResponse(response)
  // Convert snake_case to camelCase
  return {
    documents: result.documents,
    total: result.total,
    page: result.page,
    pageSize: (result as any).page_size || result.pageSize,
    hasMore: (result as any).has_more ?? result.hasMore,
  }
}

/**
 * Get a single document by ID
 */
export async function getDocument(
  collectionName: string,
  documentId: string
): Promise<Record<string, unknown>> {
  const response = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    `/api/v1/admin/collections/${encodeURIComponent(collectionName)}/${encodeURIComponent(documentId)}`
  )
  return unwrapResponse(response)
}

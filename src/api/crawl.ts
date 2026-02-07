import apiClient, { unwrapResponse } from './index'
import type { ApiResponse } from './types'
import type { Platform, SearchResult, CrawlItemDetail } from '@/types/crawl'

/**
 * List all available platforms with their health status
 */
export async function listPlatforms(): Promise<Platform[]> {
  const response = await apiClient.get<ApiResponse<Platform[]>>('/api/crawl/platforms')
  const platforms = unwrapResponse(response)
  // Convert snake_case to camelCase
  return platforms.map((p: any) => ({
    name: p.name,
    displayName: p.display_name,
    requiresAuth: p.requires_auth,
    isAvailable: p.is_available,
  }))
}

/**
 * Search for items on a specific platform
 */
export async function searchItems(
  platform: string,
  keyword: string,
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResult> {
  const response = await apiClient.get<ApiResponse<SearchResult>>('/api/crawl/search', {
    params: {
      platform,
      keyword,
      page,
      page_size: pageSize,
    },
    timeout: 120000, // 2 minutes for crawl requests
  })
  const result = unwrapResponse(response)
  // Convert snake_case to camelCase
  return {
    items: result.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      priceJpy: item.price_jpy,
      url: item.url,
      imageUrl: item.image_url,
      rank: item.rank,
      extra: item.extra,
    })),
    pagination: {
      currentPage: result.pagination.current_page,
      totalPages: result.pagination.total_pages,
      totalItems: result.pagination.total_items,
      hasMore: result.pagination.has_more,
    },
  }
}

/**
 * Get detailed information about a specific item
 */
export async function getItemDetail(
  platform: string,
  itemId: string
): Promise<CrawlItemDetail> {
  const response = await apiClient.get<ApiResponse<CrawlItemDetail>>('/api/crawl/detail', {
    params: {
      platform,
      item_id: itemId,
    },
    timeout: 120000, // 2 minutes for crawl requests
  })
  return unwrapResponse(response)
}

export interface SubmitItem {
  platform: string
  itemId: string
}

export interface SubmitResponse {
  submitted: number
  traceIds: string[]
}

/**
 * Submit selected items to the pipeline for processing
 */
export async function submitItems(
  items: SubmitItem[]
): Promise<SubmitResponse> {
  const response = await apiClient.post<ApiResponse<SubmitResponse>>('/api/crawl/submit', {
    items: items.map((item) => ({
      platform: item.platform,
      item_id: item.itemId,
    })),
  })
  const result = unwrapResponse(response)
  // Convert snake_case to camelCase
  return {
    submitted: result.submitted,
    traceIds: (result as any).trace_ids || [],
  }
}

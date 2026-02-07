import apiClient, { unwrapResponse } from './index'
import type { ApiResponse } from './types'

export interface WatchBaseBrand {
  slug: string
  name: string
  modelCount?: number
}

export interface ScrapeStatus {
  isRunning: boolean
  brandSlug: string | null
  progress: number | null
  total: number | null
  startedAt: string | null
  completedAt: string | null
  error: string | null
  // Multi-brand sync progress
  totalBrands: number | null
  processedBrands: number | null
}

export interface StartScrapeResponse {
  success: boolean
  message: string
}

export interface StartScrapeAllResponse {
  message: string
  total_brands: number
}

// Cache for brands (5 minutes TTL)
let brandsCache: { data: WatchBaseBrand[]; expires: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get list of available WatchBase brands (cached)
 */
export async function getWatchBaseBrands(): Promise<WatchBaseBrand[]> {
  // Return cached data if valid
  if (brandsCache && Date.now() < brandsCache.expires) {
    return brandsCache.data
  }

  const response = await apiClient.get<ApiResponse<WatchBaseBrand[]>>(
    '/api/v1/admin/watchbase/brands'
  )
  const brands = unwrapResponse(response)
  // Convert snake_case to camelCase if needed
  const result = brands.map((b: any) => ({
    slug: b.slug,
    name: b.name,
    modelCount: b.model_count ?? b.modelCount,
  }))

  // Cache the result
  brandsCache = { data: result, expires: Date.now() + CACHE_TTL }
  return result
}

/**
 * Start scraping a WatchBase brand
 */
export async function startScrape(brandSlug: string): Promise<StartScrapeResponse> {
  const response = await apiClient.post<ApiResponse<StartScrapeResponse>>(
    '/api/v1/admin/crawl/watchbase',
    { brand_slug: brandSlug },
    { timeout: 60000 }
  )
  return unwrapResponse(response)
}

/**
 * Start scraping all WatchBase brands
 */
export async function startScrapeAll(): Promise<StartScrapeAllResponse> {
  const response = await apiClient.post<ApiResponse<StartScrapeAllResponse>>(
    '/api/v1/admin/crawl/watchbase/all',
    {},
    { timeout: 60000 }
  )
  return unwrapResponse(response)
}

/**
 * Get current WatchBase scrape status
 */
export async function getScrapeStatus(): Promise<ScrapeStatus> {
  const response = await apiClient.get<ApiResponse<ScrapeStatus>>(
    '/api/v1/admin/crawl/watchbase/status'
  )
  const s = unwrapResponse(response) as any
  // Convert backend format to frontend format
  const isRunning = s.status === 'running'
  return {
    isRunning,
    brandSlug: s.brand || null,
    progress: s.processed_watches ?? s.processedWatches ?? null,
    total: s.total_watches ?? s.totalWatches ?? null,
    startedAt: s.started_at ?? s.startedAt ?? null,
    completedAt: s.completed_at ?? s.completedAt ?? null,
    error: s.error ?? null,
    totalBrands: s.total_brands ?? s.totalBrands ?? null,
    processedBrands: s.processed_brands ?? s.processedBrands ?? null,
  }
}

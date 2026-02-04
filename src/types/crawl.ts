export interface Platform {
  name: string
  displayName: string
  requiresAuth: boolean
  isAvailable: boolean
}

export interface CrawlItem {
  id: string
  name: string
  price: string
  priceJpy: number
  url: string
  imageUrl: string
  rank?: string
  extra: Record<string, string>
}

export interface CrawlItemDetail {
  id: string
  name: string
  url: string
  images: string[]
  fields: Record<string, string>
  description?: string
}

export interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  hasMore: boolean
}

export interface SearchResult {
  items: CrawlItem[]
  pagination: Pagination
}

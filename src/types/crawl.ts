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

// Crawl Status types

export interface TaskInfo {
  action: string
  item_id: string | null
  started_at: string
}

export interface WorkerStatus {
  worker_index: number
  state: 'idle' | 'busy'
  current_task: TaskInfo | null
  proxy_url: string | null
  tasks_completed: number
  tasks_failed: number
  last_active_at: string | null
}

export interface SourceStatus {
  concurrency: number
  proxy_mode: string
  active_workers: number
  workers: WorkerStatus[]
  pending_tasks: number
  session_count: number
  logged_in: boolean
  is_available: boolean
}

export interface CrawlServiceStatus {
  uptime_seconds: number
  started_at: string
  sources: Record<string, SourceStatus>
}

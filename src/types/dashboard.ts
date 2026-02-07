export interface TraceStats {
  pending: number
  processing: number
  completed: number
  failed: number
}

export interface MatchStats {
  total: number
  verified: number
  unverified: number
}

export interface SourceCount {
  source: string
  count: number
}

export interface BrandCount {
  brand: string
  count: number
}

export interface DashboardStats {
  traces: TraceStats
  watches_total: number
  references_total: number
  matches: MatchStats
  source_distribution: SourceCount[]
  top_brands: BrandCount[]
}

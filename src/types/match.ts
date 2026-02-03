export interface MatchCandidate {
  reference_id: string
  brand: string
  model: string
  reference: string
  confidence: number
  match_reasons: string[]
}

export interface MatchResult {
  _id?: string
  trace_id: string
  source_item_id: string
  algorithm: string
  algorithm_version: string
  candidates: MatchCandidate[]
  best_match: MatchCandidate | null
  confidence: number
  human_verified: boolean
  verified_reference_id: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
}

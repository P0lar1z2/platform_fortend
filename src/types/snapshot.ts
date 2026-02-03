export type SnapshotStatus = 'success' | 'failed' | 'skipped'

export interface StageSnapshot {
  _id?: string
  trace_id: string
  stage: string
  algorithm_version: string
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  status: SnapshotStatus
  error_message: string | null
}

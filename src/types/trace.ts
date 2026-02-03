export type TraceStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export type PipelineStage = 'crawl' | 'enrich' | 'clean' | 'match' | 'decide'

export const PIPELINE_STAGES: PipelineStage[] = ['crawl', 'enrich', 'clean', 'match', 'decide']

export interface Trace {
  _id?: string
  trace_id: string
  source: string
  source_item_id: string
  source_url: string | null
  current_stage: PipelineStage
  status: TraceStatus
  retry_count: number
  max_retries: number
  error_message: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export function getStageIndex(stage: PipelineStage): number {
  return PIPELINE_STAGES.indexOf(stage)
}

export function getNextStage(stage: PipelineStage): PipelineStage | null {
  const index = getStageIndex(stage)
  if (index < PIPELINE_STAGES.length - 1) {
    return PIPELINE_STAGES[index + 1]
  }
  return null
}

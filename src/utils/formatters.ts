import type { TraceStatus, SnapshotStatus, PipelineStage } from '@/types'

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString()
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString()
}

export function formatPrice(amount: number | null, currency: string | null): string {
  if (amount === null) return '-'
  const curr = currency || 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr,
  }).format(amount)
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${(ms / 60000).toFixed(2)}m`
}

export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`
}

export function getStatusType(status: TraceStatus): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

export function getSnapshotStatusType(status: SnapshotStatus): 'success' | 'danger' | 'warning' {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'skipped':
      return 'warning'
  }
}

export function getStageLabel(stage: PipelineStage): string {
  const labels: Record<PipelineStage, string> = {
    crawl: 'Crawl',
    enrich: 'Enrich',
    clean: 'Clean',
    match: 'Match',
    decide: 'Decide',
  }
  return labels[stage] || stage
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

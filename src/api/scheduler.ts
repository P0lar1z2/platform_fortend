import apiClient, { unwrapResponse } from './index'
import type { ApiResponse } from './types'

export interface JobConfig {
  brandSlug?: string
  platform?: string
  keyword?: string
}

export interface ScheduledJob {
  id: string
  name: string
  jobType: string
  cron: string
  config: JobConfig
  enabled: boolean
  runOnce: boolean
  lastRun?: string
  nextRun?: string
  lastError?: string
  createdAt: string
  updatedAt: string
}

export interface JobExecution {
  executionId: string
  jobId: string
  startedAt: string
  completedAt?: string
  status: string
  error?: string
  result?: string
}

export interface CreateJobRequest {
  name: string
  job_type: string
  cron: string
  config?: {
    brand_slug?: string
    platform?: string
    keyword?: string
  }
  enabled?: boolean
  run_once?: boolean
}

export interface UpdateJobRequest {
  name?: string
  cron?: string
  config?: {
    brand_slug?: string
    platform?: string
    keyword?: string
  }
  enabled?: boolean
  run_once?: boolean
}

/**
 * List all scheduled jobs
 */
export async function listJobs(): Promise<ScheduledJob[]> {
  const response = await apiClient.get<ApiResponse<ScheduledJob[]>>(
    '/api/v1/admin/scheduler/jobs'
  )
  const jobs = unwrapResponse(response)
  // Convert snake_case to camelCase
  return jobs.map((j: any) => ({
    id: j.id,
    name: j.name,
    jobType: j.job_type ?? j.jobType,
    cron: j.cron,
    config: {
      brandSlug: j.config?.brand_slug ?? j.config?.brandSlug,
      platform: j.config?.platform,
      keyword: j.config?.keyword,
    },
    enabled: j.enabled,
    runOnce: j.run_once ?? j.runOnce ?? false,
    lastRun: j.last_run ?? j.lastRun,
    nextRun: j.next_run ?? j.nextRun,
    lastError: j.last_error ?? j.lastError,
    createdAt: j.created_at ?? j.createdAt,
    updatedAt: j.updated_at ?? j.updatedAt,
  }))
}

/**
 * Get a single job by ID
 */
export async function getJob(jobId: string): Promise<ScheduledJob> {
  const response = await apiClient.get<ApiResponse<ScheduledJob>>(
    `/api/v1/admin/scheduler/jobs/${jobId}`
  )
  const j = unwrapResponse(response) as any
  return {
    id: j.id,
    name: j.name,
    jobType: j.job_type ?? j.jobType,
    cron: j.cron,
    config: {
      brandSlug: j.config?.brand_slug ?? j.config?.brandSlug,
      platform: j.config?.platform,
      keyword: j.config?.keyword,
    },
    enabled: j.enabled,
    runOnce: j.run_once ?? j.runOnce ?? false,
    lastRun: j.last_run ?? j.lastRun,
    nextRun: j.next_run ?? j.nextRun,
    lastError: j.last_error ?? j.lastError,
    createdAt: j.created_at ?? j.createdAt,
    updatedAt: j.updated_at ?? j.updatedAt,
  }
}

/**
 * Create a new scheduled job
 */
export async function createJob(job: CreateJobRequest): Promise<ScheduledJob> {
  const response = await apiClient.post<ApiResponse<ScheduledJob>>(
    '/api/v1/admin/scheduler/jobs',
    job
  )
  const j = unwrapResponse(response) as any
  return {
    id: j.id,
    name: j.name,
    jobType: j.job_type ?? j.jobType,
    cron: j.cron,
    config: {
      brandSlug: j.config?.brand_slug ?? j.config?.brandSlug,
      platform: j.config?.platform,
      keyword: j.config?.keyword,
    },
    enabled: j.enabled,
    runOnce: j.run_once ?? j.runOnce ?? false,
    lastRun: j.last_run ?? j.lastRun,
    nextRun: j.next_run ?? j.nextRun,
    lastError: j.last_error ?? j.lastError,
    createdAt: j.created_at ?? j.createdAt,
    updatedAt: j.updated_at ?? j.updatedAt,
  }
}

/**
 * Update an existing job
 */
export async function updateJob(
  jobId: string,
  update: UpdateJobRequest
): Promise<ScheduledJob> {
  const response = await apiClient.put<ApiResponse<ScheduledJob>>(
    `/api/v1/admin/scheduler/jobs/${jobId}`,
    update
  )
  const j = unwrapResponse(response) as any
  return {
    id: j.id,
    name: j.name,
    jobType: j.job_type ?? j.jobType,
    cron: j.cron,
    config: {
      brandSlug: j.config?.brand_slug ?? j.config?.brandSlug,
      platform: j.config?.platform,
      keyword: j.config?.keyword,
    },
    enabled: j.enabled,
    runOnce: j.run_once ?? j.runOnce ?? false,
    lastRun: j.last_run ?? j.lastRun,
    nextRun: j.next_run ?? j.nextRun,
    lastError: j.last_error ?? j.lastError,
    createdAt: j.created_at ?? j.createdAt,
    updatedAt: j.updated_at ?? j.updatedAt,
  }
}

/**
 * Delete a job
 */
export async function deleteJob(jobId: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/scheduler/jobs/${jobId}`)
}

/**
 * Run a job immediately
 */
export async function runJob(jobId: string): Promise<JobExecution> {
  const response = await apiClient.post<ApiResponse<JobExecution>>(
    `/api/v1/admin/scheduler/jobs/${jobId}/run`
  )
  const e = unwrapResponse(response) as any
  return {
    executionId: e.execution_id ?? e.executionId,
    jobId: e.job_id ?? e.jobId,
    startedAt: e.started_at ?? e.startedAt,
    completedAt: e.completed_at ?? e.completedAt,
    status: e.status,
    error: e.error,
    result: e.result,
  }
}

/**
 * Get job execution history
 */
export async function getJobHistory(
  jobId: string,
  limit: number = 20
): Promise<JobExecution[]> {
  const response = await apiClient.get<ApiResponse<JobExecution[]>>(
    `/api/v1/admin/scheduler/jobs/${jobId}/history`,
    { params: { limit } }
  )
  const executions = unwrapResponse(response)
  return executions.map((e: any) => ({
    executionId: e.execution_id ?? e.executionId,
    jobId: e.job_id ?? e.jobId,
    startedAt: e.started_at ?? e.startedAt,
    completedAt: e.completed_at ?? e.completedAt,
    status: e.status,
    error: e.error,
    result: e.result,
  }))
}

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Trace, StageSnapshot } from '@/types'
import { getTrace, getTraceSnapshots, replayTrace } from '@/api/traces'
import type { ReplayRequest } from '@/api/types'

export const useTracesStore = defineStore('traces', () => {
  const currentTrace = ref<Trace | null>(null)
  const snapshots = ref<StageSnapshot[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTrace(traceId: string) {
    loading.value = true
    error.value = null
    try {
      currentTrace.value = await getTrace(traceId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch trace'
      currentTrace.value = null
    } finally {
      loading.value = false
    }
  }

  async function fetchSnapshots(traceId: string) {
    loading.value = true
    error.value = null
    try {
      snapshots.value = await getTraceSnapshots(traceId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch snapshots'
      snapshots.value = []
    } finally {
      loading.value = false
    }
  }

  async function replay(traceId: string, request: ReplayRequest): Promise<Trace | null> {
    loading.value = true
    error.value = null
    try {
      const newTrace = await replayTrace(traceId, request)
      return newTrace
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to replay trace'
      return null
    } finally {
      loading.value = false
    }
  }

  function clearCurrent() {
    currentTrace.value = null
    snapshots.value = []
  }

  function clearError() {
    error.value = null
  }

  return {
    currentTrace,
    snapshots,
    loading,
    error,
    fetchTrace,
    fetchSnapshots,
    replay,
    clearCurrent,
    clearError,
  }
})

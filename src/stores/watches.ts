import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UnifiedWatch } from '@/types'
import { searchWatches, getWatch } from '@/api/watches'
import type { SearchQuery } from '@/api/types'

export const useWatchesStore = defineStore('watches', () => {
  const watches = ref<UnifiedWatch[]>([])
  const currentWatch = ref<UnifiedWatch | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function search(query: SearchQuery) {
    loading.value = true
    error.value = null
    try {
      watches.value = await searchWatches(query)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to search watches'
      watches.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchWatch(traceId: string) {
    loading.value = true
    error.value = null
    try {
      currentWatch.value = await getWatch(traceId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch watch'
      currentWatch.value = null
    } finally {
      loading.value = false
    }
  }

  function clearCurrent() {
    currentWatch.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    watches,
    currentWatch,
    loading,
    error,
    search,
    fetchWatch,
    clearCurrent,
    clearError,
  }
})

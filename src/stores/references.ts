import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ReferenceWatch } from '@/types'
import { searchReferences } from '@/api/references'
import type { ReferenceQuery } from '@/api/types'

export const useReferencesStore = defineStore('references', () => {
  const references = ref<ReferenceWatch[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function search(query: ReferenceQuery) {
    loading.value = true
    error.value = null
    try {
      references.value = await searchReferences(query)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to search references'
      references.value = []
    } finally {
      loading.value = false
    }
  }

  function clearReferences() {
    references.value = []
  }

  function clearError() {
    error.value = null
  }

  return {
    references,
    loading,
    error,
    search,
    clearReferences,
    clearError,
  }
})

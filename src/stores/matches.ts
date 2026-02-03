import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MatchResult } from '@/types'
import { getMatchResults, verifyMatch } from '@/api/matches'
import type { VerifyRequest } from '@/api/types'

export const useMatchesStore = defineStore('matches', () => {
  const matchResults = ref<MatchResult[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const unverifiedMatches = computed(() =>
    matchResults.value.filter((m) => !m.human_verified)
  )

  const verifiedMatches = computed(() =>
    matchResults.value.filter((m) => m.human_verified)
  )

  async function fetchMatches(traceId: string) {
    loading.value = true
    error.value = null
    try {
      matchResults.value = await getMatchResults(traceId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch match results'
      matchResults.value = []
    } finally {
      loading.value = false
    }
  }

  async function verify(traceId: string, request: VerifyRequest): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const result = await verifyMatch(traceId, request)
      if (result.verified) {
        // Update local state
        const match = matchResults.value.find(
          (m) => m.algorithm === request.algorithm
        )
        if (match) {
          match.human_verified = true
          match.verified_reference_id = request.reference_id
          match.verified_by = request.verified_by
          match.verified_at = new Date().toISOString()
        }
      }
      return result.verified
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to verify match'
      return false
    } finally {
      loading.value = false
    }
  }

  function clearMatches() {
    matchResults.value = []
  }

  function clearError() {
    error.value = null
  }

  return {
    matchResults,
    loading,
    error,
    unverifiedMatches,
    verifiedMatches,
    fetchMatches,
    verify,
    clearMatches,
    clearError,
  }
})

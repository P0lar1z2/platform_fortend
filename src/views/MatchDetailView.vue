<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useMatchesStore, useWatchesStore } from '@/stores'
import type { MatchCandidate, MatchResult } from '@/types'
import { formatConfidence, formatDate } from '@/utils/formatters'
import MatchCandidateList from '@/components/matches/MatchCandidateList.vue'
import VerificationForm from '@/components/matches/VerificationForm.vue'

const route = useRoute()
const router = useRouter()
const matchesStore = useMatchesStore()
const watchesStore = useWatchesStore()

const traceId = route.params.traceId as string
const selectedCandidate = ref<MatchCandidate | null>(null)
const activeMatchResult = ref<MatchResult | null>(null)

const watchInfo = computed(() => watchesStore.currentWatch)

onMounted(async () => {
  await Promise.all([
    matchesStore.fetchMatches(traceId),
    watchesStore.fetchWatch(traceId),
  ])
})

watch(
  () => route.params.traceId,
  async (newId) => {
    if (newId) {
      await Promise.all([
        matchesStore.fetchMatches(newId as string),
        watchesStore.fetchWatch(newId as string),
      ])
    }
  }
)

function selectCandidate(matchResult: MatchResult, candidate: MatchCandidate) {
  activeMatchResult.value = matchResult
  selectedCandidate.value = candidate
}

async function handleVerify(data: { algorithm: string; reference_id: string; verified_by: string }) {
  const success = await matchesStore.verify(traceId, data)
  if (success) {
    ElMessage.success('Match verified successfully')
    selectedCandidate.value = null
    activeMatchResult.value = null
    // Refresh data
    await matchesStore.fetchMatches(traceId)
  }
}

function handleCancelVerify() {
  selectedCandidate.value = null
  activeMatchResult.value = null
}

function goToWatch() {
  router.push(`/watches/${traceId}`)
}

function goToTrace() {
  router.push(`/traces/${traceId}`)
}
</script>

<template>
  <div class="match-detail-view">
    <el-page-header @back="$router.push('/matches')">
      <template #content>
        <span class="page-title">Match Details</span>
      </template>
      <template #extra>
        <el-space>
          <el-button @click="goToWatch">
            <el-icon><Goods /></el-icon>
            View Watch
          </el-button>
          <el-button @click="goToTrace">
            <el-icon><List /></el-icon>
            View Trace
          </el-button>
        </el-space>
      </template>
    </el-page-header>

    <div class="content">
      <el-alert
        v-if="matchesStore.error"
        :title="matchesStore.error"
        type="error"
        show-icon
        closable
        class="error-alert"
        @close="matchesStore.clearError"
      />

      <!-- Watch Summary -->
      <el-card v-if="watchInfo" class="summary-card">
        <template #header>
          <span>Watch Summary</span>
        </template>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="Brand">
            <el-tag v-if="watchInfo.brand" type="primary">{{ watchInfo.brand }}</el-tag>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="Model">
            {{ watchInfo.model_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="Reference">
            <code v-if="watchInfo.reference_number">{{ watchInfo.reference_number }}</code>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="Source">
            <el-tag type="info">{{ watchInfo.source }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <div v-loading="matchesStore.loading">
        <!-- No Match Results -->
        <el-empty
          v-if="!matchesStore.loading && matchesStore.matchResults.length === 0"
          description="No match results found for this watch"
        />

        <!-- Match Results -->
        <template v-else>
          <el-card
            v-for="result in matchesStore.matchResults"
            :key="result.algorithm"
            class="result-card"
          >
            <template #header>
              <div class="result-header">
                <div class="result-info">
                  <span class="algorithm-name">{{ result.algorithm }}</span>
                  <el-tag type="info" size="small">v{{ result.algorithm_version }}</el-tag>
                  <el-tag
                    v-if="result.human_verified"
                    type="success"
                    effect="dark"
                    size="small"
                  >
                    Verified
                  </el-tag>
                </div>
                <div class="result-meta">
                  <span>Best: {{ formatConfidence(result.confidence) }}</span>
                  <span>{{ result.candidates.length }} candidates</span>
                </div>
              </div>
            </template>

            <!-- Best Match -->
            <div v-if="result.best_match" class="best-match">
              <h4>Best Match</h4>
              <el-descriptions :column="4" border size="small">
                <el-descriptions-item label="Brand">
                  <el-tag type="primary" size="small">{{ result.best_match.brand }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="Model">
                  {{ result.best_match.model }}
                </el-descriptions-item>
                <el-descriptions-item label="Reference">
                  <code>{{ result.best_match.reference }}</code>
                </el-descriptions-item>
                <el-descriptions-item label="Confidence">
                  <el-tag :type="result.best_match.confidence >= 0.8 ? 'success' : 'warning'" effect="plain">
                    {{ formatConfidence(result.best_match.confidence) }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- Verification Info -->
            <div v-if="result.human_verified" class="verification-info">
              <el-alert type="success" :closable="false">
                <template #title>
                  <span>Verified by {{ result.verified_by }} on {{ formatDate(result.verified_at) }}</span>
                </template>
              </el-alert>
            </div>

            <!-- Candidates Table -->
            <div class="candidates-section">
              <h4>All Candidates</h4>
              <MatchCandidateList
                :candidates="result.candidates"
                :verified-reference-id="result.verified_reference_id"
                :selectable="!result.human_verified"
                @select="(candidate) => selectCandidate(result, candidate)"
              />
            </div>
          </el-card>

          <!-- Verification Form -->
          <VerificationForm
            v-if="activeMatchResult && selectedCandidate"
            :match-result="activeMatchResult"
            :selected-candidate="selectedCandidate"
            :loading="matchesStore.loading"
            @verify="handleVerify"
            @cancel="handleCancelVerify"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.match-detail-view {
  .page-title {
    font-weight: 600;
  }

  .content {
    margin-top: 20px;
  }

  .error-alert {
    margin-bottom: 20px;
  }

  .summary-card {
    margin-bottom: 20px;
  }

  .result-card {
    margin-bottom: 20px;
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .result-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .algorithm-name {
    font-weight: 600;
    font-size: 16px;
  }

  .result-meta {
    display: flex;
    gap: 16px;
    color: #909399;
    font-size: 14px;
  }

  .best-match,
  .verification-info,
  .candidates-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 12px;
      color: #606266;
    }
  }

  .text-muted {
    color: #909399;
  }

  code {
    background-color: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }
}
</style>

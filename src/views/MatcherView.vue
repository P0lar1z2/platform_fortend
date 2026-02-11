<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMatcherHealth,
  getSyncStatus,
  triggerSync,
  matcherSearch,
  getMatcherStats,
  getMatcherUsage,
  type MatcherHealth,
  type SyncStatus,
  type MatcherStats,
  type MatcherUsage,
  type MatcherSearchResult,
} from '@/api/matcher'

// State
const health = ref<MatcherHealth | null>(null)
const syncStatus = ref<SyncStatus | null>(null)
const stats = ref<MatcherStats | null>(null)
const usage = ref<MatcherUsage | null>(null)
const healthLoading = ref(false)
const syncLoading = ref(false)
const statsLoading = ref(false)
const usageLoading = ref(false)
const searchLoading = ref(false)
const triggerLoading = ref(false)
const usageDays = ref(30)

// Search form
const searchQuery = ref('')
const searchTopK = ref(10)
const searchRerank = ref(false)
const searchRerankTopN = ref(10)
const searchResults = ref<MatcherSearchResult[]>([])
const searchReranked = ref(false)
const searchTotal = ref(0)

async function loadHealth() {
  healthLoading.value = true
  try {
    health.value = await getMatcherHealth()
  } catch (e: any) {
    health.value = null
  } finally {
    healthLoading.value = false
  }
}

async function loadSyncStatus() {
  syncLoading.value = true
  try {
    syncStatus.value = await getSyncStatus()
  } catch (e: any) {
    syncStatus.value = null
  } finally {
    syncLoading.value = false
  }
}

async function loadStats() {
  statsLoading.value = true
  try {
    stats.value = await getMatcherStats()
  } catch (e: any) {
    stats.value = null
  } finally {
    statsLoading.value = false
  }
}

async function loadUsage() {
  usageLoading.value = true
  try {
    usage.value = await getMatcherUsage(usageDays.value)
  } catch (e: any) {
    usage.value = null
  } finally {
    usageLoading.value = false
  }
}

const fullSyncLoading = ref(false)

async function handleTriggerSync(full: boolean = false) {
  if (full) {
    fullSyncLoading.value = true
  } else {
    triggerLoading.value = true
  }
  try {
    const result = await triggerSync(full)
    if (result.success) {
      ElMessage.success(result.message)
      if (full) {
        // Poll progress for full sync
        startFullSyncPoll()
      } else {
        setTimeout(() => loadSyncStatus(), 2000)
      }
    } else {
      ElMessage.warning(result.message)
    }
  } catch (e: any) {
    ElMessage.error(e.message || 'Trigger sync failed')
  } finally {
    triggerLoading.value = false
    fullSyncLoading.value = false
  }
}

let fullSyncPollTimer: ReturnType<typeof setInterval> | null = null

function startFullSyncPoll() {
  if (fullSyncPollTimer) return
  fullSyncPollTimer = setInterval(async () => {
    await loadSyncStatus()
    if (syncStatus.value && !syncStatus.value.fullSyncRunning) {
      clearInterval(fullSyncPollTimer!)
      fullSyncPollTimer = null
      ElMessage.success('Full sync completed')
      loadStats()
    }
  }, 3000)
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('Please enter a search query')
    return
  }
  searchLoading.value = true
  try {
    const resp = await matcherSearch(
      searchQuery.value,
      searchTopK.value,
      searchRerank.value,
      searchRerankTopN.value
    )
    searchResults.value = resp.results
    searchReranked.value = resp.reranked
    searchTotal.value = resp.total
  } catch (e: any) {
    ElMessage.error(e.message || 'Search failed')
  } finally {
    searchLoading.value = false
  }
}

onMounted(() => {
  loadHealth()
  loadSyncStatus()
  loadStats()
  loadUsage()
})
</script>

<template>
  <div class="matcher-view">
    <h2>Matcher Service</h2>

    <!-- Status Cards -->
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="8">
        <el-card v-loading="healthLoading" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>Health Status</span>
              <el-button text type="primary" @click="loadHealth">Refresh</el-button>
            </div>
          </template>
          <template v-if="health">
            <el-descriptions :column="1" size="small">
              <el-descriptions-item label="Status">
                <el-tag :type="health.status === 'healthy' ? 'success' : 'danger'" size="small">
                  {{ health.status }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Milvus">
                <el-tag :type="health.milvus === 'connected' ? 'success' : 'danger'" size="small">
                  {{ health.milvus }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Embedding">{{ health.embeddingBackend }}</el-descriptions-item>
              <el-descriptions-item label="Rerank">{{ health.rerankBackend }}</el-descriptions-item>
            </el-descriptions>
          </template>
          <el-empty v-else description="Service unavailable" :image-size="60" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card v-loading="syncLoading" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>Sync Status</span>
              <div>
                <el-button
                  text
                  type="primary"
                  :loading="triggerLoading"
                  @click="handleTriggerSync(false)"
                >
                  Sync
                </el-button>
                <el-button
                  text
                  type="warning"
                  :loading="fullSyncLoading"
                  :disabled="syncStatus?.fullSyncRunning"
                  @click="handleTriggerSync(true)"
                >
                  Full Sync
                </el-button>
              </div>
            </div>
          </template>
          <template v-if="syncStatus">
            <el-descriptions :column="1" size="small">
              <el-descriptions-item label="Running">
                <el-tag :type="syncStatus.running ? 'success' : 'info'" size="small">
                  {{ syncStatus.running ? 'Yes' : 'No' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Last Sync">
                {{ syncStatus.lastSyncTime || 'N/A' }}
              </el-descriptions-item>
              <el-descriptions-item label="Total Synced">{{ syncStatus.totalSynced }}</el-descriptions-item>
              <el-descriptions-item label="Total Failed">
                <span :style="{ color: syncStatus.totalFailed > 0 ? 'var(--el-color-danger)' : 'inherit' }">
                  {{ syncStatus.totalFailed }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="Interval">{{ syncStatus.intervalSeconds }}s</el-descriptions-item>
              <el-descriptions-item v-if="syncStatus.fullSyncRunning" label="Full Sync">
                <el-progress
                  :percentage="syncStatus.fullSyncTotal > 0 ? Math.round(syncStatus.fullSyncProgress / syncStatus.fullSyncTotal * 100) : 0"
                  :format="() => `${syncStatus!.fullSyncProgress}/${syncStatus!.fullSyncTotal}`"
                  :stroke-width="14"
                  status="warning"
                />
              </el-descriptions-item>
              <el-descriptions-item v-if="syncStatus.lastError" label="Last Error">
                <el-text type="danger" size="small" truncated>{{ syncStatus.lastError }}</el-text>
              </el-descriptions-item>
            </el-descriptions>
          </template>
          <el-empty v-else description="Service unavailable" :image-size="60" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card v-loading="statsLoading" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>Milvus Stats</span>
              <el-button text type="primary" @click="loadStats">Refresh</el-button>
            </div>
          </template>
          <template v-if="stats">
            <el-descriptions :column="1" size="small">
              <el-descriptions-item label="Vectors">
                <el-statistic :value="stats.milvusCount" />
              </el-descriptions-item>
              <el-descriptions-item label="Collection">{{ stats.collectionName }}</el-descriptions-item>
              <el-descriptions-item label="Database">{{ stats.databaseName }}</el-descriptions-item>
            </el-descriptions>
          </template>
          <el-empty v-else description="Service unavailable" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <!-- Voyage Usage -->
    <el-card v-loading="usageLoading" shadow="hover" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>Voyage Usage & Cost</span>
          <div>
            <span style="margin-right: 8px">Days</span>
            <el-input-number v-model="usageDays" :min="1" :max="180" :step="1" size="small" />
            <el-button text type="primary" style="margin-left: 8px" @click="loadUsage">Refresh</el-button>
          </div>
        </div>
      </template>
      <template v-if="usage">
        <el-row :gutter="16" style="margin-bottom: 12px">
          <el-col :span="6">
            <el-statistic title="Requests" :value="usage.totals.requestsTotal" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="Tokens" :value="usage.totals.tokensTotal" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="Cost (USD)" :value="usage.totals.costUsdTotal" :precision="6" />
          </el-col>
          <el-col :span="6">
            <el-statistic
              title="Avg Cost / Request (USD)"
              :value="usage.totals.avgCostUsdPerRequest"
              :precision="6"
            />
          </el-col>
        </el-row>

        <el-table :data="usage.daily" stripe border size="small" style="margin-bottom: 12px">
          <el-table-column prop="date" label="Date" width="120" />
          <el-table-column label="Requests" width="120">
            <template #default="{ row }">{{ row.totals.requestsTotal }}</template>
          </el-table-column>
          <el-table-column label="Tokens" width="140">
            <template #default="{ row }">{{ row.totals.tokensTotal }}</template>
          </el-table-column>
          <el-table-column label="Cost (USD)" width="140">
            <template #default="{ row }">{{ row.totals.costUsdTotal.toFixed(6) }}</template>
          </el-table-column>
          <el-table-column label="Avg Cost/Req (USD)">
            <template #default="{ row }">{{ row.totals.avgCostUsdPerRequest.toFixed(6) }}</template>
          </el-table-column>
        </el-table>

        <el-table :data="usage.byModel" stripe border size="small">
          <el-table-column prop="api" label="API" width="120" />
          <el-table-column prop="model" label="Model" />
          <el-table-column label="Requests" width="120">
            <template #default="{ row }">{{ row.totals.requestsTotal }}</template>
          </el-table-column>
          <el-table-column label="Tokens" width="140">
            <template #default="{ row }">{{ row.totals.tokensTotal }}</template>
          </el-table-column>
          <el-table-column label="Cost (USD)" width="140">
            <template #default="{ row }">{{ row.totals.costUsdTotal.toFixed(6) }}</template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-else description="No usage data" :image-size="60" />
    </el-card>

    <!-- Search Test -->
    <el-card shadow="hover">
      <template #header>
        <span>Vector Search Test</span>
      </template>

      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="Query">
          <el-input
            v-model="searchQuery"
            placeholder="e.g. Rolex Submariner black dial"
            style="width: 300px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="Top K">
          <el-input-number v-model="searchTopK" :min="1" :max="100" :step="5" />
        </el-form-item>
        <el-form-item label="Rerank">
          <el-switch v-model="searchRerank" />
        </el-form-item>
        <el-form-item v-if="searchRerank" label="Rerank Top N">
          <el-input-number v-model="searchRerankTopN" :min="1" :max="100" :step="5" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="searchLoading" @click="handleSearch">Search</el-button>
        </el-form-item>
      </el-form>

      <div v-if="searchResults.length > 0" style="margin-top: 16px">
        <el-tag v-if="searchReranked" type="success" size="small" style="margin-bottom: 8px">Reranked</el-tag>
        <el-tag size="small" style="margin-bottom: 8px; margin-left: 8px">{{ searchTotal }} results</el-tag>

        <el-table :data="searchResults" stripe border size="small">
          <el-table-column prop="score" label="Score" width="100">
            <template #default="{ row }">{{ row.score.toFixed(4) }}</template>
          </el-table-column>
          <el-table-column prop="brand" label="Brand" width="120" />
          <el-table-column prop="modelName" label="Model" width="200" />
          <el-table-column prop="reference" label="Reference" width="160" />
          <el-table-column prop="url" label="URL">
            <template #default="{ row }">
              <el-link v-if="row.url" :href="row.url" target="_blank" type="primary">
                {{ row.url.substring(0, 60) }}{{ row.url.length > 60 ? '...' : '' }}
              </el-link>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.matcher-view {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

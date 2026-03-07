<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getMatcherUsage,
  type MatcherUsage,
  type UsageAggregate,
  type UsageByModelItem,
} from '@/api/matcher'

const usage = ref<MatcherUsage | null>(null)
const loading = ref(false)
const days = ref(30)

async function loadUsage() {
  loading.value = true
  try {
    usage.value = await getMatcherUsage(days.value)
  } catch {
    usage.value = null
  } finally {
    loading.value = false
  }
}

const embeddingModel = computed<UsageByModelItem | null>(() => {
  if (!usage.value) return null
  return usage.value.byModel.find(m => m.api === 'embedding') ?? null
})

const rerankModel = computed<UsageByModelItem | null>(() => {
  if (!usage.value) return null
  return usage.value.byModel.find(m => m.api === 'rerank') ?? null
})

function fmtCost(v: number): string {
  return v.toFixed(6)
}

function fmtTokens(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K'
  return v.toString()
}

onMounted(() => {
  loadUsage()
})
</script>

<template>
  <div class="usage-view" v-loading="loading">
    <!-- Header -->
    <div class="page-header">
      <h2>Voyage API Usage & Cost</h2>
      <div class="header-controls">
        <span class="days-label">Days</span>
        <el-input-number v-model="days" :min="1" :max="180" :step="7" size="small" />
        <el-button type="primary" size="small" @click="loadUsage">Refresh</el-button>
      </div>
    </div>

    <template v-if="usage">
      <!-- Total Cost Summary -->
      <el-row :gutter="16" class="summary-row">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card highlight">
            <div class="stat-label">Total Cost ({{ days }}d)</div>
            <div class="stat-value cost">${{ fmtCost(usage.totals.costUsdTotal) }}</div>
            <div class="stat-sub text-muted">{{ fmtTokens(usage.totals.tokensTotal) }} tokens</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-label">API Requests</div>
            <div class="stat-value">{{ usage.totals.requestsTotal }}</div>
            <div class="stat-sub">
              <el-tag size="small" type="success">{{ usage.totals.requestsSuccess }} ok</el-tag>
              <el-tag v-if="usage.totals.requestsFailed > 0" size="small" type="danger" style="margin-left: 4px">{{ usage.totals.requestsFailed }} fail</el-tag>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-label">Embedding Cost</div>
            <div class="stat-value cost">${{ embeddingModel ? fmtCost(embeddingModel.totals.costUsdTotal) : '0' }}</div>
            <div class="stat-sub text-muted">{{ embeddingModel ? fmtTokens(embeddingModel.totals.tokensTotal) : '0' }} tokens</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-label">Rerank Cost</div>
            <div class="stat-value cost">${{ rerankModel ? fmtCost(rerankModel.totals.costUsdTotal) : '0' }}</div>
            <div class="stat-sub text-muted">{{ rerankModel ? fmtTokens(rerankModel.totals.tokensTotal) : '0' }} tokens</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Embedding Section -->
      <el-card shadow="hover" style="margin-bottom: 20px">
        <template #header>
          <div class="section-header">
            <span>Embedding — {{ embeddingModel?.model ?? 'N/A' }}</span>
            <el-tag size="small">per document</el-tag>
          </div>
        </template>
        <template v-if="embeddingModel">
          <el-row :gutter="16" style="margin-bottom: 16px">
            <el-col :span="4">
              <el-statistic title="Requests" :value="embeddingModel.totals.requestsTotal" />
            </el-col>
            <el-col :span="4">
              <el-statistic title="Documents" :value="embeddingModel.totals.documentsTotal" />
            </el-col>
            <el-col :span="4">
              <el-statistic title="Tokens" :value="embeddingModel.totals.tokensTotal" />
            </el-col>
            <el-col :span="4">
              <el-statistic title="Cost (USD)" :value="embeddingModel.totals.costUsdTotal" :precision="6" />
            </el-col>
            <el-col :span="4">
              <el-statistic title="Avg Tokens/Doc" :value="embeddingModel.totals.avgTokensPerDocument" :precision="1" />
            </el-col>
            <el-col :span="4">
              <el-statistic title="Avg Cost/Doc" :value="embeddingModel.totals.avgCostPerDocument" :precision="8" prefix="$" />
            </el-col>
          </el-row>
        </template>
        <el-empty v-else description="No embedding usage" :image-size="40" />
      </el-card>

      <!-- Rerank Section -->
      <el-card shadow="hover" style="margin-bottom: 20px">
        <template #header>
          <div class="section-header">
            <span>Rerank — {{ rerankModel?.model ?? 'N/A' }}</span>
            <el-tag size="small" type="warning">per query</el-tag>
          </div>
        </template>
        <template v-if="rerankModel">
          <el-row :gutter="16" style="margin-bottom: 16px">
            <el-col :span="4">
              <el-statistic title="Queries" :value="rerankModel.totals.requestsTotal" />
            </el-col>
            <el-col :span="4">
              <el-statistic title="Candidates" :value="rerankModel.totals.documentsTotal" />
            </el-col>
            <el-col :span="4">
              <el-statistic title="Tokens" :value="rerankModel.totals.tokensTotal" />
            </el-col>
            <el-col :span="4">
              <el-statistic title="Cost (USD)" :value="rerankModel.totals.costUsdTotal" :precision="6" />
            </el-col>
            <el-col :span="4">
              <el-statistic title="Avg Tokens/Query" :value="rerankModel.totals.avgTokensPerRequest" :precision="1" />
            </el-col>
            <el-col :span="4">
              <el-statistic title="Avg Cost/Query" :value="rerankModel.totals.avgCostUsdPerRequest" :precision="8" prefix="$" />
            </el-col>
          </el-row>
        </template>
        <el-empty v-else description="No rerank usage" :image-size="40" />
      </el-card>

      <!-- Daily Usage Table -->
      <el-card shadow="hover">
        <template #header>
          <span>Daily Breakdown</span>
        </template>
        <el-table :data="usage.daily" stripe border size="small">
          <el-table-column prop="date" label="Date" width="120" />
          <el-table-column label="Requests" width="100" align="right">
            <template #default="{ row }">{{ row.totals.requestsTotal }}</template>
          </el-table-column>
          <el-table-column label="Tokens" width="140" align="right">
            <template #default="{ row }">{{ row.totals.tokensTotal.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="Cost (USD)" width="140" align="right">
            <template #default="{ row }">${{ fmtCost(row.totals.costUsdTotal) }}</template>
          </el-table-column>
          <el-table-column label="Documents" width="120" align="right">
            <template #default="{ row }">{{ row.totals.documentsTotal.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="Avg Cost/Doc" align="right">
            <template #default="{ row }">${{ fmtCost(row.totals.avgCostPerDocument) }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <el-empty v-else-if="!loading" description="No usage data" />
  </div>
</template>

<style scoped lang="scss">
.usage-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 20px;
  }
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.days-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.summary-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;

  :deep(.el-card__body) {
    padding: 16px 12px;
  }

  &.highlight {
    border-color: var(--el-color-warning-light-5);
  }
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 6px;

  &.cost {
    color: var(--el-color-warning);
  }
}

.stat-sub {
  font-size: 12px;
}

.text-muted {
  color: var(--el-text-color-secondary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

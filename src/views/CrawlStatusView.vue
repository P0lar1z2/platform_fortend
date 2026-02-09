<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getCrawlStatus } from '@/api/crawl'
import type { CrawlServiceStatus, SourceStatus, WorkerStatus } from '@/types/crawl'

const status = ref<CrawlServiceStatus | null>(null)
const loading = ref(false)
const error = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const sourceDisplayNames: Record<string, string> = {
  starbuyer: 'StarBuyer',
  ecoauc: 'EcoAuc',
  yahoo: 'Yahoo Auctions',
  rakuten: 'Rakuten',
  watchbase: 'WatchBase',
}

const sortedSources = computed(() => {
  if (!status.value) return []
  const order = ['starbuyer', 'ecoauc', 'yahoo', 'rakuten', 'watchbase']
  return order
    .filter((k) => k in status.value!.sources)
    .map((k) => ({ key: k, ...status.value!.sources[k] }))
})

const uptimeFormatted = computed(() => {
  if (!status.value) return '-'
  const s = status.value.uptime_seconds
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
})

const totalWorkers = computed(() => {
  if (!status.value) return 0
  return Object.values(status.value.sources).reduce((sum, s) => sum + s.workers.length, 0)
})

const totalActive = computed(() => {
  if (!status.value) return 0
  return Object.values(status.value.sources).reduce((sum, s) => sum + s.active_workers, 0)
})

const totalPending = computed(() => {
  if (!status.value) return 0
  return Object.values(status.value.sources).reduce((sum, s) => sum + s.pending_tasks, 0)
})

async function fetchStatus() {
  try {
    status.value = await getCrawlStatus()
    error.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch status'
    if (!status.value) {
      // Only show message on first failure
      ElMessage.warning('Crawl 服务状态不可用')
    }
  } finally {
    loading.value = false
  }
}

function proxyModeTag(mode: string): 'success' | 'warning' | 'info' {
  if (mode === 'each') return 'success'
  if (mode === 'shared') return 'warning'
  return 'info'
}

function availabilityType(src: SourceStatus): 'success' | 'danger' | 'warning' {
  if (src.is_available) return 'success'
  if (src.logged_in) return 'warning'
  return 'danger'
}

function workerStateType(w: WorkerStatus): 'success' | 'warning' {
  return w.state === 'busy' ? 'warning' : 'success'
}

function formatTime(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString()
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

onMounted(async () => {
  loading.value = true
  await fetchStatus()
  timer = setInterval(fetchStatus, 5000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="crawl-status-view">
    <!-- Overview cards -->
    <el-row :gutter="16" class="overview-row">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">Uptime</div>
          <div class="stat-value">{{ uptimeFormatted }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">Workers</div>
          <div class="stat-value">
            <span class="active-count">{{ totalActive }}</span>
            <span class="total-count"> / {{ totalWorkers }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">Pending Tasks</div>
          <div class="stat-value">{{ totalPending }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">Started At</div>
          <div class="stat-value stat-value-sm">
            {{ status ? formatDateTime(status.started_at) : '-' }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Error alert -->
    <el-alert
      v-if="error && !status"
      :title="error"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 16px"
    />

    <!-- Source cards -->
    <div v-loading="loading" class="sources-grid">
      <el-card
        v-for="src in sortedSources"
        :key="src.key"
        shadow="hover"
        class="source-card"
      >
        <template #header>
          <div class="source-header">
            <div class="source-title">
              <span class="source-name">{{ sourceDisplayNames[src.key] || src.key }}</span>
              <el-tag :type="availabilityType(src)" size="small" effect="dark">
                {{ src.is_available ? 'Available' : 'Unavailable' }}
              </el-tag>
            </div>
            <div class="source-meta">
              <el-tag :type="proxyModeTag(src.proxy_mode)" size="small" effect="plain">
                proxy: {{ src.proxy_mode }}
              </el-tag>
              <el-tag v-if="src.session_count > 0" size="small" effect="plain">
                {{ src.session_count }} sessions
              </el-tag>
              <el-tag v-if="src.logged_in" type="success" size="small" effect="plain">
                logged in
              </el-tag>
            </div>
          </div>
        </template>

        <!-- Source summary -->
        <div class="source-summary">
          <div class="summary-item">
            <span class="summary-label">Workers</span>
            <span class="summary-value">
              <span v-if="src.active_workers > 0" class="active-count">{{ src.active_workers }} busy</span>
              <span v-else class="idle-text">all idle</span>
              / {{ src.concurrency }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Queue</span>
            <span class="summary-value" :class="{ 'has-pending': src.pending_tasks > 0 }">
              {{ src.pending_tasks }}
            </span>
          </div>
        </div>

        <!-- Worker table -->
        <el-table
          v-if="src.workers.length > 0"
          :data="src.workers"
          size="small"
          stripe
          class="worker-table"
          :max-height="src.workers.length > 8 ? 320 : undefined"
        >
          <el-table-column label="#" width="40">
            <template #default="{ row }">
              {{ row.worker_index }}
            </template>
          </el-table-column>
          <el-table-column label="State" width="80">
            <template #default="{ row }">
              <el-tag :type="workerStateType(row)" size="small" effect="dark">
                {{ row.state }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Current Task" min-width="140">
            <template #default="{ row }">
              <template v-if="row.current_task">
                <span class="task-action">{{ row.current_task.action }}</span>
                <span v-if="row.current_task.item_id" class="task-item-id">
                  {{ row.current_task.item_id }}
                </span>
              </template>
              <span v-else class="idle-text">-</span>
            </template>
          </el-table-column>
          <el-table-column label="Done" width="60" align="center">
            <template #default="{ row }">
              {{ row.tasks_completed }}
            </template>
          </el-table-column>
          <el-table-column label="Fail" width="55" align="center">
            <template #default="{ row }">
              <span :class="{ 'fail-count': row.tasks_failed > 0 }">
                {{ row.tasks_failed }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Last Active" width="100">
            <template #default="{ row }">
              {{ formatTime(row.last_active_at) }}
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-else
          description="Workers not yet registered"
          :image-size="40"
          style="padding: 8px 0"
        />
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.crawl-status-view {
  padding: 4px;
}

.overview-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;

  .stat-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;

    &.stat-value-sm {
      font-size: 14px;
      font-weight: 400;
    }
  }

  .active-count {
    color: var(--el-color-warning);
  }

  .total-count {
    color: #909399;
    font-weight: 400;
    font-size: 16px;
  }
}

.sources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(520px, 1fr));
  gap: 16px;
}

.source-card {
  :deep(.el-card__header) {
    padding: 12px 16px;
  }

  :deep(.el-card__body) {
    padding: 12px 16px;
  }
}

.source-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.source-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-name {
  font-size: 16px;
  font-weight: 600;
}

.source-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.source-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.summary-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.summary-label {
  font-size: 12px;
  color: #909399;
}

.summary-value {
  font-size: 14px;
  font-weight: 500;

  &.has-pending {
    color: var(--el-color-warning);
  }
}

.idle-text {
  color: #c0c4cc;
}

.worker-table {
  width: 100%;
}

.task-action {
  font-weight: 500;
  margin-right: 4px;
}

.task-item-id {
  color: #909399;
  font-size: 12px;
}

.fail-count {
  color: var(--el-color-danger);
  font-weight: 600;
}
</style>

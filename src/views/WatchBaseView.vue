<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getWatchBaseBrands,
  startScrape,
  startScrapeAll,
  getScrapeStatus,
  type WatchBaseBrand,
  type ScrapeStatus,
} from '@/api/watchbase'

// State
const brands = ref<WatchBaseBrand[]>([])
const status = ref<ScrapeStatus | null>(null)
const loading = ref(false)
const statusLoading = ref(false)
const searchQuery = ref('')
const startingBrand = ref<string | null>(null)
const startingAll = ref(false)

// Polling
let statusPollTimer: ReturnType<typeof setInterval> | null = null

// Computed
const filteredBrands = computed(() => {
  if (!searchQuery.value.trim()) {
    return brands.value
  }
  const query = searchQuery.value.toLowerCase()
  return brands.value.filter(
    (b) =>
      b.name.toLowerCase().includes(query) ||
      b.slug.toLowerCase().includes(query)
  )
})

const progressPercent = computed(() => {
  if (!status.value || !status.value.progress || !status.value.total) {
    return 0
  }
  return Math.round((status.value.progress / status.value.total) * 100)
})

const brandsProgressPercent = computed(() => {
  if (!status.value || !status.value.processedBrands || !status.value.totalBrands) {
    return 0
  }
  return Math.round((status.value.processedBrands / status.value.totalBrands) * 100)
})

const isAllBrandsScrape = computed(() => {
  return status.value?.totalBrands != null && status.value.totalBrands > 0
})

const isRunning = computed(() => status.value?.isRunning ?? false)

// Methods
async function fetchBrands() {
  loading.value = true
  try {
    brands.value = await getWatchBaseBrands()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : 'Failed to fetch brands')
  } finally {
    loading.value = false
  }
}

async function fetchStatus() {
  statusLoading.value = true
  try {
    status.value = await getScrapeStatus()
  } catch (e) {
    console.error('Failed to fetch status:', e)
  } finally {
    statusLoading.value = false
  }
}

async function handleStartScrape(brandSlug: string) {
  if (isRunning.value) {
    ElMessage.warning('A scrape task is already running')
    return
  }

  startingBrand.value = brandSlug
  try {
    const result = await startScrape(brandSlug)
    ElMessage.success(result.message || `Started scraping ${brandSlug}`)
    // Start polling for status
    startStatusPolling()
    await fetchStatus()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : 'Failed to start scrape')
  } finally {
    startingBrand.value = null
  }
}

async function handleStartScrapeAll() {
  if (isRunning.value) {
    ElMessage.warning('A scrape task is already running')
    return
  }

  startingAll.value = true
  try {
    const result = await startScrapeAll()
    ElMessage.success(result.message || `Started scraping all ${result.total_brands} brands`)
    // Start polling for status
    startStatusPolling()
    await fetchStatus()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : 'Failed to start scrape all')
  } finally {
    startingAll.value = false
  }
}

function startStatusPolling() {
  if (statusPollTimer) {
    clearInterval(statusPollTimer)
  }
  statusPollTimer = setInterval(async () => {
    await fetchStatus()
    // Stop polling if not running
    if (!isRunning.value && statusPollTimer) {
      clearInterval(statusPollTimer)
      statusPollTimer = null
    }
  }, 3000)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchBrands(), fetchStatus()])
  // Start polling if already running
  if (isRunning.value) {
    startStatusPolling()
  }
})

onUnmounted(() => {
  if (statusPollTimer) {
    clearInterval(statusPollTimer)
  }
})
</script>

<template>
  <div class="watchbase-view">
    <el-page-header title="Admin" @back="$router.push('/')">
      <template #content>
        <span class="page-title">WatchBase 数据同步</span>
      </template>
      <template #extra>
        <el-button :loading="statusLoading" @click="fetchStatus">
          <el-icon><Refresh /></el-icon>
          刷新状态
        </el-button>
      </template>
    </el-page-header>

    <div class="content">
      <!-- Current Task Status -->
      <el-card class="status-card">
        <template #header>
          <div class="card-header">
            <span>当前任务状态</span>
            <el-tag v-if="isRunning" type="success">运行中</el-tag>
            <el-tag v-else type="info">空闲</el-tag>
          </div>
        </template>

        <div v-if="isRunning && status" class="status-content">
          <div class="status-info">
            <div class="info-row">
              <span class="label">品牌:</span>
              <el-tag type="primary">{{ status.brandSlug }}</el-tag>
            </div>
            <div class="info-row">
              <span class="label">开始时间:</span>
              <span>{{ formatDate(status.startedAt) }}</span>
            </div>
            <div v-if="status.error" class="info-row">
              <span class="label">错误:</span>
              <el-text type="danger">{{ status.error }}</el-text>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-text">
              进度: {{ status.progress ?? 0 }} / {{ status.total ?? '?' }}
              ({{ progressPercent }}%)
            </div>
            <el-progress
              :percentage="progressPercent"
              :stroke-width="20"
              :text-inside="true"
              striped
              striped-flow
            />
          </div>
        </div>

        <el-empty v-else description="当前没有运行中的任务" :image-size="80" />
      </el-card>

      <!-- Brand List -->
      <el-card class="brands-card">
        <template #header>
          <div class="card-header">
            <span>
              品牌列表
              <el-tag type="info" style="margin-left: 8px">
                {{ filteredBrands.length }} / {{ brands.length }} 个品牌
              </el-tag>
            </span>
            <el-input
              v-model="searchQuery"
              placeholder="搜索品牌..."
              style="width: 240px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </template>

        <div v-loading="loading" class="brands-grid">
          <el-card
            v-for="brand in filteredBrands"
            :key="brand.slug"
            class="brand-card"
            shadow="hover"
          >
            <div class="brand-info">
              <div class="brand-name">{{ brand.name }}</div>
              <div class="brand-slug">{{ brand.slug }}</div>
              <div v-if="brand.modelCount" class="brand-count">
                {{ brand.modelCount }} 型号
              </div>
            </div>
            <el-button
              type="primary"
              size="small"
              :loading="startingBrand === brand.slug"
              :disabled="isRunning"
              @click="handleStartScrape(brand.slug)"
            >
              <el-icon><CaretRight /></el-icon>
              开始爬取
            </el-button>
          </el-card>
        </div>

        <el-empty
          v-if="!loading && filteredBrands.length === 0"
          description="没有找到匹配的品牌"
        />
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.watchbase-view {
  .page-title {
    font-weight: 600;
  }

  .content {
    margin-top: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-card {
    margin-bottom: 20px;

    .status-content {
      .status-info {
        margin-bottom: 20px;

        .info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .label {
            color: #909399;
            min-width: 80px;
          }
        }
      }

      .progress-section {
        .progress-text {
          margin-bottom: 8px;
          font-weight: 500;
        }
      }
    }
  }

  .brands-card {
    .brands-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      min-height: 200px;
    }

    .brand-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 140px;

      :deep(.el-card__body) {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
      }

      .brand-info {
        .brand-name {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
        }

        .brand-slug {
          color: #909399;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .brand-count {
          color: #606266;
          font-size: 12px;
        }
      }
    }
  }
}
</style>

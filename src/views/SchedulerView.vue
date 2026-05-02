<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listJobs,
  createJob,
  updateJob,
  deleteJob,
  getJobHistory,
  runJob,
  type ScheduledJob,
  type JobExecution,
  type CreateJobRequest,
} from '@/api/scheduler'
import { getWatchBaseBrands, type WatchBaseBrand } from '@/api/watchbase'

// State
const jobs = ref<ScheduledJob[]>([])
const brands = ref<WatchBaseBrand[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const historyDialogVisible = ref(false)
const editMode = ref(false)
const editingJobId = ref<string | null>(null)
const jobHistory = ref<JobExecution[]>([])
const historyLoading = ref(false)

// Form state
const formData = ref({
  name: '',
  jobType: 'watchbase_scrape',
  brandSlug: '',
  platform: '',
  keyword: '',
  pages: undefined as number | undefined,
  maxItems: undefined as number | undefined,
  startDate: '' as string,
  endDate: '' as string,
  params: '' as string,
  maxPages: undefined as number | undefined,
  cronPreset: 'daily',
  cronHour: '00',
  cronMinute: '00',
  cronCustom: '',
  enabled: true,
  runOnce: false,
})

// Cron presets
const cronPresets = [
  { label: '每天', value: 'daily' },
  { label: '每周一', value: 'weekly' },
  { label: '每小时', value: 'hourly' },
  { label: '每 6 小时', value: 'every6h' },
  { label: '自定义', value: 'custom' },
]

const jobTypes = [
  { label: 'WatchBase 爬取', value: 'watchbase_scrape' },
  { label: '平台搜索（在售 listing）', value: 'platform_search' },
  { label: '交易记录抓取（auction history → transactions）', value: 'transaction_ingest' },
  { label: 'StarBuyer 全量历史回灌（按月分片 + 详情 → transactions）', value: 'starbuyer_full_scrape' },
  { label: 'EcoAuc 全量历史回灌（market-prices 全表 → transactions）', value: 'ecoauc_full_scrape' },
]

const platforms = [
  { label: 'StarBuyer', value: 'starbuyer' },
  { label: 'EcoAuc', value: 'ecoauc' },
  { label: 'Yahoo Auctions', value: 'yahoo' },
  { label: 'Rakuten', value: 'rakuten' },
]

// transaction_ingest 仅支持有 MarketPriceItem 形态的源
const transactionPlatforms = [
  { label: 'StarBuyer', value: 'starbuyer' },
  { label: 'EcoAuc', value: 'ecoauc' },
]

// 默认 pages（和 backend default_pages_for 保持一致）
const DEFAULT_PAGES_BY_PLATFORM: Record<string, number> = {
  yahoo: 1,
  rakuten: 1,
  starbuyer: 3,
  ecoauc: 3,
  chrono24: 2,
}

function platformDefaultPages(platform: string): number {
  return DEFAULT_PAGES_BY_PLATFORM[platform] ?? 1
}

// Computed
const cronExpression = computed(() => {
  const { cronPreset, cronHour, cronMinute, cronCustom } = formData.value
  switch (cronPreset) {
    case 'daily':
      return `0 ${cronMinute} ${cronHour} * * *`
    case 'weekly':
      return `0 ${cronMinute} ${cronHour} * * 1`
    case 'hourly':
      return `0 ${cronMinute} * * * *`
    case 'every6h':
      return `0 ${cronMinute} */6 * * *`
    case 'custom':
      return cronCustom
    default:
      return `0 0 0 * * *`
  }
})

// Methods
async function fetchJobs() {
  loading.value = true
  try {
    jobs.value = await listJobs()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '获取任务列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchBrands() {
  try {
    brands.value = await getWatchBaseBrands()
  } catch (e) {
    console.error('Failed to fetch brands:', e)
  }
}

function openCreateDialog() {
  editMode.value = false
  editingJobId.value = null
  formData.value = {
    name: '',
    jobType: 'watchbase_scrape',
    brandSlug: '',
    platform: '',
    keyword: '',
    pages: undefined,
    maxItems: undefined,
    startDate: '',
    endDate: '',
    params: '',
    maxPages: undefined,
    cronPreset: 'daily',
    cronHour: '00',
    cronMinute: '00',
    cronCustom: '',
    enabled: true,
    runOnce: false,
  }
  dialogVisible.value = true
}

function openEditDialog(job: ScheduledJob) {
  editMode.value = true
  editingJobId.value = job.id

  // Parse cron to preset
  let cronPreset = 'custom'
  let cronHour = '00'
  let cronMinute = '00'
  const parts = job.cron.split(' ')
  if (parts.length === 6) {
    cronMinute = parts[1].padStart(2, '0')
    cronHour = parts[2] === '*' ? '00' : parts[2].padStart(2, '0')

    if (parts[2] !== '*' && parts[3] === '*' && parts[4] === '*' && parts[5] === '*') {
      cronPreset = 'daily'
    } else if (parts[2] !== '*' && parts[5] === '1') {
      cronPreset = 'weekly'
    } else if (parts[2] === '*') {
      cronPreset = 'hourly'
    } else if (parts[2] === '*/6') {
      cronPreset = 'every6h'
    }
  }

  formData.value = {
    name: job.name,
    jobType: job.jobType,
    brandSlug: job.config.brandSlug || '',
    platform: job.config.platform || '',
    keyword: job.config.keyword || '',
    pages: job.config.pages,
    maxItems: job.config.maxItems,
    startDate: job.config.startDate || '',
    endDate: job.config.endDate || '',
    params: job.config.params || '',
    maxPages: job.config.maxPages,
    cronPreset,
    cronHour,
    cronMinute,
    cronCustom: cronPreset === 'custom' ? job.cron : '',
    enabled: job.enabled,
    runOnce: job.runOnce || false,
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  const { name, jobType, brandSlug, platform, keyword, pages, maxItems, startDate, endDate, params, maxPages, enabled, runOnce } =
    formData.value

  if (!name.trim()) {
    ElMessage.warning('请输入任务名称')
    return
  }

  const config: CreateJobRequest['config'] = {}
  if (jobType === 'watchbase_scrape') {
    if (!brandSlug) {
      ElMessage.warning('请选择品牌')
      return
    }
    config.brand_slug = brandSlug
  } else if (jobType === 'platform_search') {
    if (!platform || !keyword.trim()) {
      ElMessage.warning('请选择平台并输入关键词')
      return
    }
    config.platform = platform
    config.keyword = keyword.trim()
    if (pages !== undefined && pages !== null) config.pages = pages
    if (maxItems !== undefined && maxItems !== null) config.max_items = maxItems
  } else if (jobType === 'transaction_ingest') {
    if (!platform || !['starbuyer', 'ecoauc'].includes(platform)) {
      ElMessage.warning('交易记录抓取仅支持 StarBuyer / EcoAuc')
      return
    }
    config.platform = platform
    if (pages !== undefined && pages !== null) config.pages = pages
    if (maxItems !== undefined && maxItems !== null) config.max_items = maxItems
  } else if (jobType === 'starbuyer_full_scrape') {
    if (startDate) config.start_date = startDate
    if (endDate) config.end_date = endDate
  } else if (jobType === 'ecoauc_full_scrape') {
    if (params.trim()) config.params = params.trim()
    if (maxPages !== undefined && maxPages !== null) config.max_pages = maxPages
    if (maxItems !== undefined && maxItems !== null) config.max_items = maxItems
  }

  try {
    if (editMode.value && editingJobId.value) {
      await updateJob(editingJobId.value, {
        name: name.trim(),
        cron: cronExpression.value,
        config,
        enabled,
        run_once: runOnce,
      })
      ElMessage.success('任务更新成功')
    } else {
      const request: CreateJobRequest = {
        name: name.trim(),
        job_type: jobType,
        cron: cronExpression.value,
        config,
        enabled,
        run_once: runOnce,
      }
      await createJob(request)
      ElMessage.success('任务创建成功')
    }
    dialogVisible.value = false
    await fetchJobs()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  }
}

async function handleToggleEnabled(job: ScheduledJob) {
  try {
    await updateJob(job.id, { enabled: !job.enabled })
    job.enabled = !job.enabled
    ElMessage.success(job.enabled ? '任务已启用' : '任务已禁用')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  }
}

async function handleDelete(job: ScheduledJob) {
  try {
    await ElMessageBox.confirm(`确定要删除任务 "${job.name}" 吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteJob(job.id)
    ElMessage.success('任务已删除')
    await fetchJobs()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e instanceof Error ? e.message : '删除失败')
    }
  }
}

async function handleRunNow(job: ScheduledJob) {
  try {
    await runJob(job.id)
    ElMessage.success(`任务 "${job.name}" 已加入执行队列`)
    // Refresh to show updated lastRun
    setTimeout(() => fetchJobs(), 1000)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '执行失败')
  }
}

async function openHistoryDialog(job: ScheduledJob) {
  editingJobId.value = job.id
  historyDialogVisible.value = true
  historyLoading.value = true
  try {
    jobHistory.value = await getJobHistory(job.id, 20)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '获取历史失败')
  } finally {
    historyLoading.value = false
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

function formatJobType(type: string): string {
  const found = jobTypes.find((t) => t.value === type)
  return found ? found.label : type
}

function formatCron(cron: string): string {
  const parts = cron.split(' ')
  if (parts.length !== 6) return cron

  const [, minute, hour, dayOfMonth, , dayOfWeek] = parts

  if (hour !== '*' && dayOfMonth === '*' && dayOfWeek === '*') {
    return `每天 ${hour}:${minute.padStart(2, '0')}`
  }
  if (hour !== '*' && dayOfWeek === '1') {
    return `每周一 ${hour}:${minute.padStart(2, '0')}`
  }
  if (hour === '*') {
    return `每小时 :${minute.padStart(2, '0')}`
  }
  if (hour === '*/6') {
    return `每 6 小时 :${minute.padStart(2, '0')}`
  }
  return cron
}

function getStatusType(
  status: string
): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'running':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchJobs(), fetchBrands()])
})
</script>

<template>
  <div class="scheduler-view">
    <div class="content">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>任务列表</span>
            <el-button type="primary" @click="openCreateDialog">
              <el-icon><Plus /></el-icon>
              新建任务
            </el-button>
          </div>
        </template>
        <el-table v-loading="loading" :data="jobs" stripe style="width: 100%">
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-switch
                :model-value="row.enabled"
                @change="handleToggleEnabled(row)"
              />
            </template>
          </el-table-column>

          <el-table-column prop="name" label="任务名称" min-width="150" />

          <el-table-column label="类型" width="180">
            <template #default="{ row }">
              <el-space>
                <el-tag>{{ formatJobType(row.jobType) }}</el-tag>
                <el-tag v-if="row.runOnce" type="warning" size="small">一次性</el-tag>
              </el-space>
            </template>
          </el-table-column>

          <el-table-column label="配置" min-width="180">
            <template #default="{ row }">
              <span v-if="row.jobType === 'watchbase_scrape'">
                品牌: {{ row.config.brandSlug === '__all__' ? '所有品牌' : (row.config.brandSlug || '-') }}
              </span>
              <span v-else-if="row.jobType === 'platform_search'">
                {{ row.config.platform }}: {{ row.config.keyword }}
              </span>
              <span v-else-if="row.jobType === 'transaction_ingest'">
                {{ row.config.platform }}
                <span v-if="row.config.pages">· {{ row.config.pages }} 页</span>
                <span v-if="row.config.maxItems">· ≤{{ row.config.maxItems }}</span>
              </span>
              <span v-else-if="row.jobType === 'starbuyer_full_scrape'">
                {{ row.config.startDate || '2020-01-01' }} → {{ row.config.endDate || '今天' }}
              </span>
              <span v-else-if="row.jobType === 'ecoauc_full_scrape'">
                {{ row.config.params ? '自定义 params' : '仅手表' }}
                <span v-if="row.config.maxPages">· max {{ row.config.maxPages }} 页</span>
                <span v-if="row.config.maxItems">· ≤{{ row.config.maxItems }}</span>
              </span>
            </template>
          </el-table-column>

          <el-table-column label="执行周期" width="160">
            <template #default="{ row }">
              <el-tooltip :content="row.cron" placement="top">
                <span>{{ formatCron(row.cron) }}</span>
              </el-tooltip>
            </template>
          </el-table-column>

          <el-table-column label="上次执行" width="180">
            <template #default="{ row }">
              <div>{{ formatDate(row.lastRun) }}</div>
              <el-tag
                v-if="row.lastError"
                type="danger"
                size="small"
                style="margin-top: 4px"
              >
                失败
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button-group size="small">
                <el-button type="success" @click="handleRunNow(row)">
                  立即运行
                </el-button>
                <el-button type="primary" @click="openEditDialog(row)">
                  编辑
                </el-button>
                <el-button @click="openHistoryDialog(row)">
                  历史
                </el-button>
                <el-button type="danger" @click="handleDelete(row)">
                  删除
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!loading && jobs.length === 0" description="暂无定时任务" />
      </el-card>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editMode ? '编辑任务' : '创建定时任务'"
      width="500px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="任务名称" required>
          <el-input
            v-model="formData.name"
            placeholder="输入任务名称"
          />
        </el-form-item>

        <el-form-item v-if="!editMode" label="任务类型" required>
          <el-select v-model="formData.jobType" style="width: 100%">
            <el-option
              v-for="type in jobTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>

        <!-- WatchBase config -->
        <el-form-item
          v-if="formData.jobType === 'watchbase_scrape'"
          label="品牌"
          required
        >
          <el-select
            v-model="formData.brandSlug"
            filterable
            placeholder="选择品牌"
            style="width: 100%"
          >
            <el-option
              key="__all__"
              label="所有品牌"
              value="__all__"
            />
            <el-option
              v-for="brand in brands"
              :key="brand.slug"
              :label="brand.name"
              :value="brand.slug"
            />
          </el-select>
        </el-form-item>

        <!-- Transaction ingest config -->
        <template v-if="formData.jobType === 'transaction_ingest'">
          <el-form-item label="平台" required>
            <el-select
              v-model="formData.platform"
              placeholder="选择平台（StarBuyer / EcoAuc）"
              style="width: 100%"
            >
              <el-option
                v-for="p in transactionPlatforms"
                :key="p.value"
                :label="p.label"
                :value="p.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="每次页数">
            <el-input-number
              v-model="formData.pages"
              :min="1"
              :max="20"
              controls-position="right"
              :placeholder="`留空 = 平台默认${formData.platform ? `（${platformDefaultPages(formData.platform)} 页）` : ''}`"
              style="width: 220px"
            />
            <span class="form-hint">每次任务翻多少页 MarketPrice 历史</span>
          </el-form-item>
          <el-form-item label="item 上限">
            <el-input-number
              v-model="formData.maxItems"
              :min="1"
              :max="10000"
              controls-position="right"
              placeholder="留空不限制"
              style="width: 220px"
            />
            <span class="form-hint">单次任务处理的 transaction 上限</span>
          </el-form-item>
        </template>

        <!-- Platform search config -->
        <template v-if="formData.jobType === 'platform_search'">
          <el-form-item label="平台" required>
            <el-select
              v-model="formData.platform"
              placeholder="选择平台"
              style="width: 100%"
            >
              <el-option
                v-for="p in platforms"
                :key="p.value"
                :label="p.label"
                :value="p.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词" required>
            <el-input
              v-model="formData.keyword"
              placeholder="输入搜索关键词"
            />
          </el-form-item>
          <el-form-item label="每次页数">
            <el-input-number
              v-model="formData.pages"
              :min="1"
              :max="10"
              controls-position="right"
              :placeholder="`留空 = 平台默认${formData.platform ? `（${platformDefaultPages(formData.platform)} 页）` : ''}`"
              style="width: 220px"
            />
            <span class="form-hint">留空按平台默认</span>
          </el-form-item>
          <el-form-item label="item 上限">
            <el-input-number
              v-model="formData.maxItems"
              :min="1"
              :max="10000"
              controls-position="right"
              placeholder="留空不限制"
              style="width: 220px"
            />
            <span class="form-hint">每次任务最多处理多少条 item（保护爬虫不爆量）</span>
          </el-form-item>
        </template>

        <!-- StarBuyer full scrape config -->
        <template v-if="formData.jobType === 'starbuyer_full_scrape'">
          <el-form-item label="开始日期">
            <el-date-picker
              v-model="formData.startDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="留空 = 2020-01-01"
              style="width: 220px"
            />
            <span class="form-hint">按月分片爬取的起始月</span>
          </el-form-item>
          <el-form-item label="结束日期">
            <el-date-picker
              v-model="formData.endDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="留空 = 今天"
              style="width: 220px"
            />
            <span class="form-hint">截止月（含）</span>
          </el-form-item>
          <el-form-item>
            <el-alert
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <div>一次性历史回灌任务：复用 grpc_server 已登录 sessions（3 路并发），每月翻页爬 listing → 调详情页合并 → 落 starbuyer_market_prices + starbuyer_item_details，并自动 XADD pipeline:tasks (kind=transaction) → transactions 集合。</div>
                <div>建议同时打开「一次性任务」开关，避免按 cron 重复跑。</div>
              </template>
            </el-alert>
          </el-form-item>
        </template>

        <!-- EcoAuc full scrape config -->
        <template v-if="formData.jobType === 'ecoauc_full_scrape'">
          <el-form-item label="搜索 params">
            <el-input
              v-model="formData.params"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="留空 = 仅手表 (master_item_categories[0]=1)"
            />
            <span class="form-hint">URL query 片段（不带前导 &），缺省跟旧 ecoauc_scraper bin 一致</span>
          </el-form-item>
          <el-form-item label="最大页数">
            <el-input-number
              v-model="formData.maxPages"
              :min="1"
              :max="10000"
              controls-position="right"
              placeholder="留空 = 2000"
              style="width: 220px"
            />
            <span class="form-hint">安全帽：超过 max_pages 的页数会被跳过</span>
          </el-form-item>
          <el-form-item label="item 上限">
            <el-input-number
              v-model="formData.maxItems"
              :min="1"
              :max="1000000"
              controls-position="right"
              placeholder="留空不限制"
              style="width: 220px"
            />
            <span class="form-hint">单次任务处理的 item 总上限</span>
          </el-form-item>
          <el-form-item>
            <el-alert
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <div>一次性历史回灌任务：先抓第一页拿 total_items 计算 total_pages，再翻完整张表（受 max_pages 限制），落 ecoauc_items，并对每条 item XADD pipeline:tasks (kind=transaction) → transactions 集合。</div>
                <div>默认 params 跟旧 ecoauc_scraper bin 一致，仅爬手表类目。建议打开「一次性任务」。</div>
              </template>
            </el-alert>
          </el-form-item>
        </template>

        <el-form-item label="执行周期" required>
          <el-select v-model="formData.cronPreset" style="width: 100%">
            <el-option
              v-for="preset in cronPresets"
              :key="preset.value"
              :label="preset.label"
              :value="preset.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="formData.cronPreset !== 'custom'"
          label="执行时间"
        >
          <el-space>
            <el-select
              v-if="formData.cronPreset !== 'hourly'"
              v-model="formData.cronHour"
              style="width: 80px"
            >
              <el-option
                v-for="h in 24"
                :key="h - 1"
                :label="String(h - 1).padStart(2, '0')"
                :value="String(h - 1).padStart(2, '0')"
              />
            </el-select>
            <span v-if="formData.cronPreset !== 'hourly'">:</span>
            <el-select v-model="formData.cronMinute" style="width: 80px">
              <el-option
                v-for="m in [0, 15, 30, 45]"
                :key="m"
                :label="String(m).padStart(2, '0')"
                :value="String(m).padStart(2, '0')"
              />
            </el-select>
          </el-space>
        </el-form-item>

        <el-form-item v-if="formData.cronPreset === 'custom'" label="Cron 表达式">
          <el-input
            v-model="formData.cronCustom"
            placeholder="秒 分 时 日 月 周 (例: 0 0 8 * * *)"
          />
        </el-form-item>

        <el-form-item label="预览">
          <el-tag type="info">{{ cronExpression }}</el-tag>
        </el-form-item>

        <el-form-item label="启用">
          <el-switch v-model="formData.enabled" />
        </el-form-item>

        <el-form-item label="一次性任务">
          <el-switch v-model="formData.runOnce" />
          <span class="form-hint">启用后任务执行一次即自动禁用</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ editMode ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- History Dialog -->
    <el-dialog
      v-model="historyDialogVisible"
      title="执行历史"
      width="700px"
    >
      <el-table
        v-loading="historyLoading"
        :data="jobHistory"
        stripe
        size="small"
      >
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.startedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="完成时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.completedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="结果" width="200">
          <template #default="{ row }">
            <span v-if="row.itemsFound !== undefined || row.itemsNew !== undefined">
              found=<strong>{{ row.itemsFound ?? 0 }}</strong>
              /
              new=<strong :style="{ color: (row.itemsNew ?? 0) > 0 ? 'var(--el-color-success)' : undefined }">
                {{ row.itemsNew ?? 0 }}
              </strong>
              <span v-if="(row.errors ?? 0) > 0">
                / err=<strong style="color: var(--el-color-danger)">{{ row.errors }}</strong>
              </span>
              <span v-if="row.elapsedMs" class="elapsed"> ({{ row.elapsedMs }}ms)</span>
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="错误" min-width="200">
          <template #default="{ row }">
            <el-text v-if="row.error" type="danger" truncated>
              {{ row.error }}
            </el-text>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!historyLoading && jobHistory.length === 0"
        description="暂无执行记录"
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.scheduler-view {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .form-hint {
    margin-left: 12px;
    color: #909399;
    font-size: 12px;
  }

  .elapsed {
    color: #909399;
    font-size: 12px;
    margin-left: 4px;
  }
}
</style>

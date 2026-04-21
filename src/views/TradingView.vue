<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  simulate,
  listSignals,
  ackSignal,
  getTradingStats,
  priceDiscovery,
  getTradingConfigs,
  updateTradingConfig,
  getFxRates,
  type SimulateRequest,
  type ValuationResult,
  type TradingSignal,
  type TradingStats,
  type DiscoveredItem,
  type PriceDiscoveryResult,
  type TradingPathConfig,
  type CurrencyInfo,
  type FxRatesResponse,
} from '@/api/trading'
import { queryByRef, corvusMatch, getTransactions, type EnrichedTransaction, type PriceSummary } from '@/api/corvus'
import { matcherSearch } from '@/api/matcher'
import { ElMessage } from 'element-plus'

// --- Tab state ---
const activeTab = ref('simulate')

// --- Catalog search ---
interface CatalogItem {
  catalog_id: string
  brand: string
  reference: string
  family?: string
  name?: string
  case_material?: string
  dial_color?: string
  images?: string[]
  source_engine?: string
  match_score?: number
  transaction_count?: number
  starbuyer_count?: number
}

type SearchEngine = 'corvus_ref' | 'corvus_match' | 'matcher'

const searchEngine = ref<SearchEngine>('corvus_ref')
const searchEngineOptions: { value: SearchEngine; label: string; disabled: boolean }[] = [
  { value: 'corvus_ref', label: 'Corvus Ref (Reference查询)', disabled: false },
  { value: 'corvus_match', label: 'Corvus Match (Waterfall匹配)', disabled: false },
  { value: 'matcher', label: 'Matcher (语义搜索)', disabled: true },
]

const catalogQuery = ref('')
const waterfallAttrs = reactive({
  brand: '',
  reference: '',
  dialColor: '',
  caseMaterial: '',
  dialIndex: '',
})
const catalogResults = ref<CatalogItem[]>([])
const catalogLoading = ref(false)
const selectedCatalog = ref<CatalogItem | null>(null)

async function searchCatalog() {
  if (searchEngine.value === 'corvus_match') {
    if (!waterfallAttrs.reference.trim()) return
  } else {
    if (!catalogQuery.value.trim()) return
  }
  catalogLoading.value = true
  catalogResults.value = []
  try {
    if (searchEngine.value === 'corvus_ref') {
      await searchViaCorvusRef()
    } else if (searchEngine.value === 'corvus_match') {
      await searchViaCorvusMatch()
    } else {
      await searchViaMatcher()
    }
  } catch (e: any) {
    ElMessage.error('搜索失败: ' + (e.response?.data?.error || e.message))
  } finally {
    catalogLoading.value = false
  }
}

async function searchViaCorvusRef() {
  const data = await queryByRef(catalogQuery.value.trim())
  const results = data?.results || data?.data?.results || []
  catalogResults.value = results.map((r: any) => ({
    catalog_id: r.catalog_id || '',
    brand: r.brand || '',
    reference: r.reference || '',
    family: r.model_name || '',
    name: r.model_name || '',
    case_material: r.case_material || '',
    dial_color: r.dial_color || '',
    images: r.image_url ? [r.image_url] : [],
    source_engine: 'corvus_ref',
    // Upstream may omit these; keep undefined so the table can show "—"
    transaction_count: r.transaction_count,
    starbuyer_count: r.starbuyer_count,
  }))
  // Sort: rows with images first, then by starbuyer_count desc
  catalogResults.value.sort((a, b) => {
    const aHas = a.images && a.images.length > 0 ? 1 : 0
    const bHas = b.images && b.images.length > 0 ? 1 : 0
    if (aHas !== bHas) return bHas - aHas
    return (b.starbuyer_count || 0) - (a.starbuyer_count || 0)
  })
}

async function searchViaCorvusMatch() {
  const brand = waterfallAttrs.brand.trim()
  const modelNumber = waterfallAttrs.reference.trim()

  if (!modelNumber) {
    ElMessage.warning('请输入 Reference')
    return
  }

  const data = await corvusMatch({
    source: 'manual',
    brand: brand || undefined,
    modelNumber: modelNumber || undefined,
    dialColor: waterfallAttrs.dialColor || undefined,
    caseMaterial: waterfallAttrs.caseMaterial || undefined,
    dialIndex: waterfallAttrs.dialIndex || undefined,
  })

  if (data.matched && data.categoryId) {
    // Matched — query by ID to get full catalog details
    const { queryById } = await import('@/api/corvus')
    const idData = await queryById(data.categoryId)
    const entry = idData?.data || idData || {}
    catalogResults.value = [{
      catalog_id: data.categoryId,
      brand: entry.brand || brand,
      reference: entry.reference || modelNumber,
      family: entry.model_name || '',
      name: entry.model_name || '',
      case_material: entry.case_material || '',
      dial_color: entry.dial_color || '',
      images: entry.image_url ? [entry.image_url] : [],
      source_engine: 'corvus_match',
      match_score: data.confidence,
    }]
  } else {
    catalogResults.value = []
    ElMessage.warning(`未匹配: ${data.matchType || 'NO_REF'} - ${data.message || '无结果'}`)
  }
}

async function searchViaMatcher() {
  const data = await matcherSearch(catalogQuery.value.trim(), 20)
  catalogResults.value = (data.results || []).map((r) => ({
    catalog_id: `matcher:${r.id}`,
    brand: r.brand || '',
    reference: r.reference || '',
    family: r.modelName || '',
    name: r.modelName || '',
    case_material: '',
    dial_color: '',
    images: [],
    source_engine: 'matcher',
    match_score: r.score,
  }))
}

// --- Historical transactions (enriched with MongoDB prices) ---
const historyTransactions = ref<EnrichedTransaction[]>([])
const historyPriceSummary = ref<PriceSummary | null>(null)
const historyLoading = ref(false)

async function loadHistoryTransactions(catalogId: string) {
  historyLoading.value = true
  historyTransactions.value = []
  historyPriceSummary.value = null
  try {
    const data = await getTransactions(catalogId)
    const filtered = data.transactions.filter((t) => t.source !== 'chrono24')
    historyTransactions.value = filtered
    const prices = filtered
      .map((t) => t.successful_bid_price)
      .filter((p): p is number => p != null)
    historyPriceSummary.value = {
      total_count: filtered.length,
      with_price_count: prices.length,
      avg_price: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : undefined,
      min_price: prices.length ? Math.min(...prices) : undefined,
      max_price: prices.length ? Math.max(...prices) : undefined,
    }
  } catch (e: any) {
    ElMessage.error('加载历史成交失败: ' + (e.response?.data?.error || e.message))
  } finally {
    historyLoading.value = false
  }
}

interface PerSourceStats {
  source: string
  label: string
  count: number
  with_price_count: number
  avg_price: number | null
  min_price: number | null
  max_price: number | null
}

// Sources hidden from the per-source aggregation block
const PER_SOURCE_HIDDEN = new Set(['chrono24'])

const historyPerSourceSummary = computed<PerSourceStats[]>(() => {
  const groups = new Map<string, EnrichedTransaction[]>()
  for (const t of historyTransactions.value) {
    const key = t.source || 'unknown'
    if (PER_SOURCE_HIDDEN.has(key)) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }
  const stats: PerSourceStats[] = []
  for (const [source, txns] of groups.entries()) {
    const prices = txns
      .map((t) => t.successful_bid_price)
      .filter((p): p is number => p != null)
    const label = txns.find((t) => t.source_label)?.source_label || source
    stats.push({
      source,
      label,
      count: txns.length,
      with_price_count: prices.length,
      avg_price: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
      min_price: prices.length ? Math.min(...prices) : null,
      max_price: prices.length ? Math.max(...prices) : null,
    })
  }
  // Sort by sample count desc so the most informative source comes first
  stats.sort((a, b) => b.with_price_count - a.with_price_count)
  return stats
})

function sourceTagType(source: string): 'success' | 'warning' | 'info' {
  if (source === 'starbuyers' || source === 'starbuyer') return 'success'
  if (source === 'ecoauc') return 'warning'
  return 'info'
}

function selectCatalog(item: CatalogItem) {
  selectedCatalog.value = item
  simForm.model_number = item.reference
  // Auto-load historical transactions
  loadHistoryTransactions(item.catalog_id)
}

function clearSelection() {
  selectedCatalog.value = null
  simForm.model_number = ''
  catalogResults.value = []
  catalogQuery.value = ''
  waterfallAttrs.brand = ''
  waterfallAttrs.reference = ''
  waterfallAttrs.dialColor = ''
  waterfallAttrs.caseMaterial = ''
  waterfallAttrs.dialIndex = ''
  discoveryResults.value = []
  historyTransactions.value = []
  historyPriceSummary.value = null
}

// --- Price Discovery ---
const discoveryLoading = ref(false)
const discoveryResults = ref<PriceDiscoveryResult[]>([])
const discoveryPlatforms = ['starbuyer', 'ecoauc', 'yahoo', 'rakuten']

async function runPriceDiscovery() {
  if (!selectedCatalog.value) return
  discoveryLoading.value = true
  discoveryResults.value = []
  try {
    const data = await priceDiscovery({
      brand: selectedCatalog.value.brand,
      reference: selectedCatalog.value.reference,
      model_name: selectedCatalog.value.family || undefined,
      platforms: discoveryPlatforms,
    })
    discoveryResults.value = data.results
  } catch (e: any) {
    ElMessage.error('比价失败: ' + (e.response?.data?.error || e.message))
  } finally {
    discoveryLoading.value = false
  }
}

function matchScoreColor(score: number) {
  if (score >= 0.7) return '#22C55E'
  if (score >= 0.4) return '#F59E0B'
  return '#EF4444'
}

function matchScoreLabel(score: number) {
  if (score >= 0.7) return '高'
  if (score >= 0.4) return '中'
  return '低'
}

function discoveredItemCount() {
  return discoveryResults.value.reduce((sum, r) => sum + r.items.filter(i => i.match_score >= 0.4).length, 0)
}

// --- FX Rates ---
const currencyOptions = ref<CurrencyInfo[]>([
  { code: 'JPY', symbol: '¥', name: '日元' },
  { code: 'CNY', symbol: '¥', name: '人民币' },
  { code: 'EUR', symbol: '€', name: '欧元' },
  { code: 'USD', symbol: '$', name: '美元' },
  { code: 'GBP', symbol: '£', name: '英镑' },
  { code: 'CHF', symbol: 'Fr', name: '瑞郎' },
])
const fxRates = ref<Record<string, number>>({})
const fxConversion = ref<{ input_currency: string; input_amount: number; converted_jpy: number } | null>(null)

async function loadFxRates() {
  try {
    const data = await getFxRates()
    fxRates.value = data.rates
    if (data.currencies?.length) {
      currencyOptions.value = data.currencies
    }
  } catch (_) {}
}

function currencyLabel(code: string) {
  const c = currencyOptions.value.find(c => c.code === code)
  return c ? `${c.symbol} ${c.code}` : code
}

function estimatedJpy() {
  const currency = simForm.currency || 'JPY'
  if (currency === 'JPY' || !simForm.hammer_price) return null
  const rate = fxRates.value[currency]
  if (!rate || rate === 0) return null
  // fxRates is JPY-based: 1 JPY = rate units of currency
  // So amount_currency / rate = amount_jpy
  return Math.round(simForm.hammer_price / rate)
}

// --- Simulate ---
const simForm = reactive<SimulateRequest>({
  model_number: '',
  hammer_price: 0,
  currency: 'JPY',
  condition_rank: 'A',
  has_box: false,
  has_warranty_card: false,
  warranty_place: '',
  warranty_year: undefined,
  defect_type: undefined,
})
type SimSource = 'all' | 'ecoauc' | 'starbuyer'
const simSourceFilter = ref<SimSource>('all')
function matchesSimSource(source: string | undefined, filter: SimSource): boolean {
  if (filter === 'all') return true
  if (filter === 'ecoauc') return source === 'ecoauc'
  if (filter === 'starbuyer') return source === 'starbuyer' || source === 'starbuyers'
  return true
}
const simLoading = ref(false)
const simResults = ref<ValuationResult[]>([])

async function runSimulation() {
  if (!simForm.model_number || simForm.hammer_price <= 0) {
    ElMessage.warning('请先选择型号并输入有效价格')
    return
  }
  simLoading.value = true
  simResults.value = []
  fxConversion.value = null
  try {
    // Pass enriched transactions from Corvus if available (skip MongoDB lookup)
    const txns = historyTransactions.value.length > 0
      ? historyTransactions.value
          .filter(t => t.successful_bid_price != null)
          .filter(t => matchesSimSource(t.source, simSourceFilter.value))
          .map(t => ({
            successful_bid_price: t.successful_bid_price!,
            auction_date: t.auction_date,
            condition_rank: t.condition_rank,
            has_box: t.has_box,
            has_warranty_card: t.has_warranty_card,
          }))
      : undefined
    const data = await simulate({
      ...simForm,
      catalog_id: selectedCatalog.value?.catalog_id || undefined,
      warranty_place: simForm.warranty_place || undefined,
      currency: simForm.currency || 'JPY',
      transactions: txns,
    })
    simResults.value = data.results
    fxConversion.value = data.fx_conversion || null
    if (data.results.length === 0) {
      ElMessage.info('没有配置交易路径')
    }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || e.message)
  } finally {
    simLoading.value = false
  }
}

// --- Signals ---
const signals = ref<TradingSignal[]>([])
const signalLoading = ref(false)
const signalFilter = reactive({
  is_alert: undefined as boolean | undefined,
  acknowledged: undefined as boolean | undefined,
})

async function loadSignals() {
  signalLoading.value = true
  try {
    const data = await listSignals({
      is_alert: signalFilter.is_alert,
      acknowledged: signalFilter.acknowledged,
      limit: 50,
    })
    signals.value = data.signals
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || e.message)
  } finally {
    signalLoading.value = false
  }
}

async function handleAck(id: string) {
  try {
    await ackSignal(id)
    ElMessage.success('已确认')
    loadSignals()
    loadStats()
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

// --- Stats ---
const stats = ref<TradingStats>({ unacknowledged_alerts: 0 })
async function loadStats() {
  try {
    stats.value = await getTradingStats()
  } catch (_) {}
}

// --- Valuation detail dialog ---
const detailVisible = ref(false)
const detailResult = ref<ValuationResult | null>(null)

function showDetail(result: ValuationResult) {
  detailResult.value = result
  detailVisible.value = true
}

// --- Config ---
const configLoading = ref(false)
const configSaving = ref(false)
const configMap = ref<Record<string, TradingPathConfig>>({})
const configPathIds = ref<string[]>([])
const selectedPathId = ref('')
const configForm = ref<TradingPathConfig | null>(null)

async function loadConfigs() {
  configLoading.value = true
  try {
    const data = await getTradingConfigs()
    configMap.value = data.configs
    configPathIds.value = Object.keys(data.configs)
    if (configPathIds.value.length > 0 && !selectedPathId.value) {
      selectedPathId.value = configPathIds.value[0]
    }
    selectConfig(selectedPathId.value)
  } catch (e: any) {
    ElMessage.error('加载配置失败: ' + (e.response?.data?.error || e.message))
  } finally {
    configLoading.value = false
  }
}

function selectConfig(pathId: string) {
  selectedPathId.value = pathId
  const src = configMap.value[pathId]
  if (src) {
    configForm.value = JSON.parse(JSON.stringify(src))
    // Ensure warranty_year_decay sub-object exists
    if (!configForm.value!.revenue.warranty_year_decay) {
      configForm.value!.revenue.warranty_year_decay = {
        recent_years: 3,
        recent_decay_per_year: 0.02,
        old_threshold_years: 10,
        old_decay_per_5years: 0.05,
      }
    }
  } else {
    configForm.value = null
  }
}

async function saveConfig() {
  if (!configForm.value || !selectedPathId.value) return
  configSaving.value = true
  try {
    await updateTradingConfig(selectedPathId.value, configForm.value)
    ElMessage.success('配置已保存')
    // Refresh local cache
    configMap.value[selectedPathId.value] = JSON.parse(JSON.stringify(configForm.value))
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.response?.data?.error || e.message))
  } finally {
    configSaving.value = false
  }
}

// --- Helpers ---
const conditionOptions = ['S', 'A', 'B', 'C', 'J']

function decisionTag(decision: string) {
  switch (decision) {
    case 'alert': return 'danger'
    case 'buy': return 'success'
    case 'skip': return 'info'
    default: return 'warning'
  }
}

function formatPrice(v?: number | null) {
  if (v == null) return '-'
  return `¥${Math.round(v).toLocaleString()}`
}

function formatPercent(v?: number | null) {
  if (v == null) return '-'
  return `${(v * 100).toFixed(1)}%`
}

function levelLabel(level: string) {
  switch (level) {
    case 'L1': return 'L1 精确'
    case 'L2': return 'L2 放宽'
    case 'l3_rank': return 'L3 成色推导'
    case 'l4_accessory': return 'L4 附件推导'
    default: return level
  }
}

// Load on tab switch
function handleTabChange(tab: string) {
  if (tab === 'signals') loadSignals()
  if (tab === 'stats') loadStats()
  if (tab === 'config') loadConfigs()
}

// Initial load
loadStats()
loadFxRates()
</script>

<template>
  <div class="trading-view">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
      <h2 style="margin: 0;">交易策略引擎</h2>
      <el-badge :value="stats.unacknowledged_alerts" :hidden="stats.unacknowledged_alerts === 0" type="danger">
        <el-tag type="danger" size="small">未处理 Alert</el-tag>
      </el-badge>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- Tab 1: 手动试算 -->
      <el-tab-pane label="手动试算" name="simulate">
        <!-- Step 1: Catalog search -->
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Step 1: 识别型号</span>
              <el-tag v-if="selectedCatalog" type="success" closable @close="clearSelection">
                已选: {{ selectedCatalog.brand }} {{ selectedCatalog.reference }}
              </el-tag>
            </div>
          </template>

          <div>
            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
              <el-select v-model="searchEngine" style="width: 220px;">
                <el-option
                  v-for="opt in searchEngineOptions"
                  :key="opt.value"
                  :value="opt.value"
                  :label="opt.label"
                  :disabled="opt.disabled"
                />
              </el-select>
              <!-- 非 Waterfall 模式：单输入框 -->
              <el-input
                v-if="searchEngine !== 'corvus_match'"
                v-model="catalogQuery"
                :placeholder="searchEngine === 'corvus_ref' ? '输入 Reference (如 116610LN, 326934)' : '搜索品牌、型号、名称'"
                @keyup.enter="searchCatalog"
                style="flex: 1;"
              >
                <template #append>
                  <el-button :loading="catalogLoading" @click="searchCatalog">搜索</el-button>
                </template>
              </el-input>
              <!-- Waterfall 模式：品牌 + Reference 分开 -->
              <template v-else>
                <el-input v-model="waterfallAttrs.brand" placeholder="品牌 (如 Rolex)" style="width: 160px;" @keyup.enter="searchCatalog" />
                <el-input v-model="waterfallAttrs.reference" placeholder="Reference (如 116610LN)" style="flex: 1;" @keyup.enter="searchCatalog">
                  <template #append>
                    <el-button :loading="catalogLoading" @click="searchCatalog">搜索</el-button>
                  </template>
                </el-input>
              </template>
            </div>

            <!-- Waterfall 可选属性 -->
            <div v-if="searchEngine === 'corvus_match'" style="display: flex; gap: 12px; margin-bottom: 12px;">
              <el-input v-model="waterfallAttrs.dialColor" placeholder="表盘颜色 (如 Black, Blue)" style="flex: 1;" @keyup.enter="searchCatalog" />
              <el-input v-model="waterfallAttrs.caseMaterial" placeholder="表壳材质 (如 Steel, YG)" style="flex: 1;" @keyup.enter="searchCatalog" />
              <el-input v-model="waterfallAttrs.dialIndex" placeholder="刻度类型 (如 Roman, Arabic)" style="flex: 1;" @keyup.enter="searchCatalog" />
            </div>

            <el-table
              v-if="catalogResults.length > 0"
              :data="catalogResults"
              v-loading="catalogLoading"
              stripe
              size="small"
              max-height="360"
              highlight-current-row
              @row-click="selectCatalog"
              style="cursor: pointer;"
            >
              <el-table-column label="图片" width="60">
                <template #default="{ row }">
                  <img
                    v-if="row.images && row.images.length > 0"
                    :src="row.images[0]"
                    style="width: 40px; height: 40px; object-fit: contain; display: block;"
                    alt=""
                  />
                </template>
              </el-table-column>
              <el-table-column prop="brand" label="品牌" width="100" />
              <el-table-column prop="reference" label="Reference" width="160" />
              <el-table-column prop="family" label="系列" width="140" />
              <el-table-column prop="name" label="名称" min-width="200" show-overflow-tooltip />
              <el-table-column prop="case_material" label="材质" width="120" />
              <el-table-column prop="dial_color" label="表盘色" width="80" />
              <el-table-column label="成交数" width="100" sortable sort-by="starbuyer_count">
                <template #default="{ row }">
                  <template v-if="(row.starbuyer_count ?? 0) > 0 || (row.transaction_count ?? 0) > 0">
                    <span style="font-weight: 600;">{{ row.starbuyer_count ?? 0 }}</span>
                    <span style="color: #999; font-size: 12px;"> / {{ row.transaction_count ?? 0 }}</span>
                  </template>
                  <span v-else style="color: #ccc;">—</span>
                </template>
              </el-table-column>
            </el-table>

            <el-empty v-else-if="catalogQuery && !catalogLoading" description="点击搜索在 Catalog 中查找型号" />
          </div>

        </el-card>

        <!-- Step 2: Historical transactions + Valuation params -->
        <el-card v-if="selectedCatalog" style="margin-top: 16px;" v-loading="historyLoading">
          <template #header>
            <div class="card-header">
              <span>Step 2: 历史成交 & 估值参数</span>
              <el-tag v-if="historyPriceSummary && historyPriceSummary.with_price_count > 0" type="success" size="small">
                {{ historyPriceSummary.with_price_count }} 条有价格 / {{ historyPriceSummary.total_count }} 条总计
              </el-tag>
            </div>
          </template>

          <!-- Price Summary -->
          <div v-if="historyPriceSummary && historyPriceSummary.with_price_count > 0" style="margin-bottom: 16px;">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-statistic title="平均价格" :value="historyPriceSummary.avg_price ? Math.round(historyPriceSummary.avg_price) : 0" prefix="¥" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="最低价" :value="historyPriceSummary.min_price || 0" prefix="¥" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="最高价" :value="historyPriceSummary.max_price || 0" prefix="¥" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="有价格记录" :value="historyPriceSummary.with_price_count" />
              </el-col>
            </el-row>
          </div>

          <!-- Per-source price summary -->
          <div v-if="historyPerSourceSummary.length > 1" style="margin-bottom: 16px;">
            <el-divider content-position="left">分 source 聚合</el-divider>
            <el-row :gutter="12">
              <el-col v-for="s in historyPerSourceSummary" :key="s.source" :span="8" style="margin-bottom: 12px;">
                <el-card shadow="never" body-style="padding: 12px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <el-tag :type="sourceTagType(s.source)" size="small">{{ s.label }}</el-tag>
                    <span style="font-size: 12px; color: #999;">
                      {{ s.with_price_count }} / {{ s.count }} 条
                    </span>
                  </div>
                  <el-row v-if="s.with_price_count > 0" :gutter="8">
                    <el-col :span="12">
                      <el-statistic title="均价" :value="s.avg_price ? Math.round(s.avg_price) : 0" prefix="¥" />
                    </el-col>
                    <el-col :span="12">
                      <el-statistic title="最高" :value="s.max_price || 0" prefix="¥" />
                    </el-col>
                    <el-col :span="12" style="margin-top: 4px;">
                      <el-statistic title="最低" :value="s.min_price || 0" prefix="¥" />
                    </el-col>
                  </el-row>
                  <span v-else style="color: #ccc; font-size: 12px;">无价格数据</span>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <!-- History Transactions Table -->
          <el-table
            v-if="historyTransactions.length > 0"
            :data="historyTransactions"
            stripe
            size="small"
            max-height="300"
            style="margin-bottom: 20px;"
          >
            <el-table-column label="来源" width="110">
              <template #default="{ row }">
                <el-tag size="small" :type="row.source === 'ecoauc' ? 'warning' : row.source === 'starbuyers' ? 'success' : 'info'">
                  {{ row.source_label || row.source || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="auction_date" label="拍卖日期" width="110" sortable />
            <el-table-column label="成交价 (JPY)" width="130" sortable sort-by="successful_bid_price">
              <template #default="{ row }">
                <span v-if="row.successful_bid_price" style="font-weight: 600;">
                  {{ formatPrice(row.successful_bid_price) }}
                </span>
                <span v-else style="color: #ccc;">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="condition_rank" label="成色" width="70" />
            <el-table-column label="配件" width="120">
              <template #default="{ row }">
                <el-tag v-if="row.has_box" size="small" style="margin-right: 2px;">Box</el-tag>
                <el-tag v-if="row.has_warranty_card" size="small">Card</el-tag>
                <span v-if="!row.has_box && !row.has_warranty_card" style="color: #ccc;">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="case_material" label="材质" width="100" />
            <el-table-column prop="dial_color" label="表盘色" width="80" />
            <el-table-column prop="model_number" label="Ref" width="130" />
          </el-table>

          <el-empty v-else-if="!historyLoading && selectedCatalog" description="无历史成交数据" />

          <!-- Simulation Form -->
          <el-divider content-position="left">估值参数</el-divider>
          <el-form :model="simForm" label-width="120px" style="max-width: 600px;">
            <el-form-item label="数据源">
              <el-radio-group v-model="simSourceFilter">
                <el-radio-button value="all">全部</el-radio-button>
                <el-radio-button value="ecoauc">EcoAuc</el-radio-button>
                <el-radio-button value="starbuyer">StarBuyer</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="型号 (Reference)">
              <el-input v-model="simForm.model_number" disabled />
            </el-form-item>
            <el-form-item label="落槌价" required>
              <div style="display: flex; gap: 8px; width: 100%;">
                <el-select v-model="simForm.currency" style="width: 140px;" @change="loadFxRates">
                  <el-option
                    v-for="c in currencyOptions"
                    :key="c.code"
                    :label="`${c.symbol} ${c.code}`"
                    :value="c.code"
                  >
                    <span>{{ c.symbol }} {{ c.code }}</span>
                    <span style="color: #999; margin-left: 8px; font-size: 12px;">{{ c.name }}</span>
                  </el-option>
                </el-select>
                <el-input-number v-model="simForm.hammer_price" :min="0" :step="10000" style="flex: 1;" />
              </div>
              <div v-if="estimatedJpy()" style="font-size: 12px; color: #999; margin-top: 4px;">
                ≈ ¥{{ estimatedJpy()!.toLocaleString() }} JPY
              </div>
            </el-form-item>
            <el-form-item label="成色">
              <el-select v-model="simForm.condition_rank" style="width: 100%;">
                <el-option v-for="c in conditionOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="附件">
              <el-checkbox v-model="simForm.has_box">Box (盒子)</el-checkbox>
              <el-checkbox v-model="simForm.has_warranty_card">Warranty Card (保卡)</el-checkbox>
            </el-form-item>
            <el-form-item label="保修地">
              <el-input v-model="simForm.warranty_place" placeholder="e.g. Japan" />
            </el-form-item>
            <el-form-item label="保修年份">
              <el-input-number v-model="simForm.warranty_year" :min="0" :max="50" placeholder="可选" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="瑕疵类型">
              <el-select v-model="simForm.defect_type" placeholder="可选" clearable style="width: 100%;">
                <el-option label="无" value="none" />
                <el-option label="轻微 (soft)" value="soft" />
                <el-option label="严重 (hard)" value="hard" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="simLoading" :disabled="!simForm.model_number" @click="runSimulation">
                运行估值
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Results -->
        <el-card v-if="simResults.length > 0" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <span>估值结果</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-tag v-if="fxConversion" type="warning" size="small">
                  {{ currencyLabel(fxConversion.input_currency) }} {{ fxConversion.input_amount.toLocaleString() }}
                  → ¥{{ fxConversion.converted_jpy.toLocaleString() }} JPY
                </el-tag>
                <el-tag type="info">{{ simResults.length }} 条路径</el-tag>
              </div>
            </div>
          </template>

          <el-table :data="simResults" stripe>
            <el-table-column prop="path_id" label="交易路径" width="140" />
            <el-table-column label="决策" width="120">
              <template #default="{ row }">
                <el-tag :type="decisionTag(row.decision)" effect="dark">
                  {{ row.decision.toUpperCase() }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="落槌价" width="120">
              <template #default="{ row }">{{ formatPrice(row.cost.hammer_price) }}</template>
            </el-table-column>
            <el-table-column label="总成本" width="120">
              <template #default="{ row }">{{ formatPrice(row.cost.total) }}</template>
            </el-table-column>
            <el-table-column label="预估收入" width="120">
              <template #default="{ row }">{{ formatPrice(row.revenue.estimated_price) }}</template>
            </el-table-column>
            <el-table-column label="利润率" width="100">
              <template #default="{ row }">
                <span :style="{ color: (row.profit_margin ?? 0) > 0.1 ? '#22C55E' : (row.profit_margin ?? 0) > 0 ? '#F59E0B' : '#EF4444' }">
                  {{ formatPercent(row.profit_margin) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="估价级别" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ levelLabel(row.revenue.level) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="置信度" width="90">
              <template #default="{ row }">{{ row.revenue.confidence }}</template>
            </el-table-column>
            <el-table-column label="样本数" width="80" prop="revenue.sample_count" />
            <el-table-column label="" width="80">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="showDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Tab 2: 交易信号 -->
      <el-tab-pane label="交易信号" name="signals">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>信号列表</span>
              <div>
                <el-select v-model="signalFilter.is_alert" placeholder="类型" clearable size="small" style="width: 100px; margin-right: 8px;">
                  <el-option label="Alert" :value="true" />
                  <el-option label="All" :value="undefined" />
                </el-select>
                <el-select v-model="signalFilter.acknowledged" placeholder="状态" clearable size="small" style="width: 120px; margin-right: 8px;">
                  <el-option label="未确认" :value="false" />
                  <el-option label="已确认" :value="true" />
                </el-select>
                <el-button size="small" @click="loadSignals">刷新</el-button>
              </div>
            </div>
          </template>

          <el-table :data="signals" v-loading="signalLoading" stripe empty-text="暂无信号">
            <el-table-column label="决策" width="90">
              <template #default="{ row }">
                <el-tag :type="decisionTag(row.decision)" effect="dark" size="small">
                  {{ row.decision.toUpperCase() }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="model_number" label="型号" width="140" />
            <el-table-column prop="brand" label="品牌" width="100" />
            <el-table-column label="落槌价" width="110">
              <template #default="{ row }">{{ formatPrice(row.hammer_price) }}</template>
            </el-table-column>
            <el-table-column label="预估收入" width="110">
              <template #default="{ row }">{{ formatPrice(row.estimated_revenue) }}</template>
            </el-table-column>
            <el-table-column label="利润率" width="90">
              <template #default="{ row }">
                <span :style="{ color: (row.profit_margin ?? 0) >= 0.1 ? '#22C55E' : '#F59E0B', fontWeight: 600 }">
                  {{ formatPercent(row.profit_margin) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="100" />
            <el-table-column prop="confidence" label="置信度" width="80" />
            <el-table-column prop="path_id" label="路径" width="110" />
            <el-table-column label="时间" width="160">
              <template #default="{ row }">{{ new Date(row.created_at).toLocaleString() }}</template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="!row.acknowledged"
                  text type="success" size="small"
                  @click="handleAck(row._id)"
                >确认</el-button>
                <el-tag v-else type="success" size="small">已确认</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Tab 3: 统计 -->
      <el-tab-pane label="统计" name="stats">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="hover">
              <el-statistic title="未处理 Alert" :value="stats.unacknowledged_alerts">
                <template #suffix>
                  <el-icon style="color: #EF4444;"><WarningFilled /></el-icon>
                </template>
              </el-statistic>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 4: 参数配置 -->
      <el-tab-pane label="参数配置" name="config">
        <el-card v-loading="configLoading">
          <template #header>
            <div class="card-header">
              <span>交易路径配置</span>
              <el-select v-model="selectedPathId" placeholder="选择路径" style="width: 200px;" @change="selectConfig">
                <el-option v-for="pid in configPathIds" :key="pid" :label="pid" :value="pid" />
              </el-select>
            </div>
          </template>

          <template v-if="configForm">
            <el-form :model="configForm" label-width="200px" style="max-width: 700px;">
              <!-- 成本模型 -->
              <el-divider content-position="left">成本模型</el-divider>
              <el-form-item label="买家佣金系数 (buyer_fee_coef)">
                <el-input-number v-model="configForm.cost.buyer_fee_coef" :precision="4" :step="0.01" :min="1" :max="2" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="促销佣金 (buyer_fee_promo)">
                <el-input-number v-model="configForm.cost.buyer_fee_promo" :precision="4" :step="0.01" :min="1" :max="2" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="税率系数 (tax_coef)">
                <el-input-number v-model="configForm.cost.tax_coef" :precision="4" :step="0.01" :min="0" :max="2" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="汇率 (fx_rate)">
                <el-input-number v-model="configForm.cost.fx_rate" :precision="4" :step="0.1" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="国内运费阈值 (JPY)">
                <el-input-number v-model="configForm.cost.domestic_shipping_threshold" :step="100000" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="国内运费 (高)">
                <el-input-number v-model="configForm.cost.domestic_shipping_high" :step="100" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="国内运费 (低)">
                <el-input-number v-model="configForm.cost.domestic_shipping_low" :step="100" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="国际物流 (intl_shipping)">
                <el-input-number v-model="configForm.cost.intl_shipping" :step="100" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="保险费率 (insurance_rate)">
                <el-input-number v-model="configForm.cost.insurance_rate" :precision="4" :step="0.001" :min="0" :max="1" style="width: 100%;" />
              </el-form-item>

              <!-- 收入模型 -->
              <el-divider content-position="left">收入模型</el-divider>
              <el-form-item label="L1 时间窗口 (天)">
                <el-input-number v-model="configForm.revenue.l1_window_days" :step="1" :min="1" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="L2 时间窗口 (天)">
                <el-input-number v-model="configForm.revenue.l2_window_days" :step="1" :min="1" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="L2 时间权重">
                <el-input-number v-model="configForm.revenue.l2_time_weight" :precision="4" :step="0.01" :min="0" :max="1" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="成色提升系数 (rank_up_coef)">
                <el-input-number v-model="configForm.revenue.rank_up_coef" :precision="4" :step="0.01" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="硬伤系数 (hard_defect_coef)">
                <el-input-number v-model="configForm.revenue.hard_defect_coef" :precision="4" :step="0.01" :min="0" :max="1" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="日本保修系数">
                <el-input-number v-model="configForm.revenue.warranty_jp_coef" :precision="4" :step="0.01" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="海外保修系数">
                <el-input-number v-model="configForm.revenue.warranty_overseas_coef" :precision="4" :step="0.01" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="全套溢价 (full_set_premium)">
                <el-input-number v-model="configForm.revenue.full_set_premium" :precision="4" :step="0.01" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="最小样本数">
                <el-input-number v-model="configForm.revenue.min_data_samples" :step="1" :min="1" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="异常值修剪比例">
                <el-input-number v-model="configForm.revenue.outlier_trim_pct" :precision="4" :step="0.01" :min="0" :max="0.5" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="卖家费率 (seller_fee_rate)">
                <el-input-number v-model="configForm.revenue.seller_fee_rate" :precision="4" :step="0.01" :min="0" :max="1" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="卖家税率 (seller_tax_coef)">
                <el-input-number v-model="configForm.revenue.seller_tax_coef" :precision="4" :step="0.01" :min="0" :max="1" style="width: 100%;" />
              </el-form-item>

              <!-- 保修年衰减 -->
              <el-divider content-position="left" style="margin-left: 20px;">保修年衰减 (warranty_year_decay)</el-divider>
              <template v-if="configForm.revenue.warranty_year_decay">
                <el-form-item label="近期年限 (recent_years)">
                  <el-input-number v-model="configForm.revenue.warranty_year_decay.recent_years" :step="1" :min="0" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="近期年衰减率">
                  <el-input-number v-model="configForm.revenue.warranty_year_decay.recent_decay_per_year" :precision="4" :step="0.01" :min="0" :max="1" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="老旧阈值 (年)">
                  <el-input-number v-model="configForm.revenue.warranty_year_decay.old_threshold_years" :step="1" :min="0" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="老旧每5年衰减率">
                  <el-input-number v-model="configForm.revenue.warranty_year_decay.old_decay_per_5years" :precision="4" :step="0.01" :min="0" :max="1" style="width: 100%;" />
                </el-form-item>
              </template>

              <!-- 决策阈值 -->
              <el-divider content-position="left">决策阈值</el-divider>
              <el-form-item label="目标利润率 (target_margin)">
                <el-input-number v-model="configForm.decision.target_margin" :precision="4" :step="0.01" :min="0" :max="1" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="Alert 利润率 (alert_margin)">
                <el-input-number v-model="configForm.decision.alert_margin" :precision="4" :step="0.01" :min="0" :max="1" style="width: 100%;" />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" :loading="configSaving" @click="saveConfig">保存配置</el-button>
              </el-form-item>
            </el-form>
          </template>

          <el-empty v-else-if="!configLoading" description="暂无配置数据" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="估值详情" width="750px" destroy-on-close>
      <template v-if="detailResult">
        <!-- Cost Breakdown -->
        <h4 style="margin-bottom: 12px;">成本分解</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="落槌价">{{ formatPrice(detailResult.cost.hammer_price) }}</el-descriptions-item>
          <el-descriptions-item label="采购成本 (含佣金+税)">{{ formatPrice(detailResult.cost.acquisition_cost) }}</el-descriptions-item>
          <el-descriptions-item label="国内运费">{{ formatPrice(detailResult.cost.domestic_shipping) }}</el-descriptions-item>
          <el-descriptions-item label="国际物流">{{ formatPrice(detailResult.cost.intl_shipping) }}</el-descriptions-item>
          <el-descriptions-item label="保险">{{ formatPrice(detailResult.cost.insurance) }}</el-descriptions-item>
          <el-descriptions-item label="总成本">
            <span style="font-weight: 700; color: #EF4444;">{{ formatPrice(detailResult.cost.total) }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- Revenue Estimate -->
        <h4 style="margin: 20px 0 12px;">收入估算</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="预估价格">
            <span style="font-weight: 700; color: #22C55E;">{{ formatPrice(detailResult.revenue.estimated_price) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="估价级别">{{ levelLabel(detailResult.revenue.level) }}</el-descriptions-item>
          <el-descriptions-item label="置信度">{{ detailResult.revenue.confidence }}</el-descriptions-item>
          <el-descriptions-item label="样本数">{{ detailResult.revenue.sample_count }}</el-descriptions-item>
        </el-descriptions>

        <!-- Level Attempts -->
        <h4 style="margin: 20px 0 12px;">回退日志 ({{ detailResult.revenue.attempts.length }} 级)</h4>
        <el-collapse>
          <el-collapse-item
            v-for="(attempt, i) in detailResult.revenue.attempts"
            :key="i"
            :name="i"
          >
            <template #title>
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-tag :type="attempt.hit ? 'success' : 'danger'" size="small">
                  {{ attempt.hit ? 'HIT' : 'MISS' }}
                </el-tag>
                <span>{{ levelLabel(attempt.level) }}</span>
                <span style="color: #999; font-size: 12px;">
                  样本: {{ attempt.samples_found }} → {{ attempt.samples_after_trim }} (需 ≥ {{ attempt.min_required }})
                </span>
              </div>
            </template>

            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="查询型号">{{ attempt.query_params.model_number }}</el-descriptions-item>
              <el-descriptions-item label="成色">{{ attempt.query_params.condition_rank ?? '不限' }}</el-descriptions-item>
              <el-descriptions-item label="附件">{{ attempt.query_params.accessories_filter ?? '不限' }}</el-descriptions-item>
              <el-descriptions-item label="时间窗口">{{ attempt.query_params.window_days }} 天</el-descriptions-item>
              <el-descriptions-item label="原始均价">{{ formatPrice(attempt.raw_avg) }}</el-descriptions-item>
              <el-descriptions-item v-if="attempt.miss_reason" label="未命中原因">
                <span style="color: #EF4444;">{{ attempt.miss_reason }}</span>
              </el-descriptions-item>
              <el-descriptions-item v-if="attempt.final_price" label="调整后价格">
                <span style="font-weight: 600;">{{ formatPrice(attempt.final_price) }}</span>
              </el-descriptions-item>
            </el-descriptions>

            <div v-if="attempt.adjustments_applied.length > 0" style="margin-top: 8px;">
              <el-tag v-for="adj in attempt.adjustments_applied" :key="adj.name" size="small" style="margin-right: 4px;">
                {{ adj.name }}: ×{{ adj.factor.toFixed(3) }}
              </el-tag>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- Summary -->
        <el-divider />
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 14px;">利润率: </span>
            <span :style="{ fontSize: '24px', fontWeight: 700, color: (detailResult.profit_margin ?? 0) >= 0.1 ? '#22C55E' : (detailResult.profit_margin ?? 0) > 0 ? '#F59E0B' : '#EF4444' }">
              {{ formatPercent(detailResult.profit_margin) }}
            </span>
          </div>
          <el-tag :type="decisionTag(detailResult.decision)" effect="dark" size="large">
            {{ detailResult.decision.toUpperCase() }}
          </el-tag>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.trading-view {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>

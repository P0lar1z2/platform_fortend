<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getCorvusHealth,
  corvusMatch,
  queryByRef,
  queryById,
  type CorvusMatchResponse,
} from '@/api/corvus'

// Health
const healthData = ref<any>(null)
const healthLoading = ref(false)

// Match test
const matchForm = ref({
  source: 'starbuyer',
  brand: '',
  modelNumber: '',
  dialColor: '',
  caseMaterial: '',
})
const matchResult = ref<CorvusMatchResponse | null>(null)
const matchLoading = ref(false)

// Ref query
const refInput = ref('')
const refResult = ref<any>(null)
const refLoading = ref(false)

// ID query
const idInput = ref('')
const idResult = ref<any>(null)
const idLoading = ref(false)

// Active tab
const activeTab = ref('match')

const sources = [
  { label: 'StarBuyer', value: 'starbuyer' },
  { label: 'EcoAuc', value: 'ecoauc' },
  { label: 'Yahoo Auctions', value: 'yahoo_auctions' },
  { label: 'Rakuten', value: 'rakuten' },
]

async function loadHealth() {
  healthLoading.value = true
  try {
    healthData.value = await getCorvusHealth()
  } catch (e: any) {
    healthData.value = null
  } finally {
    healthLoading.value = false
  }
}

async function handleMatch() {
  matchLoading.value = true
  try {
    matchResult.value = await corvusMatch({
      source: matchForm.value.source,
      brand: matchForm.value.brand || undefined,
      modelNumber: matchForm.value.modelNumber || undefined,
      dialColor: matchForm.value.dialColor || undefined,
      caseMaterial: matchForm.value.caseMaterial || undefined,
    })
  } catch (e: any) {
    ElMessage.error(e.message || 'Match failed')
  } finally {
    matchLoading.value = false
  }
}

async function handleRefQuery() {
  if (!refInput.value.trim()) {
    ElMessage.warning('Please enter a reference')
    return
  }
  refLoading.value = true
  try {
    refResult.value = await queryByRef(refInput.value)
  } catch (e: any) {
    ElMessage.error(e.message || 'Query failed')
  } finally {
    refLoading.value = false
  }
}

async function handleIdQuery() {
  if (!idInput.value.trim()) {
    ElMessage.warning('Please enter a catalog ID')
    return
  }
  idLoading.value = true
  try {
    idResult.value = await queryById(idInput.value)
  } catch (e: any) {
    ElMessage.error(e.message || 'Query failed')
  } finally {
    idLoading.value = false
  }
}

onMounted(() => {
  loadHealth()
})
</script>

<template>
  <div class="corvus-view">
    <h2>Corvus Service</h2>

    <!-- Health Status -->
    <el-card v-loading="healthLoading" shadow="hover" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>Health Status</span>
          <el-button text type="primary" @click="loadHealth">Refresh</el-button>
        </div>
      </template>
      <template v-if="healthData">
        <el-descriptions :column="3" size="small">
          <el-descriptions-item
            v-for="(value, key) in healthData"
            :key="String(key)"
            :label="String(key)"
          >
            <el-tag
              v-if="typeof value === 'boolean' || value === 'ok' || value === 'connected' || value === 'healthy'"
              :type="value === true || value === 'ok' || value === 'connected' || value === 'healthy' ? 'success' : 'danger'"
              size="small"
            >
              {{ value }}
            </el-tag>
            <span v-else>{{ value }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <el-empty v-else description="Service unavailable" :image-size="60" />
    </el-card>

    <!-- Tabs -->
    <el-card shadow="hover">
      <el-tabs v-model="activeTab">
        <!-- Match Test -->
        <el-tab-pane label="Match Test" name="match">
          <el-form label-width="120px" style="max-width: 500px; margin-top: 16px">
            <el-form-item label="Source">
              <el-select v-model="matchForm.source">
                <el-option
                  v-for="s in sources"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="Brand">
              <el-input v-model="matchForm.brand" placeholder="e.g. Rolex" />
            </el-form-item>
            <el-form-item label="Model Number">
              <el-input v-model="matchForm.modelNumber" placeholder="e.g. 126610LN" />
            </el-form-item>
            <el-form-item label="Dial Color">
              <el-input v-model="matchForm.dialColor" placeholder="e.g. Black" />
            </el-form-item>
            <el-form-item label="Case Material">
              <el-input v-model="matchForm.caseMaterial" placeholder="e.g. Steel" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="matchLoading" @click="handleMatch">Match</el-button>
            </el-form-item>
          </el-form>

          <el-card v-if="matchResult" shadow="never" style="margin-top: 16px; background: var(--el-fill-color-light)">
            <el-descriptions :column="2" size="small" border>
              <el-descriptions-item label="Matched">
                <el-tag :type="matchResult.matched ? 'success' : 'info'" size="small">
                  {{ matchResult.matched ? 'Yes' : 'No' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Category ID">{{ matchResult.categoryId || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="Match Type">{{ matchResult.matchType || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="Confidence">
                {{ matchResult.confidence != null ? matchResult.confidence.toFixed(4) : 'N/A' }}
              </el-descriptions-item>
              <el-descriptions-item label="Message" :span="2">{{ matchResult.message || 'N/A' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-tab-pane>

        <!-- Ref Query -->
        <el-tab-pane label="Ref Query" name="ref">
          <el-form :inline="true" style="margin-top: 16px" @submit.prevent="handleRefQuery">
            <el-form-item label="Reference">
              <el-input
                v-model="refInput"
                placeholder="e.g. 126610LN"
                style="width: 300px"
                @keyup.enter="handleRefQuery"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="refLoading" @click="handleRefQuery">Query</el-button>
            </el-form-item>
          </el-form>

          <template v-if="refResult">
            <el-table v-if="Array.isArray(refResult)" :data="refResult" stripe border size="small" style="margin-top: 16px">
              <el-table-column prop="catalog_id" label="Catalog ID" width="120" />
              <el-table-column prop="brand" label="Brand" width="120" />
              <el-table-column prop="model_name" label="Model" width="180" />
              <el-table-column prop="reference" label="Reference" width="140" />
              <el-table-column prop="case_material" label="Case Material" width="140" />
              <el-table-column prop="dial_color" label="Dial Color" width="120" />
            </el-table>
            <el-card v-else shadow="never" style="margin-top: 16px">
              <pre style="white-space: pre-wrap; word-break: break-all; font-size: 12px;">{{ JSON.stringify(refResult, null, 2) }}</pre>
            </el-card>
          </template>
        </el-tab-pane>

        <!-- ID Query -->
        <el-tab-pane label="ID Query" name="id">
          <el-form :inline="true" style="margin-top: 16px" @submit.prevent="handleIdQuery">
            <el-form-item label="Catalog ID">
              <el-input
                v-model="idInput"
                placeholder="Enter catalog ID"
                style="width: 300px"
                @keyup.enter="handleIdQuery"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="idLoading" @click="handleIdQuery">Query</el-button>
            </el-form-item>
          </el-form>

          <el-card v-if="idResult" shadow="never" style="margin-top: 16px">
            <pre style="white-space: pre-wrap; word-break: break-all; font-size: 12px;">{{ JSON.stringify(idResult, null, 2) }}</pre>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.corvus-view {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

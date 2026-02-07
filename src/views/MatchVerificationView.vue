<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWatchesStore } from '@/stores'
import type { SearchQuery } from '@/api/types'

const router = useRouter()
const watchesStore = useWatchesStore()

const searchType = ref<'brand' | 'keywords'>('brand')
const brand = ref('')
const keywords = ref('')

function handleSearch() {
  const query: SearchQuery = { limit: 50 }
  if (searchType.value === 'brand' && brand.value.trim()) {
    query.brand = brand.value.trim()
  } else if (searchType.value === 'keywords' && keywords.value.trim()) {
    query.keywords = keywords.value.trim()
  } else {
    return
  }
  watchesStore.search(query)
}

function viewMatchDetail(traceId: string) {
  router.push(`/matches/${traceId}`)
}
</script>

<template>
  <div class="match-verification-view">
    <div class="content">
      <el-card class="search-card">
        <el-form :inline="true" @submit.prevent="handleSearch">
          <el-form-item label="Search by">
            <el-radio-group v-model="searchType">
              <el-radio-button value="brand">Brand</el-radio-button>
              <el-radio-button value="keywords">Keywords</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="searchType === 'brand'" label="Brand">
            <el-input
              v-model="brand"
              placeholder="e.g., Rolex"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item v-else label="Keywords">
            <el-input
              v-model="keywords"
              placeholder="e.g., submariner"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              Search Watches
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-alert
        v-if="watchesStore.error"
        :title="watchesStore.error"
        type="error"
        show-icon
        closable
        class="error-alert"
        @close="watchesStore.clearError"
      />

      <el-card v-if="watchesStore.watches.length > 0 || watchesStore.loading">
        <template #header>
          <div class="card-header">
            <span>Select a watch to verify matches</span>
            <el-tag type="info">{{ watchesStore.watches.length }} items</el-tag>
          </div>
        </template>

        <el-table
          v-loading="watchesStore.loading"
          :data="watchesStore.watches"
          stripe
          @row-click="(row) => viewMatchDetail(row.trace_id)"
          style="cursor: pointer"
        >
          <el-table-column prop="brand" label="Brand" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.brand" type="primary" size="small">{{ row.brand }}</el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>

          <el-table-column prop="model_name" label="Model" min-width="150">
            <template #default="{ row }">
              {{ row.model_name || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="reference_number" label="Reference" width="140">
            <template #default="{ row }">
              <code v-if="row.reference_number">{{ row.reference_number }}</code>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>

          <el-table-column prop="source" label="Source" width="100">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ row.source }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Action" width="120" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="success" @click.stop="viewMatchDetail(row.trace_id)">
                <el-icon><Connection /></el-icon>
                Verify
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-empty v-else description="Search for watches to verify their match results" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.match-verification-view {
  .page-title {
    font-weight: 600;
  }

  .search-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-alert {
    margin-bottom: 20px;
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

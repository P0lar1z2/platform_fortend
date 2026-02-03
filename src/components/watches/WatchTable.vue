<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { UnifiedWatch } from '@/types'
import { formatPrice, formatDateShort, truncateText } from '@/utils/formatters'

defineProps<{
  watches: UnifiedWatch[]
  loading: boolean
}>()

const router = useRouter()

function viewDetail(watch: UnifiedWatch) {
  router.push(`/watches/${watch.trace_id}`)
}

function viewTrace(watch: UnifiedWatch) {
  router.push(`/traces/${watch.trace_id}`)
}

function viewMatches(watch: UnifiedWatch) {
  router.push(`/matches/${watch.trace_id}`)
}
</script>

<template>
  <el-table :data="watches" v-loading="loading" stripe style="width: 100%">
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

    <el-table-column prop="raw_title" label="Title" min-width="200">
      <template #default="{ row }">
        <el-tooltip
          v-if="row.raw_title"
          :content="row.raw_title"
          placement="top"
          :show-after="500"
        >
          <span>{{ truncateText(row.raw_title, 50) }}</span>
        </el-tooltip>
        <span v-else class="text-muted">-</span>
      </template>
    </el-table-column>

    <el-table-column prop="price" label="Price" width="120">
      <template #default="{ row }">
        {{ formatPrice(row.price?.amount, row.price?.currency) }}
      </template>
    </el-table-column>

    <el-table-column prop="source" label="Source" width="100">
      <template #default="{ row }">
        <el-tag type="info" size="small">{{ row.source }}</el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="created_at" label="Created" width="110">
      <template #default="{ row }">
        {{ formatDateShort(row.created_at) }}
      </template>
    </el-table-column>

    <el-table-column label="Actions" width="180" fixed="right">
      <template #default="{ row }">
        <el-button-group size="small">
          <el-button type="primary" @click="viewDetail(row)">
            <el-icon><View /></el-icon>
          </el-button>
          <el-button @click="viewTrace(row)">
            <el-icon><List /></el-icon>
          </el-button>
          <el-button type="success" @click="viewMatches(row)">
            <el-icon><Connection /></el-icon>
          </el-button>
        </el-button-group>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="scss">
.text-muted {
  color: #909399;
}

code {
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>

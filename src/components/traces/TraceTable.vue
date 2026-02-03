<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Trace } from '@/types'
import { formatDate, getStatusType, getStageLabel } from '@/utils/formatters'

defineProps<{
  traces: Trace[]
  loading: boolean
}>()

const router = useRouter()

function viewDetail(trace: Trace) {
  router.push(`/traces/${trace.trace_id}`)
}
</script>

<template>
  <el-table :data="traces" v-loading="loading" stripe style="width: 100%">
    <el-table-column prop="trace_id" label="Trace ID" min-width="280">
      <template #default="{ row }">
        <code>{{ row.trace_id }}</code>
      </template>
    </el-table-column>

    <el-table-column prop="source" label="Source" width="100">
      <template #default="{ row }">
        <el-tag type="info" size="small">{{ row.source }}</el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="current_stage" label="Stage" width="100">
      <template #default="{ row }">
        <el-tag type="primary" size="small">{{ getStageLabel(row.current_stage) }}</el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="status" label="Status" width="110">
      <template #default="{ row }">
        <el-tag :type="getStatusType(row.status)" effect="dark" size="small">
          {{ row.status }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="retry_count" label="Retries" width="80">
      <template #default="{ row }">
        <span :class="{ 'text-danger': row.retry_count > 0 }">
          {{ row.retry_count }}/{{ row.max_retries }}
        </span>
      </template>
    </el-table-column>

    <el-table-column prop="created_at" label="Created" width="170">
      <template #default="{ row }">
        {{ formatDate(row.created_at) }}
      </template>
    </el-table-column>

    <el-table-column label="Actions" width="100" fixed="right">
      <template #default="{ row }">
        <el-button type="primary" size="small" @click="viewDetail(row)">
          <el-icon><View /></el-icon>
          Detail
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="scss">
code {
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.text-danger {
  color: #f56c6c;
}
</style>

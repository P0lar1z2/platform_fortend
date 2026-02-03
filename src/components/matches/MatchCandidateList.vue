<script setup lang="ts">
import type { MatchCandidate } from '@/types'
import { formatConfidence } from '@/utils/formatters'

defineProps<{
  candidates: MatchCandidate[]
  verifiedReferenceId?: string | null
  selectable?: boolean
}>()

const emit = defineEmits<{
  select: [candidate: MatchCandidate]
}>()

function getConfidenceType(confidence: number): 'success' | 'warning' | 'danger' {
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.5) return 'warning'
  return 'danger'
}

function handleSelect(candidate: MatchCandidate) {
  emit('select', candidate)
}
</script>

<template>
  <div class="match-candidate-list">
    <el-table :data="candidates" stripe>
      <el-table-column prop="brand" label="Brand" width="120">
        <template #default="{ row }">
          <el-tag type="primary" size="small">{{ row.brand }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="model" label="Model" min-width="150" />

      <el-table-column prop="reference" label="Reference" width="140">
        <template #default="{ row }">
          <code>{{ row.reference }}</code>
        </template>
      </el-table-column>

      <el-table-column prop="confidence" label="Confidence" width="120">
        <template #default="{ row }">
          <el-tag :type="getConfidenceType(row.confidence)" effect="plain">
            {{ formatConfidence(row.confidence) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="match_reasons" label="Match Reasons" min-width="200">
        <template #default="{ row }">
          <div class="reasons">
            <el-tag
              v-for="reason in row.match_reasons"
              :key="reason"
              type="info"
              size="small"
            >
              {{ reason }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Status" width="100">
        <template #default="{ row }">
          <el-tag
            v-if="verifiedReferenceId === row.reference_id"
            type="success"
            effect="dark"
          >
            Verified
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column v-if="selectable" label="Action" width="100" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            type="primary"
            :disabled="verifiedReferenceId === row.reference_id"
            @click="handleSelect(row)"
          >
            Select
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.match-candidate-list {
  code {
    background-color: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }

  .reasons {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}
</style>

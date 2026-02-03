<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MatchCandidate, MatchResult } from '@/types'

const props = defineProps<{
  matchResult: MatchResult
  selectedCandidate?: MatchCandidate | null
  loading?: boolean
}>()

const emit = defineEmits<{
  verify: [{ algorithm: string; reference_id: string; verified_by: string }]
  cancel: []
}>()

const verifiedBy = ref('')

const canVerify = computed(() => {
  return props.selectedCandidate && verifiedBy.value.trim().length > 0
})

function handleVerify() {
  if (!props.selectedCandidate) return

  emit('verify', {
    algorithm: props.matchResult.algorithm,
    reference_id: props.selectedCandidate.reference_id,
    verified_by: verifiedBy.value.trim(),
  })
}

function handleCancel() {
  verifiedBy.value = ''
  emit('cancel')
}
</script>

<template>
  <el-card class="verification-form">
    <template #header>
      <span>Verification</span>
    </template>

    <el-form label-width="120px">
      <el-form-item label="Algorithm">
        <el-input :model-value="matchResult.algorithm" disabled />
      </el-form-item>

      <el-form-item label="Selected">
        <div v-if="selectedCandidate" class="selected-candidate">
          <el-tag type="primary">{{ selectedCandidate.brand }}</el-tag>
          <span>{{ selectedCandidate.model }}</span>
          <code>{{ selectedCandidate.reference }}</code>
        </div>
        <span v-else class="text-muted">No candidate selected</span>
      </el-form-item>

      <el-form-item label="Verified By" required>
        <el-input
          v-model="verifiedBy"
          placeholder="Enter your name or ID"
          clearable
        />
      </el-form-item>

      <el-form-item>
        <el-space>
          <el-button
            type="primary"
            :loading="loading"
            :disabled="!canVerify"
            @click="handleVerify"
          >
            <el-icon><Check /></el-icon>
            Confirm Verification
          </el-button>
          <el-button @click="handleCancel">Cancel</el-button>
        </el-space>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.verification-form {
  .selected-candidate {
    display: flex;
    align-items: center;
    gap: 8px;
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

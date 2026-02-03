<script setup lang="ts">
import { ref } from 'vue'
import type { PipelineStage } from '@/types'
import { PIPELINE_STAGES } from '@/types'
import { getStageLabel } from '@/utils/formatters'

defineProps<{
  visible: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [stage: PipelineStage]
}>()

const selectedStage = ref<PipelineStage>('crawl')

function handleClose() {
  emit('update:visible', false)
}

function handleConfirm() {
  emit('confirm', selectedStage.value)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="Replay Trace"
    width="500px"
    @update:model-value="emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form label-width="120px">
      <el-form-item label="Replay From">
        <el-select v-model="selectedStage" style="width: 100%">
          <el-option
            v-for="stage in PIPELINE_STAGES"
            :key="stage"
            :label="getStageLabel(stage)"
            :value="stage"
          />
        </el-select>
      </el-form-item>

      <el-alert
        type="warning"
        :closable="false"
        show-icon
      >
        <template #title>
          This will create a new trace starting from the selected stage with the original source data.
        </template>
      </el-alert>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Cancel</el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">
        <el-icon><RefreshRight /></el-icon>
        Start Replay
      </el-button>
    </template>
  </el-dialog>
</template>

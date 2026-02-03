<script setup lang="ts">
import { computed } from 'vue'
import type { Trace, StageSnapshot } from '@/types'
import { PIPELINE_STAGES, getStageIndex } from '@/types'
import { formatDuration, getStageLabel, getSnapshotStatusType } from '@/utils/formatters'

const props = defineProps<{
  trace: Trace
  snapshots: StageSnapshot[]
}>()

const currentStageIndex = computed(() => getStageIndex(props.trace.current_stage))

function getSnapshotForStage(stage: string): StageSnapshot | undefined {
  return props.snapshots.find((s) => s.stage === stage)
}

function getStageStatus(stageIndex: number): 'completed' | 'current' | 'pending' | 'failed' {
  if (props.trace.status === 'failed' && stageIndex === currentStageIndex.value) {
    return 'failed'
  }
  if (stageIndex < currentStageIndex.value) {
    return 'completed'
  }
  if (stageIndex === currentStageIndex.value) {
    return 'current'
  }
  return 'pending'
}

function getIconForStatus(status: string): string {
  switch (status) {
    case 'completed':
      return 'CircleCheck'
    case 'current':
      return 'Loading'
    case 'failed':
      return 'CircleClose'
    default:
      return 'Clock'
  }
}

function getColorForStatus(status: string): string {
  switch (status) {
    case 'completed':
      return '#67c23a'
    case 'current':
      return '#409eff'
    case 'failed':
      return '#f56c6c'
    default:
      return '#909399'
  }
}
</script>

<template>
  <div class="trace-timeline">
    <el-timeline>
      <el-timeline-item
        v-for="(stage, index) in PIPELINE_STAGES"
        :key="stage"
        :color="getColorForStatus(getStageStatus(index))"
        :icon="getIconForStatus(getStageStatus(index))"
        :hollow="getStageStatus(index) === 'pending'"
      >
        <div class="stage-item">
          <div class="stage-header">
            <span class="stage-name">{{ getStageLabel(stage) }}</span>
            <el-tag
              v-if="getStageStatus(index) !== 'pending'"
              :type="getStageStatus(index) === 'failed' ? 'danger' : getStageStatus(index) === 'current' ? 'warning' : 'success'"
              size="small"
            >
              {{ getStageStatus(index) }}
            </el-tag>
          </div>

          <template v-if="getSnapshotForStage(stage)">
            <div class="stage-details">
              <el-descriptions :column="3" size="small" border>
                <el-descriptions-item label="Algorithm Version">
                  {{ getSnapshotForStage(stage)?.algorithm_version }}
                </el-descriptions-item>
                <el-descriptions-item label="Duration">
                  {{ formatDuration(getSnapshotForStage(stage)?.duration_ms ?? null) }}
                </el-descriptions-item>
                <el-descriptions-item label="Status">
                  <el-tag
                    :type="getSnapshotStatusType(getSnapshotForStage(stage)!.status)"
                    size="small"
                  >
                    {{ getSnapshotForStage(stage)?.status }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <div v-if="getSnapshotForStage(stage)?.error_message" class="error-message">
                <el-alert
                  :title="getSnapshotForStage(stage)?.error_message || ''"
                  type="error"
                  :closable="false"
                  show-icon
                />
              </div>
            </div>
          </template>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<style scoped lang="scss">
.trace-timeline {
  .stage-item {
    .stage-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .stage-name {
      font-weight: 600;
      font-size: 16px;
    }

    .stage-details {
      margin-top: 8px;
    }

    .error-message {
      margin-top: 8px;
    }
  }
}
</style>

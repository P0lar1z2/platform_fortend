<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useTracesStore } from '@/stores'
import type { PipelineStage } from '@/types'
import { formatDate, getStatusType, getStageLabel } from '@/utils/formatters'
import TraceTimeline from '@/components/traces/TraceTimeline.vue'
import SnapshotViewer from '@/components/traces/SnapshotViewer.vue'
import ReplayDialog from '@/components/traces/ReplayDialog.vue'

const route = useRoute()
const router = useRouter()
const tracesStore = useTracesStore()

const traceId = route.params.traceId as string
const showReplayDialog = ref(false)

onMounted(async () => {
  await Promise.all([
    tracesStore.fetchTrace(traceId),
    tracesStore.fetchSnapshots(traceId),
  ])
})

watch(
  () => route.params.traceId,
  async (newId) => {
    if (newId) {
      await Promise.all([
        tracesStore.fetchTrace(newId as string),
        tracesStore.fetchSnapshots(newId as string),
      ])
    }
  }
)

async function handleReplay(stage: PipelineStage) {
  const newTrace = await tracesStore.replay(traceId, { from_stage: stage })
  if (newTrace) {
    ElMessage.success('Replay started successfully')
    showReplayDialog.value = false
    router.push(`/traces/${newTrace.trace_id}`)
  }
}

function goToWatch() {
  router.push(`/watches/${traceId}`)
}

function goToMatches() {
  router.push(`/matches/${traceId}`)
}
</script>

<template>
  <div class="trace-detail-view">
    <el-page-header @back="$router.push('/traces')">
      <template #content>
        <span class="page-title">Trace Detail</span>
      </template>
      <template #extra>
        <el-space>
          <el-button @click="goToWatch">
            <el-icon><Goods /></el-icon>
            View Watch
          </el-button>
          <el-button type="success" @click="goToMatches">
            <el-icon><Connection /></el-icon>
            View Matches
          </el-button>
          <el-button type="warning" @click="showReplayDialog = true">
            <el-icon><RefreshRight /></el-icon>
            Replay
          </el-button>
        </el-space>
      </template>
    </el-page-header>

    <div class="content">
      <el-alert
        v-if="tracesStore.error"
        :title="tracesStore.error"
        type="error"
        show-icon
        closable
        class="error-alert"
        @close="tracesStore.clearError"
      />

      <div v-loading="tracesStore.loading">
        <template v-if="tracesStore.currentTrace">
          <!-- Trace Info -->
          <el-card class="info-card">
            <template #header>
              <span>Trace Information</span>
            </template>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="Trace ID">
                <code>{{ tracesStore.currentTrace.trace_id }}</code>
              </el-descriptions-item>
              <el-descriptions-item label="Status">
                <el-tag :type="getStatusType(tracesStore.currentTrace.status)" effect="dark">
                  {{ tracesStore.currentTrace.status }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Current Stage">
                <el-tag type="primary">
                  {{ getStageLabel(tracesStore.currentTrace.current_stage) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Source">
                <el-tag type="info">{{ tracesStore.currentTrace.source }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Source Item ID">
                <code>{{ tracesStore.currentTrace.source_item_id }}</code>
              </el-descriptions-item>
              <el-descriptions-item label="Source URL">
                <el-link
                  v-if="tracesStore.currentTrace.source_url"
                  :href="tracesStore.currentTrace.source_url"
                  target="_blank"
                  type="primary"
                >
                  View Source
                </el-link>
                <span v-else class="text-muted">-</span>
              </el-descriptions-item>
              <el-descriptions-item label="Retries">
                <span :class="{ 'text-danger': tracesStore.currentTrace.retry_count > 0 }">
                  {{ tracesStore.currentTrace.retry_count }}/{{ tracesStore.currentTrace.max_retries }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="Created At">
                {{ formatDate(tracesStore.currentTrace.created_at) }}
              </el-descriptions-item>
              <el-descriptions-item label="Completed At">
                {{ formatDate(tracesStore.currentTrace.completed_at) }}
              </el-descriptions-item>
            </el-descriptions>

            <el-alert
              v-if="tracesStore.currentTrace.error_message"
              :title="tracesStore.currentTrace.error_message"
              type="error"
              :closable="false"
              show-icon
              class="error-message"
            />
          </el-card>

          <!-- Pipeline Timeline -->
          <el-card class="timeline-card">
            <template #header>
              <span>Pipeline Progress</span>
            </template>
            <TraceTimeline
              :trace="tracesStore.currentTrace"
              :snapshots="tracesStore.snapshots"
            />
          </el-card>

          <!-- Snapshots -->
          <el-card v-if="tracesStore.snapshots.length > 0" class="snapshots-card">
            <template #header>
              <span>Stage Snapshots</span>
            </template>
            <SnapshotViewer :snapshots="tracesStore.snapshots" />
          </el-card>
        </template>

        <el-empty v-else-if="!tracesStore.loading" description="Trace not found" />
      </div>
    </div>

    <ReplayDialog
      v-model:visible="showReplayDialog"
      :loading="tracesStore.loading"
      @confirm="handleReplay"
    />
  </div>
</template>

<style scoped lang="scss">
.trace-detail-view {
  .page-title {
    font-weight: 600;
  }

  .content {
    margin-top: 20px;
  }

  .error-alert {
    margin-bottom: 20px;
  }

  .info-card,
  .timeline-card,
  .snapshots-card {
    margin-bottom: 20px;
  }

  .error-message {
    margin-top: 16px;
  }

  .text-muted {
    color: #909399;
  }

  .text-danger {
    color: #f56c6c;
  }

  code {
    background-color: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }
}
</style>

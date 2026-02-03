<script setup lang="ts">
import { ref, computed } from 'vue'
import type { StageSnapshot } from '@/types'
import { formatDate, formatDuration, getSnapshotStatusType } from '@/utils/formatters'

const props = defineProps<{
  snapshots: StageSnapshot[]
}>()

const activeTab = ref(props.snapshots[0]?.stage || '')

const sortedSnapshots = computed(() => {
  const stageOrder = ['crawl', 'enrich', 'clean', 'match', 'decide']
  return [...props.snapshots].sort(
    (a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage)
  )
})

function formatJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2)
}
</script>

<template>
  <div class="snapshot-viewer">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane
        v-for="snapshot in sortedSnapshots"
        :key="snapshot.stage"
        :label="snapshot.stage.toUpperCase()"
        :name="snapshot.stage"
      >
        <div class="snapshot-content">
          <!-- Metadata -->
          <el-descriptions :column="4" border size="small" class="snapshot-meta">
            <el-descriptions-item label="Stage">
              <el-tag type="primary" size="small">{{ snapshot.stage }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Status">
              <el-tag :type="getSnapshotStatusType(snapshot.status)" size="small">
                {{ snapshot.status }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Duration">
              {{ formatDuration(snapshot.duration_ms) }}
            </el-descriptions-item>
            <el-descriptions-item label="Algorithm Version">
              {{ snapshot.algorithm_version }}
            </el-descriptions-item>
            <el-descriptions-item label="Started At">
              {{ formatDate(snapshot.started_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="Completed At">
              {{ formatDate(snapshot.completed_at) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- Error Message -->
          <el-alert
            v-if="snapshot.error_message"
            :title="snapshot.error_message"
            type="error"
            :closable="false"
            show-icon
            class="error-alert"
          />

          <!-- Input/Output -->
          <el-row :gutter="20" class="json-section">
            <el-col :span="12">
              <el-card shadow="never">
                <template #header>
                  <span>Input</span>
                </template>
                <el-scrollbar height="400px">
                  <pre class="json-content">{{ formatJson(snapshot.input) }}</pre>
                </el-scrollbar>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never">
                <template #header>
                  <span>Output</span>
                </template>
                <el-scrollbar height="400px">
                  <pre v-if="snapshot.output" class="json-content">{{ formatJson(snapshot.output) }}</pre>
                  <el-empty v-else description="No output" :image-size="60" />
                </el-scrollbar>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.snapshot-viewer {
  .snapshot-content {
    .snapshot-meta {
      margin-bottom: 16px;
    }

    .error-alert {
      margin-bottom: 16px;
    }

    .json-section {
      margin-top: 16px;
    }

    .json-content {
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: #303133;
    }
  }
}
</style>

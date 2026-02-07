<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTracesStore } from '@/stores'

const router = useRouter()
const tracesStore = useTracesStore()

const traceId = ref('')

function handleSearch() {
  if (traceId.value.trim()) {
    router.push(`/traces/${traceId.value.trim()}`)
  }
}
</script>

<template>
  <div class="trace-list-view">
    <div class="content">
      <el-card class="search-card">
        <el-form :inline="true" @submit.prevent="handleSearch">
          <el-form-item label="Trace ID">
            <el-input
              v-model="traceId"
              placeholder="Enter trace ID (UUID)"
              style="width: 400px"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              View Trace
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-alert
        v-if="tracesStore.error"
        :title="tracesStore.error"
        type="error"
        show-icon
        closable
        class="error-alert"
        @close="tracesStore.clearError"
      />

      <el-card>
        <template #header>
          <span>How to Use</span>
        </template>
        <div class="instructions">
          <p>Enter a trace ID to view the pipeline processing details for a specific item.</p>
          <p>You can find trace IDs from:</p>
          <ul>
            <li>The Watch detail page (trace_id field)</li>
            <li>The Match detail page</li>
            <li>Pipeline logs</li>
          </ul>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.trace-list-view {
  .page-title {
    font-weight: 600;
  }

  .search-card {
    margin-bottom: 20px;
  }

  .error-alert {
    margin-bottom: 20px;
  }

  .instructions {
    color: #606266;
    line-height: 1.8;

    p {
      margin: 0 0 8px;
    }

    ul {
      margin: 0;
      padding-left: 20px;
    }
  }
}
</style>

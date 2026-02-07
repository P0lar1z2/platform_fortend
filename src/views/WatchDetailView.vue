<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWatchesStore } from '@/stores'
import WatchDetail from '@/components/watches/WatchDetail.vue'

const route = useRoute()
const router = useRouter()
const watchesStore = useWatchesStore()

const traceId = route.params.traceId as string

onMounted(() => {
  watchesStore.fetchWatch(traceId)
})

watch(
  () => route.params.traceId,
  (newId) => {
    if (newId) {
      watchesStore.fetchWatch(newId as string)
    }
  }
)

function goToTrace() {
  router.push(`/traces/${traceId}`)
}

function goToMatches() {
  router.push(`/matches/${traceId}`)
}
</script>

<template>
  <div class="watch-detail-view">
    <div class="content">
      <div class="page-toolbar">
        <el-space>
          <el-button @click="goToTrace">
            <el-icon><List /></el-icon>
            View Trace
          </el-button>
          <el-button type="success" @click="goToMatches">
            <el-icon><Connection /></el-icon>
            View Matches
          </el-button>
        </el-space>
      </div>
      <el-alert
        v-if="watchesStore.error"
        :title="watchesStore.error"
        type="error"
        show-icon
        closable
        @close="watchesStore.clearError"
      />

      <div v-loading="watchesStore.loading">
        <WatchDetail v-if="watchesStore.currentWatch" :watch="watchesStore.currentWatch" />
        <el-empty v-else-if="!watchesStore.loading" description="Watch not found" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.watch-detail-view {
  .page-title {
    font-weight: 600;
  }

  .page-toolbar {
    margin-bottom: 16px;
  }
}
</style>

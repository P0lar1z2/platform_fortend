<script setup lang="ts">
import { computed } from 'vue'
import { useWatchesStore } from '@/stores'
import WatchFilters from '@/components/watches/WatchFilters.vue'
import WatchTable from '@/components/watches/WatchTable.vue'
import type { SearchQuery } from '@/api/types'

const watchesStore = useWatchesStore()

const hasSearched = computed(() => watchesStore.watches.length > 0 || watchesStore.error !== null)

function handleSearch(query: SearchQuery) {
  watchesStore.search(query)
}
</script>

<template>
  <div class="watch-list-view">
    <el-page-header title="Watches" @back="$router.push('/')">
      <template #content>
        <span class="page-title">Watch List</span>
      </template>
    </el-page-header>

    <div class="content">
      <WatchFilters @search="handleSearch" />

      <el-alert
        v-if="watchesStore.error"
        :title="watchesStore.error"
        type="error"
        show-icon
        closable
        class="error-alert"
        @close="watchesStore.clearError"
      />

      <el-card v-if="hasSearched || watchesStore.loading">
        <template #header>
          <div class="card-header">
            <span>Search Results</span>
            <el-tag type="info">{{ watchesStore.watches.length }} items</el-tag>
          </div>
        </template>
        <WatchTable :watches="watchesStore.watches" :loading="watchesStore.loading" />
      </el-card>

      <el-empty v-else description="Enter search criteria and click Search to find watches" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.watch-list-view {
  .page-title {
    font-weight: 600;
  }

  .content {
    margin-top: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-alert {
    margin-bottom: 20px;
  }
}
</style>

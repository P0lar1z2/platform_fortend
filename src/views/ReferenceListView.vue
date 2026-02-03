<script setup lang="ts">
import { computed } from 'vue'
import { useReferencesStore } from '@/stores'
import ReferenceFilters from '@/components/references/ReferenceFilters.vue'
import ReferenceTable from '@/components/references/ReferenceTable.vue'
import type { ReferenceQuery } from '@/api/types'

const referencesStore = useReferencesStore()

const hasSearched = computed(() => referencesStore.references.length > 0 || referencesStore.error !== null)

function handleSearch(query: ReferenceQuery) {
  referencesStore.search(query)
}
</script>

<template>
  <div class="reference-list-view">
    <el-page-header title="References" @back="$router.push('/')">
      <template #content>
        <span class="page-title">Reference Watches</span>
      </template>
    </el-page-header>

    <div class="content">
      <ReferenceFilters @search="handleSearch" />

      <el-alert
        v-if="referencesStore.error"
        :title="referencesStore.error"
        type="error"
        show-icon
        closable
        class="error-alert"
        @close="referencesStore.clearError"
      />

      <el-card v-if="hasSearched || referencesStore.loading">
        <template #header>
          <div class="card-header">
            <span>Search Results</span>
            <el-tag type="info">{{ referencesStore.references.length }} items</el-tag>
          </div>
        </template>
        <ReferenceTable :references="referencesStore.references" :loading="referencesStore.loading" />
      </el-card>

      <el-empty v-else description="Enter search criteria to find reference watches" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.reference-list-view {
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

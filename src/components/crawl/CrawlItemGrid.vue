<script setup lang="ts">
import type { CrawlItem } from '@/types/crawl'
import CrawlItemCard from './CrawlItemCard.vue'

defineProps<{
  items: CrawlItem[]
  selectedItems: Set<string>
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'view-detail', item: CrawlItem): void
}>()

function isSelected(id: string): boolean {
  return false // Will use props.selectedItems.has(id)
}
</script>

<template>
  <div class="crawl-item-grid" v-loading="loading">
    <template v-if="items.length > 0">
      <div class="grid-container">
        <CrawlItemCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          :selected="selectedItems.has(item.id)"
          @select="emit('select', $event)"
          @view-detail="emit('view-detail', $event)"
        />
      </div>
    </template>
    <template v-else-if="!loading">
      <el-empty description="No items found">
        <template #image>
          <el-icon :size="80" color="#909399"><Search /></el-icon>
        </template>
      </el-empty>
    </template>
  </div>
</template>

<style scoped lang="scss">
.crawl-item-grid {
  min-height: 200px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
</style>

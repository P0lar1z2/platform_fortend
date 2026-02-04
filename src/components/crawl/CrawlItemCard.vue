<script setup lang="ts">
import type { CrawlItem } from '@/types/crawl'

const props = defineProps<{
  item: CrawlItem
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'view-detail', item: CrawlItem): void
}>()

function formatPrice(priceJpy: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(priceJpy)
}

function handleSelect() {
  emit('select', props.item.id)
}

function handleViewDetail() {
  emit('view-detail', props.item)
}
</script>

<template>
  <el-card
    :class="['crawl-item-card', { selected }]"
    shadow="hover"
    :body-style="{ padding: '0' }"
  >
    <div class="card-content">
      <!-- Selection checkbox -->
      <div class="selection-overlay" @click.stop="handleSelect">
        <el-checkbox :model-value="selected" @click.stop="handleSelect" />
      </div>

      <!-- Image -->
      <div class="image-container" @click="handleViewDetail">
        <el-image
          :src="item.imageUrl"
          fit="cover"
          lazy
          class="item-image"
        >
          <template #error>
            <div class="image-placeholder">
              <el-icon :size="40"><Picture /></el-icon>
            </div>
          </template>
        </el-image>
        <el-tag v-if="item.rank" type="warning" size="small" class="rank-tag">
          {{ item.rank }}
        </el-tag>
      </div>

      <!-- Info -->
      <div class="item-info" @click="handleViewDetail">
        <h4 class="item-name" :title="item.name">{{ item.name }}</h4>
        <div class="item-price">
          <span class="price-display">{{ item.price }}</span>
          <span class="price-jpy">{{ formatPrice(item.priceJpy) }}</span>
        </div>
      </div>

      <!-- Extra info badges -->
      <div v-if="Object.keys(item.extra).length > 0" class="extra-info">
        <el-tag
          v-for="(value, key) in item.extra"
          :key="key"
          type="info"
          size="small"
          class="extra-tag"
        >
          {{ key }}: {{ value }}
        </el-tag>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.crawl-item-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;

  &.selected {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.3);
  }

  &:hover {
    transform: translateY(-2px);
  }
}

.card-content {
  position: relative;
}

.selection-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 4px;
}

.image-container {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.item-image {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}

.rank-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.item-info {
  padding: 12px;
}

.item-name {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 40px;
}

.item-price {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-display {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.price-jpy {
  font-size: 12px;
  color: #909399;
}

.extra-info {
  padding: 0 12px 12px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.extra-tag {
  font-size: 10px;
}
</style>

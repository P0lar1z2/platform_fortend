<script setup lang="ts">
import { computed } from 'vue'
import type { CrawlItemDetail } from '@/types/crawl'

const props = defineProps<{
  visible: boolean
  detail: CrawlItemDetail | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const drawerVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

function handleClose() {
  emit('update:visible', false)
}

function openUrl() {
  if (props.detail?.url) {
    window.open(props.detail.url, '_blank')
  }
}
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    title="Item Details"
    direction="rtl"
    size="45%"
    @close="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <template v-else-if="detail">
      <div class="detail-content">
        <!-- Image carousel -->
        <div class="image-section">
          <el-carousel
            v-if="detail.images.length > 0"
            :autoplay="false"
            trigger="click"
            height="300px"
            indicator-position="outside"
          >
            <el-carousel-item v-for="(img, index) in detail.images" :key="index">
              <el-image
                :src="img"
                fit="contain"
                class="carousel-image"
                :preview-src-list="detail.images"
                :initial-index="index"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon :size="40"><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </el-carousel-item>
          </el-carousel>
          <div v-else class="no-images">
            <el-icon :size="60" color="#909399"><Picture /></el-icon>
            <p>No images available</p>
          </div>
        </div>

        <!-- Title and actions -->
        <div class="title-section">
          <h2 class="item-title">{{ detail.name }}</h2>
          <el-button type="primary" @click="openUrl">
            <el-icon><Link /></el-icon>
            View on Platform
          </el-button>
        </div>

        <!-- Fields table -->
        <div class="fields-section">
          <h3>Item Details</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item
              v-for="(value, key) in detail.fields"
              :key="key"
              :label="key"
            >
              {{ value }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Description -->
        <div v-if="detail.description" class="description-section">
          <h3>Description</h3>
          <div class="description-content" v-html="detail.description"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <el-empty description="No item selected" />
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
.loading-container {
  padding: 20px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.image-section {
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.carousel-image {
  width: 100%;
  height: 300px;
}

.image-error,
.no-images {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 300px;
  color: #909399;

  p {
    margin-top: 8px;
    font-size: 14px;
  }
}

.title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;

  .item-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    flex: 1;
  }
}

.fields-section,
.description-section {
  h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.description-content {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

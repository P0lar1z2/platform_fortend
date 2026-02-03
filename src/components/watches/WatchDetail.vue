<script setup lang="ts">
import type { UnifiedWatch } from '@/types'
import { formatPrice, formatDate } from '@/utils/formatters'

defineProps<{
  watch: UnifiedWatch
}>()
</script>

<template>
  <div class="watch-detail">
    <el-row :gutter="20">
      <!-- Basic Info -->
      <el-col :span="12">
        <el-card class="detail-card">
          <template #header>
            <span>Basic Information</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="Brand">
              <el-tag v-if="watch.brand" type="primary">{{ watch.brand }}</el-tag>
              <span v-else class="text-muted">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="Model">
              {{ watch.model_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="Reference">
              <code v-if="watch.reference_number">{{ watch.reference_number }}</code>
              <span v-else class="text-muted">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="Serial Number">
              <code v-if="watch.serial_number">{{ watch.serial_number }}</code>
              <span v-else class="text-muted">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="Raw Title">
              {{ watch.raw_title || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- Source & Price -->
      <el-col :span="12">
        <el-card class="detail-card">
          <template #header>
            <span>Source & Price</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="Source">
              <el-tag type="info">{{ watch.source }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Source Item ID">
              <code>{{ watch.source_item_id }}</code>
            </el-descriptions-item>
            <el-descriptions-item label="Source URL">
              <el-link v-if="watch.source_url" :href="watch.source_url" target="_blank" type="primary">
                View Source
              </el-link>
              <span v-else class="text-muted">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="Price">
              {{ formatPrice(watch.price?.amount, watch.price?.currency) }}
            </el-descriptions-item>
            <el-descriptions-item label="Original Price Text">
              {{ watch.price?.original_text || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="row-gap">
      <!-- Appearance -->
      <el-col :span="12">
        <el-card class="detail-card">
          <template #header>
            <span>Appearance</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="Dial Color">
              {{ watch.dial_color || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="Case Material">
              {{ watch.case_material || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="Bracelet Material">
              {{ watch.bracelet_material || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="Case Size">
              {{ watch.case_size || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- Condition & Accessories -->
      <el-col :span="12">
        <el-card class="detail-card">
          <template #header>
            <span>Condition & Accessories</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="Case Condition">
              {{ watch.case_condition || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="Overall Condition">
              {{ watch.overall_condition || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="Accessories">
              <div class="accessories">
                <el-tag v-if="watch.accessories?.has_box" type="success" size="small">Box</el-tag>
                <el-tag v-if="watch.accessories?.has_papers" type="success" size="small">Papers</el-tag>
                <el-tag v-if="watch.accessories?.has_warranty_card" type="success" size="small">Warranty Card</el-tag>
                <el-tag
                  v-for="other in watch.accessories?.other"
                  :key="other"
                  type="info"
                  size="small"
                >
                  {{ other }}
                </el-tag>
                <span v-if="!watch.accessories?.has_box && !watch.accessories?.has_papers && !watch.accessories?.has_warranty_card && !watch.accessories?.other?.length" class="text-muted">
                  None
                </span>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="row-gap">
      <!-- Auction Info -->
      <el-col :span="12">
        <el-card class="detail-card">
          <template #header>
            <span>Auction Information</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="Lot Number">
              {{ watch.lot_number || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="Auction Date">
              {{ formatDate(watch.auction_date) }}
            </el-descriptions-item>
            <el-descriptions-item label="Seller Location">
              {{ watch.seller_location || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- Metadata -->
      <el-col :span="12">
        <el-card class="detail-card">
          <template #header>
            <span>Metadata</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="Trace ID">
              <code>{{ watch.trace_id }}</code>
            </el-descriptions-item>
            <el-descriptions-item label="Created At">
              {{ formatDate(watch.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="Updated At">
              {{ formatDate(watch.updated_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="Search Keywords">
              <div class="keywords">
                <el-tag
                  v-for="keyword in watch.search_keywords"
                  :key="keyword"
                  size="small"
                  type="info"
                >
                  {{ keyword }}
                </el-tag>
                <span v-if="!watch.search_keywords?.length" class="text-muted">None</span>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- Images -->
    <el-row v-if="watch.images?.length" class="row-gap">
      <el-col :span="24">
        <el-card class="detail-card">
          <template #header>
            <span>Images ({{ watch.images.length }})</span>
          </template>
          <div class="image-grid">
            <el-image
              v-for="(img, index) in watch.images"
              :key="index"
              :src="img"
              :preview-src-list="watch.images"
              :initial-index="index"
              fit="cover"
              class="watch-image"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.watch-detail {
  .detail-card {
    height: 100%;
  }

  .row-gap {
    margin-top: 20px;
  }

  .text-muted {
    color: #909399;
  }

  code {
    background-color: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }

  .accessories,
  .keywords {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .watch-image {
    width: 100%;
    height: 150px;
    border-radius: 4px;
    cursor: pointer;
  }

  .image-error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: #f5f7fa;
    color: #909399;
    font-size: 24px;
  }
}
</style>

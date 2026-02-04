<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCrawlStore } from '@/stores'
import CrawlItemGrid from '@/components/crawl/CrawlItemGrid.vue'
import CrawlDetailDrawer from '@/components/crawl/CrawlDetailDrawer.vue'
import type { CrawlItem } from '@/types/crawl'
import { ElMessage, ElMessageBox } from 'element-plus'

const crawlStore = useCrawlStore()

const selectedPlatform = ref('')
const keyword = ref('')
const currentPage = ref(1)
const detailVisible = ref(false)

const hasResults = computed(
  () => crawlStore.searchResults.length > 0 || crawlStore.error !== null
)

onMounted(async () => {
  await crawlStore.fetchPlatforms()
})

async function handleSearch() {
  if (!selectedPlatform.value) {
    ElMessage.warning('Please select a platform')
    return
  }
  if (!keyword.value.trim()) {
    ElMessage.warning('Please enter a search keyword')
    return
  }

  currentPage.value = 1
  crawlStore.clearSelection()
  await crawlStore.search(selectedPlatform.value, keyword.value.trim(), 1)
}

async function handlePageChange(page: number) {
  currentPage.value = page
  await crawlStore.search(selectedPlatform.value, keyword.value.trim(), page)
}

function handleSelect(itemId: string) {
  crawlStore.toggleSelect(itemId)
}

async function handleViewDetail(item: CrawlItem) {
  detailVisible.value = true
  await crawlStore.fetchDetail(selectedPlatform.value, item.id)
}

function handleSelectAll() {
  crawlStore.selectAll()
}

function handleClearSelection() {
  crawlStore.clearSelection()
}

async function handleSubmit() {
  if (crawlStore.selectedCount === 0) {
    ElMessage.warning('Please select at least one item')
    return
  }

  try {
    await ElMessageBox.confirm(
      `Submit ${crawlStore.selectedCount} items to the pipeline for processing?`,
      'Confirm Submission',
      {
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        type: 'info',
      }
    )

    const submitted = await crawlStore.submitSelected()
    ElMessage.success(`Successfully submitted ${submitted} items to the pipeline`)
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e instanceof Error ? e.message : 'Failed to submit items')
    }
  }
}
</script>

<template>
  <div class="crawl-view">
    <el-page-header title="Crawl" @back="$router.push('/')">
      <template #content>
        <span class="page-title">Manual Crawl</span>
      </template>
    </el-page-header>

    <div class="content">
      <!-- Search Section -->
      <el-card class="search-card">
        <template #header>
          <span>Search</span>
        </template>

        <el-form :inline="true" @submit.prevent="handleSearch">
          <el-form-item label="Platform">
            <el-select
              v-model="selectedPlatform"
              placeholder="Select platform"
              style="width: 200px"
              :loading="crawlStore.loading && crawlStore.platforms.length === 0"
            >
              <el-option
                v-for="p in crawlStore.platforms"
                :key="p.name"
                :label="p.displayName"
                :value="p.name"
                :disabled="!p.isAvailable"
              >
                <span>{{ p.displayName }}</span>
                <el-tag
                  v-if="!p.isAvailable"
                  type="danger"
                  size="small"
                  style="margin-left: 8px"
                >
                  Unavailable
                </el-tag>
                <el-tag
                  v-else-if="p.requiresAuth"
                  type="warning"
                  size="small"
                  style="margin-left: 8px"
                >
                  Auth Required
                </el-tag>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="Keyword">
            <el-input
              v-model="keyword"
              placeholder="Search keyword"
              style="width: 300px"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="crawlStore.loading"
              @click="handleSearch"
            >
              <el-icon><Search /></el-icon>
              Search
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- Error Alert -->
      <el-alert
        v-if="crawlStore.error"
        :title="crawlStore.error"
        type="error"
        show-icon
        closable
        class="error-alert"
        @close="crawlStore.clearError"
      />

      <!-- Results Section -->
      <el-card v-if="hasResults || crawlStore.loading" class="results-card">
        <template #header>
          <div class="card-header">
            <span>
              Search Results
              <el-tag type="info" style="margin-left: 8px">
                {{ crawlStore.searchResults.length }} items
              </el-tag>
            </span>
            <div class="header-actions">
              <el-button size="small" @click="handleSelectAll">
                Select All
              </el-button>
              <el-button size="small" @click="handleClearSelection">
                Clear Selection
              </el-button>
            </div>
          </div>
        </template>

        <CrawlItemGrid
          :items="crawlStore.searchResults"
          :selected-items="crawlStore.selectedItems"
          :loading="crawlStore.loading"
          @select="handleSelect"
          @view-detail="handleViewDetail"
        />

        <!-- Pagination -->
        <div v-if="crawlStore.pagination" class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="20"
            :total="crawlStore.pagination.totalItems"
            layout="prev, pager, next, total"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>

      <!-- Empty State -->
      <el-empty
        v-else
        description="Select a platform and enter a keyword to search for items"
      />

      <!-- Submit Button (Fixed at bottom) -->
      <div v-if="crawlStore.selectedCount > 0" class="submit-container">
        <el-card shadow="always" class="submit-card">
          <div class="submit-content">
            <div class="selected-info">
              <el-icon><ShoppingCart /></el-icon>
              <span>{{ crawlStore.selectedCount }} items selected</span>
            </div>
            <el-button
              type="primary"
              size="large"
              :loading="crawlStore.loading"
              @click="handleSubmit"
            >
              <el-icon><Upload /></el-icon>
              Submit to Pipeline
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Detail Drawer -->
    <CrawlDetailDrawer
      v-model:visible="detailVisible"
      :detail="crawlStore.currentDetail"
      :loading="crawlStore.detailLoading"
    />
  </div>
</template>

<style scoped lang="scss">
.crawl-view {
  .page-title {
    font-weight: 600;
  }

  .content {
    margin-top: 20px;
    padding-bottom: 80px; // Space for fixed submit button
  }

  .search-card {
    margin-bottom: 20px;
  }

  .error-alert {
    margin-bottom: 20px;
  }

  .results-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  .submit-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: linear-gradient(transparent, white 20%);
    z-index: 100;

    .submit-card {
      max-width: 600px;
      margin: 0 auto;
    }

    .submit-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .selected-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
    }
  }
}
</style>

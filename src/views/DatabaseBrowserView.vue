<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  listCollections,
  browseCollection,
  getDocument,
  type CollectionInfo,
  type DocumentsResponse,
} from '@/api/admin'
import { ElMessage } from 'element-plus'

// State
const collections = ref<CollectionInfo[]>([])
const selectedCollection = ref<string>('')
const documentsData = ref<DocumentsResponse | null>(null)
const selectedDocument = ref<Record<string, unknown> | null>(null)
const documentDialogVisible = ref(false)

const loading = ref(false)
const documentsLoading = ref(false)
const documentLoading = ref(false)
const error = ref<string | null>(null)

const currentPage = ref(1)
const pageSize = ref(20)

// Load collections on mount
onMounted(async () => {
  await fetchCollections()
})

// Watch for collection selection changes
watch(selectedCollection, async (newVal) => {
  if (newVal) {
    currentPage.value = 1
    await fetchDocuments()
  } else {
    documentsData.value = null
  }
})

async function fetchCollections() {
  loading.value = true
  error.value = null
  try {
    collections.value = await listCollections()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch collections'
    collections.value = []
  } finally {
    loading.value = false
  }
}

async function fetchDocuments() {
  if (!selectedCollection.value) return

  documentsLoading.value = true
  error.value = null
  try {
    documentsData.value = await browseCollection(
      selectedCollection.value,
      currentPage.value,
      pageSize.value
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch documents'
    documentsData.value = null
  } finally {
    documentsLoading.value = false
  }
}

async function handlePageChange(page: number) {
  currentPage.value = page
  await fetchDocuments()
}

async function viewDocument(doc: Record<string, unknown>) {
  const docId = getDocumentId(doc)
  if (!docId) {
    // Show the document directly if no ID
    selectedDocument.value = doc
    documentDialogVisible.value = true
    return
  }

  documentLoading.value = true
  try {
    selectedDocument.value = await getDocument(selectedCollection.value, docId)
    documentDialogVisible.value = true
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : 'Failed to fetch document')
  } finally {
    documentLoading.value = false
  }
}

function getDocumentId(doc: Record<string, unknown>): string {
  // Handle MongoDB ObjectId format
  const id = doc._id
  if (typeof id === 'string') return id
  if (id && typeof id === 'object' && '$oid' in id) {
    return (id as { $oid: string }).$oid
  }
  return String(id || '')
}

function formatDocumentPreview(doc: Record<string, unknown>): string {
  // Create a short preview of the document
  const keys = Object.keys(doc).filter((k) => k !== '_id')
  const preview = keys
    .slice(0, 3)
    .map((k) => {
      const val = doc[k]
      if (typeof val === 'string') return `${k}: "${val.slice(0, 30)}..."`
      if (typeof val === 'number') return `${k}: ${val}`
      return `${k}: ...`
    })
    .join(', ')
  return preview || '(empty)'
}

function formatJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2)
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  ElMessage.success('Copied to clipboard')
}
</script>

<template>
  <div class="database-browser-view">
    <div class="content">
      <!-- Error Alert -->
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        closable
        class="error-alert"
        @close="error = null"
      />

      <div class="browser-layout">
        <!-- Collections List -->
        <el-card class="collections-panel" v-loading="loading">
          <template #header>
            <div class="panel-header">
              <span>Collections</span>
              <el-button size="small" :icon="Refresh" circle @click="fetchCollections" />
            </div>
          </template>

          <el-menu
            :default-active="selectedCollection"
            @select="(name: string) => (selectedCollection = name)"
          >
            <el-menu-item
              v-for="col in collections"
              :key="col.name"
              :index="col.name"
            >
              <span class="collection-name">{{ col.name }}</span>
              <el-tag size="small" type="info" style="margin-left: auto">
                {{ col.count }}
              </el-tag>
            </el-menu-item>
          </el-menu>

          <el-empty
            v-if="collections.length === 0 && !loading"
            description="No collections found"
          />
        </el-card>

        <!-- Documents List -->
        <el-card class="documents-panel" v-loading="documentsLoading">
          <template #header>
            <div class="panel-header">
              <span>
                {{ selectedCollection || 'Select a collection' }}
                <el-tag
                  v-if="documentsData"
                  type="success"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ documentsData.total }} documents
                </el-tag>
              </span>
              <el-button
                v-if="selectedCollection"
                size="small"
                :icon="Refresh"
                circle
                @click="fetchDocuments"
              />
            </div>
          </template>

          <template v-if="documentsData && documentsData.documents.length > 0">
            <el-table
              :data="documentsData.documents"
              stripe
              style="width: 100%"
              @row-click="viewDocument"
            >
              <el-table-column label="ID" width="220">
                <template #default="{ row }">
                  <el-text type="primary" truncated>
                    {{ getDocumentId(row) }}
                  </el-text>
                </template>
              </el-table-column>
              <el-table-column label="Preview" min-width="300">
                <template #default="{ row }">
                  <el-text type="info" truncated>
                    {{ formatDocumentPreview(row) }}
                  </el-text>
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="100">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click.stop="viewDocument(row)"
                  >
                    View
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- Pagination -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="currentPage"
                :page-size="pageSize"
                :total="documentsData.total"
                layout="prev, pager, next, total"
                @current-change="handlePageChange"
              />
            </div>
          </template>

          <el-empty
            v-else-if="selectedCollection && !documentsLoading"
            description="No documents in this collection"
          />

          <el-empty
            v-else-if="!selectedCollection"
            description="Select a collection to browse documents"
          />
        </el-card>
      </div>
    </div>

    <!-- Document Detail Dialog -->
    <el-dialog
      v-model="documentDialogVisible"
      title="Document Details"
      width="70%"
      destroy-on-close
    >
      <div v-if="selectedDocument" class="document-detail">
        <div class="document-actions">
          <el-button
            size="small"
            @click="copyToClipboard(formatJson(selectedDocument))"
          >
            <el-icon><CopyDocument /></el-icon>
            Copy JSON
          </el-button>
        </div>
        <pre class="json-viewer">{{ formatJson(selectedDocument) }}</pre>
      </div>
      <div v-else v-loading="documentLoading" style="min-height: 200px" />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.database-browser-view {
  .content {
    margin-top: 0;
  }

  .error-alert {
    margin-bottom: 20px;
  }

  .browser-layout {
    display: flex;
    gap: 20px;
    min-height: calc(100vh - 200px);
  }

  .collections-panel {
    width: 280px;
    flex-shrink: 0;

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .el-menu {
      border-right: none;
    }

    .el-menu-item {
      display: flex;
      align-items: center;
    }

    .collection-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .documents-panel {
    flex: 1;
    overflow: hidden;

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  .document-detail {
    .document-actions {
      margin-bottom: 16px;
      display: flex;
      justify-content: flex-end;
    }

    .json-viewer {
      background: #f5f7fa;
      border-radius: 4px;
      padding: 16px;
      margin: 0;
      overflow: auto;
      max-height: 60vh;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
}
</style>

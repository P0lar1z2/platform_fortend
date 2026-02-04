import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Platform, CrawlItem, CrawlItemDetail, Pagination } from '@/types/crawl'
import {
  listPlatforms,
  searchItems,
  getItemDetail,
  submitItems,
  type SubmitItem,
} from '@/api/crawl'

export const useCrawlStore = defineStore('crawl', () => {
  // State
  const platforms = ref<Platform[]>([])
  const searchResults = ref<CrawlItem[]>([])
  const pagination = ref<Pagination | null>(null)
  const selectedItems = ref<Set<string>>(new Set())
  const currentDetail = ref<CrawlItemDetail | null>(null)
  const currentPlatform = ref<string>('')
  const currentKeyword = ref<string>('')
  const loading = ref(false)
  const detailLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const availablePlatforms = computed(() =>
    platforms.value.filter((p) => p.isAvailable)
  )

  const selectedCount = computed(() => selectedItems.value.size)

  const selectedItemsList = computed(() => {
    return searchResults.value.filter((item) => selectedItems.value.has(item.id))
  })

  // Actions
  async function fetchPlatforms() {
    loading.value = true
    error.value = null
    try {
      platforms.value = await listPlatforms()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch platforms'
      platforms.value = []
    } finally {
      loading.value = false
    }
  }

  async function search(platform: string, keyword: string, page: number = 1) {
    loading.value = true
    error.value = null
    currentPlatform.value = platform
    currentKeyword.value = keyword

    try {
      const result = await searchItems(platform, keyword, page)
      searchResults.value = result.items
      pagination.value = result.pagination
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to search items'
      searchResults.value = []
      pagination.value = null
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (!pagination.value?.hasMore || loading.value) return

    const nextPage = pagination.value.currentPage + 1
    loading.value = true
    error.value = null

    try {
      const result = await searchItems(
        currentPlatform.value,
        currentKeyword.value,
        nextPage
      )
      searchResults.value = [...searchResults.value, ...result.items]
      pagination.value = result.pagination
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load more items'
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(platform: string, itemId: string) {
    detailLoading.value = true
    error.value = null

    try {
      currentDetail.value = await getItemDetail(platform, itemId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch item detail'
      currentDetail.value = null
    } finally {
      detailLoading.value = false
    }
  }

  async function submitSelected(): Promise<number> {
    if (selectedItems.value.size === 0) return 0

    loading.value = true
    error.value = null

    try {
      const items: SubmitItem[] = Array.from(selectedItems.value).map((itemId) => ({
        platform: currentPlatform.value,
        itemId,
      }))

      const result = await submitItems(items)
      clearSelection()
      return result.submitted
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to submit items'
      throw e
    } finally {
      loading.value = false
    }
  }

  function toggleSelect(itemId: string) {
    if (selectedItems.value.has(itemId)) {
      selectedItems.value.delete(itemId)
    } else {
      selectedItems.value.add(itemId)
    }
    // Trigger reactivity
    selectedItems.value = new Set(selectedItems.value)
  }

  function selectAll() {
    searchResults.value.forEach((item) => selectedItems.value.add(item.id))
    selectedItems.value = new Set(selectedItems.value)
  }

  function clearSelection() {
    selectedItems.value = new Set()
  }

  function clearDetail() {
    currentDetail.value = null
  }

  function clearResults() {
    searchResults.value = []
    pagination.value = null
    clearSelection()
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    platforms,
    searchResults,
    pagination,
    selectedItems,
    currentDetail,
    currentPlatform,
    currentKeyword,
    loading,
    detailLoading,
    error,

    // Computed
    availablePlatforms,
    selectedCount,
    selectedItemsList,

    // Actions
    fetchPlatforms,
    search,
    loadMore,
    fetchDetail,
    submitSelected,
    toggleSelect,
    selectAll,
    clearSelection,
    clearDetail,
    clearResults,
    clearError,
  }
})

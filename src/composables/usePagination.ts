import { ref, computed } from 'vue'

export function usePagination<T>(items: T[], defaultPageSize = 20) {
  const currentPage = ref(1)
  const pageSize = ref(defaultPageSize)

  const totalItems = computed(() => items.length)
  const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return items.slice(start, end)
  })

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  function setPageSize(size: number) {
    pageSize.value = size
    currentPage.value = 1
  }

  function reset() {
    currentPage.value = 1
  }

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    goToPage,
    setPageSize,
    reset,
  }
}

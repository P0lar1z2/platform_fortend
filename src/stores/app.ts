import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { checkHealth } from '@/api/health'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const backendStatus = ref<'unknown' | 'online' | 'offline'>('unknown')
  const isLoading = ref(false)

  const isBackendOnline = computed(() => backendStatus.value === 'online')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  async function checkBackendHealth() {
    try {
      const health = await checkHealth()
      backendStatus.value = health.status === 'ok' ? 'online' : 'offline'
    } catch {
      backendStatus.value = 'offline'
    }
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  return {
    sidebarCollapsed,
    backendStatus,
    isLoading,
    isBackendOnline,
    toggleSidebar,
    checkBackendHealth,
    setLoading,
  }
})

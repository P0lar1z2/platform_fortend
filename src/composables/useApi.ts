import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export function useApi<T, Args extends unknown[]>(
  apiFn: (...args: Args) => Promise<T>
) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function execute(...args: Args): Promise<T | null> {
    loading.value = true
    error.value = null
    try {
      const result = await apiFn(...args)
      data.value = result as T
      return result
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An error occurred'
      error.value = message
      ElMessage.error(message)
      return null
    } finally {
      loading.value = false
    }
  }

  function reset() {
    data.value = null
    error.value = null
  }

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}

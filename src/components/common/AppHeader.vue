<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'

const appStore = useAppStore()

const statusType = computed(() => {
  switch (appStore.backendStatus) {
    case 'online':
      return 'success'
    case 'offline':
      return 'danger'
    default:
      return 'info'
  }
})

const statusText = computed(() => {
  switch (appStore.backendStatus) {
    case 'online':
      return 'Backend Online'
    case 'offline':
      return 'Backend Offline'
    default:
      return 'Checking...'
  }
})
</script>

<template>
  <el-header class="app-header">
    <div class="header-left">
      <el-button
        :icon="appStore.sidebarCollapsed ? 'Expand' : 'Fold'"
        text
        @click="appStore.toggleSidebar"
      />
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">Home</el-breadcrumb-item>
        <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-right">
      <el-tag :type="statusType" size="small" class="status-tag">
        <el-icon class="status-icon"><Connection /></el-icon>
        <span>{{ statusText }}</span>
      </el-tag>
    </div>
  </el-header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid var(--wp-header-border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-tag {
  :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
}
</style>

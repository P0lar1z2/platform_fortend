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
      <el-tag :type="statusType" size="small">
        <el-icon class="status-icon"><Connection /></el-icon>
        {{ statusText }}
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
  border-bottom: 1px solid #e4e7ed;
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

.status-icon {
  margin-right: 4px;
  vertical-align: middle;
}
</style>

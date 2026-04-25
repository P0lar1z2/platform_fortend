<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

interface AdminMenuItem {
  path: string
  label: string
  icon: string
}

const menuItems: AdminMenuItem[] = [
  { path: '/admin/crawl-status', label: 'Crawl 状态', icon: 'DataLine' },
  { path: '/admin/scheduler', label: '定时任务', icon: 'Timer' },
  { path: '/admin/matcher', label: 'Matcher', icon: 'Connection' },
  { path: '/admin/corvus', label: 'Corvus', icon: 'Cpu' },
  { path: '/admin/usage', label: '用量', icon: 'PieChart' },
]

const activeMenu = computed(() => {
  const found = menuItems.find((m) => route.path.startsWith(m.path))
  return found?.path ?? '/admin/crawl-status'
})

function handleMenuSelect(index: string) {
  router.push(index)
}

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
  <el-container class="admin-container">
    <el-aside :width="appStore.sidebarCollapsed ? '64px' : '220px'" class="admin-sidebar">
      <div class="logo">
        <el-icon size="24"><Tools /></el-icon>
        <span v-if="!appStore.sidebarCollapsed" class="logo-text">Admin</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.label }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container direction="vertical">
      <el-header class="admin-header">
        <div class="header-left">
          <el-button
            :icon="appStore.sidebarCollapsed ? 'Expand' : 'Fold'"
            text
            @click="appStore.toggleSidebar"
          />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin' }">Admin</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag :type="statusType" size="small" class="status-tag">
            <el-icon class="status-icon"><Connection /></el-icon>
            <span>{{ statusText }}</span>
          </el-tag>
          <el-button size="small" @click="router.push('/')">
            <el-icon><SwitchButton /></el-icon>
            <span>退出到用户界面</span>
          </el-button>
        </div>
      </el-header>

      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.admin-container {
  height: 100%;
}

.admin-sidebar {
  background-color: var(--wp-sidebar-bg);
  transition: width 0.3s;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--wp-sidebar-text-active);
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-text {
  white-space: nowrap;
}

.sidebar-menu {
  border-right: none;
  background-color: var(--wp-sidebar-bg);

  :deep(.el-menu-item) {
    color: var(--wp-sidebar-text);
    border-left: 3px solid transparent;
    transition: all 0.2s;

    &:hover {
      background-color: var(--wp-sidebar-active-bg);
    }

    &.is-active {
      color: var(--wp-sidebar-text-active);
      background-color: var(--wp-sidebar-active-bg);
      border-left-color: var(--el-color-primary);
    }
  }
}

.admin-header {
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
  gap: 12px;
}

.status-tag {
  :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
}

.admin-main {
  background-color: var(--wp-content-bg);
  padding: 20px;
  overflow-y: auto;
}
</style>

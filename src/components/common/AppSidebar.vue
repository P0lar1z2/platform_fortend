<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/watches')) return '/watches'
  if (path.startsWith('/matches')) return '/matches'
  if (path.startsWith('/traces')) return '/traces'
  if (path.startsWith('/references')) return '/references'
  if (path.startsWith('/crawl')) return '/crawl'
  if (path.startsWith('/database')) return '/database'
  if (path.startsWith('/admin/scheduler')) return '/admin/scheduler'
  return '/'
})

function handleMenuSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <el-aside :width="appStore.sidebarCollapsed ? '64px' : '220px'" class="app-sidebar">
    <div class="logo">
      <el-icon size="24"><Watch /></el-icon>
      <span v-if="!appStore.sidebarCollapsed" class="logo-text">Watch Pipeline</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      :collapse="appStore.sidebarCollapsed"
      class="sidebar-menu"
      @select="handleMenuSelect"
    >
      <el-menu-item index="/">
        <el-icon><DataAnalysis /></el-icon>
        <template #title>Dashboard</template>
      </el-menu-item>
      <el-menu-item index="/watches">
        <el-icon><Goods /></el-icon>
        <template #title>Watches</template>
      </el-menu-item>
      <el-menu-item index="/matches">
        <el-icon><Connection /></el-icon>
        <template #title>Match Verification</template>
      </el-menu-item>
      <el-menu-item index="/traces">
        <el-icon><List /></el-icon>
        <template #title>Traces</template>
      </el-menu-item>
      <el-menu-item index="/references">
        <el-icon><Collection /></el-icon>
        <template #title>References</template>
      </el-menu-item>
      <el-menu-item index="/crawl">
        <el-icon><Download /></el-icon>
        <template #title>Manual Crawl</template>
      </el-menu-item>
      <el-menu-item index="/database">
        <el-icon><Coin /></el-icon>
        <template #title>Database</template>
      </el-menu-item>

      <el-divider style="margin: 8px 16px; border-color: rgba(255, 255, 255, 0.1);" />

      <el-menu-item index="/admin/scheduler">
        <el-icon><Timer /></el-icon>
        <template #title>定时任务</template>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<style scoped lang="scss">
.app-sidebar {
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
</style>

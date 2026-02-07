<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores'
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'

const appStore = useAppStore()

onMounted(() => {
  appStore.checkBackendHealth()
  // Check health periodically
  setInterval(() => appStore.checkBackendHealth(), 30000)
})
</script>

<template>
  <el-container class="app-container">
    <AppSidebar />
    <el-container direction="vertical">
      <AppHeader />
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style lang="scss">
:root {
  --el-color-primary: #6366F1;
  --el-color-success: #22C55E;
  --el-color-warning: #F59E0B;
  --el-color-danger: #EF4444;
  --el-color-info: #64748B;
  --el-border-radius-base: 8px;
  --el-border-radius-small: 6px;

  --wp-sidebar-bg: #1E293B;
  --wp-sidebar-active-bg: #334155;
  --wp-sidebar-text: #94A3B8;
  --wp-sidebar-text-active: #F1F5F9;
  --wp-content-bg: #F1F5F9;
  --wp-header-border: #E2E8F0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  font-family: 'Inter', 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
}

.app-container {
  height: 100%;
}

.app-main {
  background-color: var(--wp-content-bg);
  padding: 20px;
  overflow-y: auto;
}

// Common page styles
.page-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  .error-alert {
    margin-bottom: 16px;
  }
}
</style>

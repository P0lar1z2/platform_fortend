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
    <el-container>
      <AppHeader />
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
}

.app-container {
  height: 100%;
}

.app-main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>

<template>
  <div class="admin-shell">
    <header class="admin-header">
      <div class="admin-header__left">
        <el-icon class="admin-logo" size="20"><Tools /></el-icon>
        <span class="admin-title">Watch Pipeline · Admin</span>
        <el-tag size="small" type="warning" effect="plain">运维面板</el-tag>
      </div>
      <div class="admin-header__right">
        <el-tooltip content="打开调度器" placement="bottom">
          <el-button size="small" link @click="$router.push('/admin/scheduler')">
            <el-icon><Timer /></el-icon>
          </el-button>
        </el-tooltip>
        <el-button size="small" @click="goToUserApp">
          <el-icon><SwitchButton /></el-icon>
          <span>退出到用户界面</span>
        </el-button>
      </div>
    </header>

    <el-tabs
      v-model="activeTab"
      type="card"
      class="admin-tabs"
      @tab-change="handleTabChange"
    >
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.name"
        :label="tab.label"
        :name="tab.name"
      />
    </el-tabs>

    <main class="admin-body">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

interface AdminTab {
  name: string
  label: string
  path: string
}

const tabs: AdminTab[] = [
  { name: 'crawl-status', label: 'Crawl 状态', path: '/admin/crawl-status' },
  { name: 'scheduler', label: '定时任务', path: '/admin/scheduler' },
  { name: 'matcher', label: 'Matcher', path: '/admin/matcher' },
  { name: 'corvus', label: 'Corvus', path: '/admin/corvus' },
  { name: 'usage', label: '用量', path: '/admin/usage' },
]

const activeTab = computed({
  get: () => (route.meta?.adminTab as string) || 'crawl-status',
  set: () => {},
})

function handleTabChange(name: string | number) {
  const target = tabs.find((t) => t.name === name)
  if (target && route.path !== target.path) {
    router.push(target.path)
  }
}

function goToUserApp() {
  router.push('/')
}
</script>

<style scoped lang="scss">
.admin-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #0f172a; // 深色背景，视觉上和 user 界面区分
  color: #f1f5f9;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 20px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border-bottom: 1px solid #334155;
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.admin-logo {
  color: var(--el-color-warning);
}

.admin-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.admin-tabs {
  flex-shrink: 0;
  padding: 12px 20px 0;
  background-color: #1e293b;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
    border-bottom: 1px solid #334155;
  }

  :deep(.el-tabs__nav) {
    border: none;
  }

  :deep(.el-tabs__item) {
    border: 1px solid transparent;
    color: #94a3b8;
    background-color: transparent;

    &.is-active {
      color: #f1f5f9;
      background-color: #0f172a;
      border-color: #334155;
      border-bottom-color: #0f172a;
    }

    &:hover:not(.is-active) {
      color: #cbd5e1;
    }
  }
}

.admin-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 20px;
  background-color: #f1f5f9; // 内容区保持亮色，让现有 el-card / el-table 不用重新改色
  color: #1e293b;
}
</style>

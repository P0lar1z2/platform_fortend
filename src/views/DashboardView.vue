<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'

const router = useRouter()
const appStore = useAppStore()

const features = [
  {
    title: 'Watches',
    description: 'Browse and search unified watch data',
    icon: 'Goods',
    route: '/watches',
    color: '#409eff',
  },
  {
    title: 'Match Verification',
    description: 'Review and verify algorithm matching results',
    icon: 'Connection',
    route: '/matches',
    color: '#67c23a',
  },
  {
    title: 'Traces',
    description: 'Monitor pipeline processing status',
    icon: 'List',
    route: '/traces',
    color: '#e6a23c',
  },
  {
    title: 'References',
    description: 'Search and view reference watch models',
    icon: 'Collection',
    route: '/references',
    color: '#909399',
  },
]

const statusColor = computed(() => {
  switch (appStore.backendStatus) {
    case 'online':
      return '#67c23a'
    case 'offline':
      return '#f56c6c'
    default:
      return '#909399'
  }
})

function navigateTo(route: string) {
  router.push(route)
}
</script>

<template>
  <div class="dashboard">
    <el-row :gutter="20" class="status-row">
      <el-col :span="24">
        <el-card class="status-card">
          <template #header>
            <div class="card-header">
              <span>System Status</span>
              <el-button
                size="small"
                :icon="'Refresh'"
                @click="appStore.checkBackendHealth"
              >
                Refresh
              </el-button>
            </div>
          </template>
          <div class="status-content">
            <div class="status-item">
              <span class="status-label">Backend Service</span>
              <el-tag :color="statusColor" effect="dark">
                {{ appStore.backendStatus === 'online' ? 'Online' : appStore.backendStatus === 'offline' ? 'Offline' : 'Checking...' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="feature-row">
      <el-col
        v-for="feature in features"
        :key="feature.route"
        :xs="24"
        :sm="12"
        :md="6"
      >
        <el-card
          class="feature-card"
          :body-style="{ padding: '20px' }"
          shadow="hover"
          @click="navigateTo(feature.route)"
        >
          <div class="feature-icon" :style="{ backgroundColor: feature.color }">
            <el-icon size="32"><component :is="feature.icon" /></el-icon>
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="info-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>Quick Actions</span>
          </template>
          <el-space wrap>
            <el-button type="primary" @click="navigateTo('/watches')">
              <el-icon><Search /></el-icon>
              Search Watches
            </el-button>
            <el-button type="success" @click="navigateTo('/matches')">
              <el-icon><Check /></el-icon>
              Verify Matches
            </el-button>
            <el-button type="warning" @click="navigateTo('/traces')">
              <el-icon><View /></el-icon>
              View Traces
            </el-button>
          </el-space>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.status-row {
  margin-bottom: 20px;
}

.status-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.status-content {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;

  .status-label {
    font-weight: 500;
    color: #606266;
  }
}

.feature-row {
  margin-bottom: 20px;
}

.feature-card {
  cursor: pointer;
  text-align: center;
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-4px);
  }
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #fff;
}

.feature-title {
  margin: 0 0 8px;
  font-size: 18px;
  color: #303133;
}

.feature-description {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.info-row {
  margin-bottom: 20px;
}
</style>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores'
import StatCard from '@/components/dashboard/StatCard.vue'
import SourcePieChart from '@/components/dashboard/SourcePieChart.vue'
import BrandBarChart from '@/components/dashboard/BrandBarChart.vue'

const dashboardStore = useDashboardStore()

onMounted(() => {
  dashboardStore.fetchStats()
})

const stats = computed(() => dashboardStore.stats)

const verificationRate = computed(() => {
  if (!stats.value || stats.value.matches.total === 0) return '0%'
  const rate = (stats.value.matches.verified / stats.value.matches.total) * 100
  return `${rate.toFixed(1)}%`
})

const pipelineActive = computed(() => {
  if (!stats.value) return 0
  return stats.value.traces.pending + stats.value.traces.processing
})
</script>

<template>
  <div v-loading="dashboardStore.loading" class="dashboard">
    <el-alert
      v-if="dashboardStore.error"
      :title="dashboardStore.error"
      type="error"
      show-icon
      closable
      style="margin-bottom: 20px"
    />

    <template v-if="stats">
      <!-- Row 1: Stat Cards -->
      <el-row :gutter="20" class="dashboard-row">
        <el-col :xs="24" :sm="12" :md="6">
          <StatCard
            title="Watches"
            :value="stats.watches_total"
            icon="Goods"
            color="#6366F1"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <StatCard
            title="Transactions"
            :value="stats.transactions_total"
            icon="Collection"
            color="#22C55E"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <StatCard
            title="Catalog"
            :value="stats.catalog_total"
            icon="Collection"
            color="#F59E0B"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <StatCard
            title="Verification Rate"
            :value="verificationRate"
            icon="CircleCheck"
            color="#64748B"
            :subtitle="`${stats.matches.verified} / ${stats.matches.total}`"
          />
        </el-col>
      </el-row>

      <!-- Row 2: Charts -->
      <el-row :gutter="20" class="dashboard-row">
        <el-col :xs="24" :md="12">
          <SourcePieChart :data="stats.source_distribution" />
        </el-col>
        <el-col :xs="24" :md="12">
          <BrandBarChart :data="stats.top_brands" />
        </el-col>
      </el-row>

      <!-- Row 3: Pipeline Overview -->
      <el-row :gutter="20" class="dashboard-row">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span style="font-weight: 600">Pipeline Overview</span>
            </template>
            <el-row :gutter="20">
              <el-col :xs="12" :md="6">
                <div class="pipeline-stat">
                  <div class="pipeline-value" style="color: #F59E0B">{{ stats.traces.pending }}</div>
                  <div class="pipeline-label">Pending</div>
                </div>
              </el-col>
              <el-col :xs="12" :md="6">
                <div class="pipeline-stat">
                  <div class="pipeline-value" style="color: #6366F1">{{ stats.traces.processing }}</div>
                  <div class="pipeline-label">Processing</div>
                </div>
              </el-col>
              <el-col :xs="12" :md="6">
                <div class="pipeline-stat">
                  <div class="pipeline-value" style="color: #22C55E">{{ stats.traces.completed }}</div>
                  <div class="pipeline-label">Completed</div>
                </div>
              </el-col>
              <el-col :xs="12" :md="6">
                <div class="pipeline-stat">
                  <div class="pipeline-value" style="color: #EF4444">{{ stats.traces.failed }}</div>
                  <div class="pipeline-label">Failed</div>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-row {
  margin-bottom: 20px;
}

.pipeline-stat {
  text-align: center;
  padding: 16px 0;
}

.pipeline-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.pipeline-label {
  font-size: 13px;
  color: #64748B;
  margin-top: 4px;
}
</style>

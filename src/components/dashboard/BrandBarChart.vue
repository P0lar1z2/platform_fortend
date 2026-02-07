<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { BrandCount } from '@/types'
import './ChartSetup'

const props = defineProps<{
  data: BrandCount[]
}>()

const option = computed(() => {
  const sorted = [...props.data].reverse()
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: 10,
      right: 30,
      top: 10,
      bottom: 10,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#94A3B8' },
      splitLine: { lineStyle: { color: '#E2E8F0' } },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((b) => b.brand),
      axisLabel: {
        color: '#64748B',
        width: 80,
        overflow: 'truncate',
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((b) => b.count),
        barMaxWidth: 20,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#818CF8' },
              { offset: 1, color: '#6366F1' },
            ],
          },
        },
      },
    ],
  }
})
</script>

<template>
  <el-card>
    <template #header>
      <span style="font-weight: 600">Top Brands</span>
    </template>
    <v-chart :option="option" autoresize style="height: 300px" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { SourceCount } from '@/types'
import './ChartSetup'

const props = defineProps<{
  data: SourceCount[]
}>()

const sourceColors: Record<string, string> = {
  starbuyer: '#6366F1',
  ecoauc: '#22C55E',
  yahoo: '#EF4444',
  rakuten: '#F59E0B',
}

const option = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
    textStyle: { color: '#64748B' },
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      data: props.data.map((item) => ({
        name: item.source,
        value: item.count,
        itemStyle: { color: sourceColors[item.source.toLowerCase()] || '#94A3B8' },
      })),
    },
  ],
}))
</script>

<template>
  <el-card>
    <template #header>
      <span style="font-weight: 600">Source Distribution</span>
    </template>
    <v-chart :option="option" autoresize style="height: 300px" />
  </el-card>
</template>

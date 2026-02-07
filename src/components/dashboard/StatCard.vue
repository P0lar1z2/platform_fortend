<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon: string
  color: string
  subtitle?: string
}>()
</script>

<template>
  <el-card class="stat-card" :style="{ '--card-color': color }">
    <div class="stat-content">
      <div class="stat-icon">
        <el-icon size="28"><component :is="icon" /></el-icon>
      </div>
      <div class="stat-info">
        <div class="stat-value">{{ value }}</div>
        <div class="stat-title">{{ title }}</div>
        <div v-if="subtitle" class="stat-subtitle">{{ subtitle }}</div>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.stat-card {
  border-left: 4px solid var(--card-color);

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: color-mix(in srgb, var(--card-color) 12%, transparent);
  color: var(--card-color);
  flex-shrink: 0;
}

.stat-info {
  min-width: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: #1E293B;
}

.stat-title {
  font-size: 13px;
  color: #64748B;
  margin-top: 2px;
}

.stat-subtitle {
  font-size: 12px;
  color: #94A3B8;
  margin-top: 2px;
}
</style>

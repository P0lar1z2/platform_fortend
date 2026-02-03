<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  search: [{ brand?: string; keywords?: string; limit?: number }]
}>()

const searchType = ref<'brand' | 'keywords'>('brand')
const brand = ref('')
const keywords = ref('')
const limit = ref(20)

function handleSearch() {
  if (searchType.value === 'brand' && brand.value.trim()) {
    emit('search', { brand: brand.value.trim(), limit: limit.value })
  } else if (searchType.value === 'keywords' && keywords.value.trim()) {
    emit('search', { keywords: keywords.value.trim(), limit: limit.value })
  }
}

function handleReset() {
  brand.value = ''
  keywords.value = ''
  limit.value = 20
}
</script>

<template>
  <el-card class="watch-filters">
    <el-form :inline="true" @submit.prevent="handleSearch">
      <el-form-item label="Search by">
        <el-radio-group v-model="searchType">
          <el-radio-button value="brand">Brand</el-radio-button>
          <el-radio-button value="keywords">Keywords</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="searchType === 'brand'" label="Brand">
        <el-input
          v-model="brand"
          placeholder="e.g., Rolex, Omega"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>

      <el-form-item v-else label="Keywords">
        <el-input
          v-model="keywords"
          placeholder="e.g., submariner, speedmaster"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>

      <el-form-item label="Limit">
        <el-select v-model="limit" style="width: 100px">
          <el-option :value="10" label="10" />
          <el-option :value="20" label="20" />
          <el-option :value="50" label="50" />
          <el-option :value="100" label="100" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          Search
        </el-button>
        <el-button @click="handleReset">Reset</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.watch-filters {
  margin-bottom: 20px;
}
</style>

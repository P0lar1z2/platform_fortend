<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  search: [{ brand?: string; query?: string; limit?: number }]
}>()

const searchType = ref<'brand' | 'query'>('brand')
const brand = ref('')
const query = ref('')
const limit = ref(20)

function handleSearch() {
  if (searchType.value === 'brand' && brand.value.trim()) {
    emit('search', { brand: brand.value.trim(), limit: limit.value })
  } else if (searchType.value === 'query' && query.value.trim()) {
    emit('search', { query: query.value.trim(), limit: limit.value })
  }
}

function handleReset() {
  brand.value = ''
  query.value = ''
  limit.value = 20
}
</script>

<template>
  <el-card class="reference-filters">
    <el-form :inline="true" @submit.prevent="handleSearch">
      <el-form-item label="Search by">
        <el-radio-group v-model="searchType">
          <el-radio-button value="brand">Brand</el-radio-button>
          <el-radio-button value="query">Text Query</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="searchType === 'brand'" label="Brand">
        <el-input
          v-model="brand"
          placeholder="e.g., Rolex, Patek Philippe"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>

      <el-form-item v-else label="Query">
        <el-input
          v-model="query"
          placeholder="e.g., submariner 116610"
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
.reference-filters {
  margin-bottom: 20px;
}
</style>

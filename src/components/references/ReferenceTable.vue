<script setup lang="ts">
import { ref } from 'vue'
import type { ReferenceWatch } from '@/types'
import { formatPrice, formatConfidence } from '@/utils/formatters'

defineProps<{
  references: ReferenceWatch[]
  loading: boolean
}>()

const expandedRows = ref<string[]>([])

function toggleExpand(reference: ReferenceWatch) {
  const id = reference._id || reference.reference
  const index = expandedRows.value.indexOf(id)
  if (index > -1) {
    expandedRows.value.splice(index, 1)
  } else {
    expandedRows.value.push(id)
  }
}

function isExpanded(reference: ReferenceWatch): boolean {
  const id = reference._id || reference.reference
  return expandedRows.value.includes(id)
}
</script>

<template>
  <el-table
    :data="references"
    v-loading="loading"
    stripe
    style="width: 100%"
    row-key="_id"
  >
    <el-table-column type="expand">
      <template #default="{ row }">
        <div class="expanded-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <h4>Specifications</h4>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="Movement">
                  {{ row.specifications?.movement || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="Case Diameter">
                  {{ row.specifications?.case_diameter || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="Case Thickness">
                  {{ row.specifications?.case_thickness || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="Water Resistance">
                  {{ row.specifications?.water_resistance || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="Crystal">
                  {{ row.specifications?.crystal || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="Power Reserve">
                  {{ row.specifications?.power_reserve || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="Caliber">
                  {{ row.specifications?.caliber || '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </el-col>
            <el-col :span="12">
              <h4>Additional Info</h4>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="Full Name">
                  {{ row.full_name || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="Year Introduced">
                  {{ row.year_introduced || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="Year Discontinued">
                  {{ row.year_discontinued || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="Retail Price">
                  {{ formatPrice(row.retail_price, row.retail_currency) }}
                </el-descriptions-item>
                <el-descriptions-item label="Data Source">
                  {{ row.data_source }}
                </el-descriptions-item>
                <el-descriptions-item label="Aliases">
                  <div class="tags">
                    <el-tag
                      v-for="alias in row.aliases"
                      :key="alias"
                      type="info"
                      size="small"
                    >
                      {{ alias }}
                    </el-tag>
                    <span v-if="!row.aliases?.length" class="text-muted">None</span>
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </el-col>
          </el-row>
        </div>
      </template>
    </el-table-column>

    <el-table-column prop="brand" label="Brand" width="120">
      <template #default="{ row }">
        <el-tag type="primary" size="small">{{ row.brand }}</el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="model" label="Model" min-width="150" />

    <el-table-column prop="reference" label="Reference" width="140">
      <template #default="{ row }">
        <code>{{ row.reference }}</code>
      </template>
    </el-table-column>

    <el-table-column prop="full_name" label="Full Name" min-width="200">
      <template #default="{ row }">
        {{ row.full_name || '-' }}
      </template>
    </el-table-column>

    <el-table-column prop="year_introduced" label="Year" width="80">
      <template #default="{ row }">
        {{ row.year_introduced || '-' }}
      </template>
    </el-table-column>

    <el-table-column prop="retail_price" label="Retail Price" width="120">
      <template #default="{ row }">
        {{ formatPrice(row.retail_price, row.retail_currency) }}
      </template>
    </el-table-column>

    <el-table-column prop="confidence" label="Confidence" width="100">
      <template #default="{ row }">
        <el-tag :type="row.confidence >= 0.8 ? 'success' : 'warning'" effect="plain" size="small">
          {{ formatConfidence(row.confidence) }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="data_source" label="Source" width="100">
      <template #default="{ row }">
        <el-tag type="info" size="small">{{ row.data_source }}</el-tag>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="scss">
.expanded-content {
  padding: 20px;

  h4 {
    margin: 0 0 12px;
    color: #606266;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}

.text-muted {
  color: #909399;
}

code {
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>

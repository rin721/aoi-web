<script setup lang="ts">
import type { Category } from "~/types/api"

const props = defineProps<{
  categories: Category[]
  modelValue: string
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
  change: [value: string]
}>()

const tabItems = computed(() => props.categories.map((category) => ({
  value: category.slug,
  label: category.name
})))

function change(value: string) {
  emit("update:modelValue", value)
  emit("change", value)
}
</script>

<template>
  <div v-aoi-reveal="'fade'" class="category-tabs">
    <AoiTabs
      :model-value="modelValue"
      :items="tabItems"
      aria-label="内容分类"
      @update:model-value="change"
    />
  </div>
</template>

<style scoped>
.category-tabs {
  margin: 0 -10px;
  overflow-x: auto;
  padding: 0 10px 10px;
  scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tabs :deep(md-tabs) {
  min-width: max-content;
}

@media (max-width: 639px) {
  .category-tabs {
    margin: 0 -12px;
    padding: 0 12px 12px;
  }
}
</style>

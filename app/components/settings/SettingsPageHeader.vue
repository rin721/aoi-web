<script setup lang="ts">
withDefaults(defineProps<{
  description?: string
  title: string
}>(), {
  description: undefined
})
</script>

<template>
  <header v-aoi-reveal="'rise'" class="settings-page-header">
    <h1>{{ title }}</h1>
    <p v-if="description">{{ description }}</p>
  </header>
</template>

<style scoped>
.settings-page-header {
  display: grid;
  gap: 7px;
}

.settings-page-header h1,
.settings-page-header p {
  margin: 0;
}

.settings-page-header h1 {
  color: var(--aoi-text);
  font-size: 24px;
  line-height: 1.2;
}

.settings-page-header p {
  color: var(--aoi-text-muted);
  line-height: 1.7;
}
</style>

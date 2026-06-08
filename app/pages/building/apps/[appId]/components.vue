<script setup lang="ts">
import { computed } from "vue"
import AoiButton from "~/components/aoi/AoiButton.vue"
import LowCodeRenderer from "~/components/lowcode/LowCodeRenderer"
import { getComponentRegistry } from "~/lowcode/componentRegistry"
import { createBuilderComponentCatalogPageSchema } from "~/lowcode/schemas/builderComponentCatalogSchema"

if (!import.meta.dev) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page not found"
  })
}

const route = useRoute()
const appId = computed(() => {
  const value = route.params.appId

  if (Array.isArray(value)) {
    return value[0] || "mock-app"
  }

  return value || "mock-app"
})
const editorTo = computed(() => `/building/apps/${appId.value}/editor`)
const pageSchema = computed(() =>
  createBuilderComponentCatalogPageSchema(Object.values(getComponentRegistry()))
)

useHead(() => ({
  title: `Component Catalog - ${appId.value}`
}))
</script>

<template>
  <div class="aoi-page building-component-catalog-page">
    <header class="building-component-catalog-page__header">
      <div>
        <p>Low-code management page · {{ appId }}</p>
        <h1>组件列表管理页</h1>
      </div>

      <AoiButton
        icon="arrow-left"
        size="sm"
        :to="editorTo"
        variant="outlined"
      >
        返回编辑器
      </AoiButton>
    </header>

    <section
      class="building-component-catalog-page__canvas"
      aria-label="Schema rendered component catalog"
    >
      <LowCodeRenderer
        :data-sources="pageSchema.dataSources"
        :node="pageSchema.layout"
        :page-events="pageSchema.events"
        :theme="pageSchema.theme"
      />
    </section>
  </div>
</template>

<style scoped>
.building-component-catalog-page {
  display: grid;
  min-width: 0;
  gap: var(--aoi-grid-gap);
}

.building-component-catalog-page__header {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

.building-component-catalog-page__header div {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.building-component-catalog-page__header h1,
.building-component-catalog-page__header p {
  margin: 0;
}

.building-component-catalog-page__header h1 {
  color: var(--aoi-text);
  font-size: clamp(24px, 4vw, 38px);
  line-height: 1.1;
}

.building-component-catalog-page__header p {
  color: var(--aoi-text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.building-component-catalog-page__canvas {
  display: grid;
  min-width: 0;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: clamp(12px, 3vw, 18px);
}
</style>

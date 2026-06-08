<script setup lang="ts">
import AoiButton from "~/components/aoi/AoiButton.vue"
import type { LowCodeApp, LowCodeAppSummary, LowCodePage } from "~/types/lowcode"

defineProps<{
  appSchema: LowCodeApp
  apps: LowCodeAppSummary[]
  currentPageId?: string
}>()

const emit = defineEmits<{
  "create-page": []
  "select-page": [pageId: string]
}>()

function getEditorTo(appId: string) {
  return `/building/apps/${appId}/editor`
}

function formatPageLabel(page: LowCodePage) {
  return page.title || page.name
}
</script>

<template>
  <section class="building-editor-page-manager" aria-label="Page manager">
    <header class="building-editor-page-manager__header">
      <div>
        <h2>页面管理</h2>
        <p>{{ appSchema.name }}</p>
      </div>
      <strong>{{ appSchema.pages.length }}</strong>
    </header>

    <div class="building-editor-page-manager__section">
      <div class="building-editor-page-manager__section-header">
        <h3>应用</h3>
        <span>{{ apps.length }}</span>
      </div>

      <div class="building-editor-page-manager__app-list">
        <AoiButton
          v-for="app in apps"
          :key="app.id"
          size="sm"
          :to="getEditorTo(app.id)"
          :variant="app.id === appSchema.id ? 'tonal' : 'outlined'"
        >
          {{ app.name }} · {{ app.pageCount }}
        </AoiButton>
      </div>
    </div>

    <div class="building-editor-page-manager__section">
      <div class="building-editor-page-manager__section-header">
        <h3>页面</h3>
        <AoiButton
          icon="plus"
          size="sm"
          variant="tonal"
          @click="emit('create-page')"
        >
          创建页面
        </AoiButton>
      </div>

      <div class="building-editor-page-manager__page-list">
        <button
          v-for="page in appSchema.pages"
          :key="page.id"
          class="building-editor-page-manager__page"
          :class="{ 'building-editor-page-manager__page--selected': page.id === currentPageId }"
          type="button"
          :aria-pressed="page.id === currentPageId"
          @click="emit('select-page', page.id)"
        >
          <strong>{{ formatPageLabel(page) }}</strong>
          <code>{{ page.path }}</code>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.building-editor-page-manager {
  display: grid;
  min-width: 0;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-editor-page-manager__header,
.building-editor-page-manager__section-header {
  display: flex;
  min-width: 0;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.building-editor-page-manager h2,
.building-editor-page-manager h3,
.building-editor-page-manager p {
  margin: 0;
}

.building-editor-page-manager h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-editor-page-manager h3 {
  color: var(--aoi-text);
  font-size: 13px;
}

.building-editor-page-manager p,
.building-editor-page-manager code,
.building-editor-page-manager__section-header span {
  color: var(--aoi-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.building-editor-page-manager__header strong,
.building-editor-page-manager__section-header span {
  display: inline-grid;
  min-width: 28px;
  min-height: 26px;
  place-items: center;
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
  font-size: 12px;
  font-weight: 800;
}

.building-editor-page-manager__section,
.building-editor-page-manager__app-list,
.building-editor-page-manager__page-list {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.building-editor-page-manager__app-list {
  justify-items: start;
}

.building-editor-page-manager__page {
  display: grid;
  min-width: 0;
  width: 100%;
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-surface);
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  padding: 10px;
}

.building-editor-page-manager__page:hover,
.building-editor-page-manager__page--selected {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
}

.building-editor-page-manager__page:focus-visible {
  outline: var(--aoi-focus-ring-width) solid var(--aoi-focus);
  outline-offset: var(--aoi-focus-ring-offset);
}

.building-editor-page-manager__page strong,
.building-editor-page-manager__page code {
  min-width: 0;
  overflow-wrap: anywhere;
}

.building-editor-page-manager__page strong {
  color: var(--aoi-text);
  font-size: 14px;
}
</style>

<script setup lang="ts">
import { computed } from "vue"
import type { LowCodeApp } from "~/types/lowcode"

const props = defineProps<{
  appSchema: LowCodeApp
}>()

const { t } = useI18n()
const formattedSchema = computed(() => JSON.stringify(props.appSchema, null, 2))
</script>

<template>
  <section class="building-editor-schema-viewer" :aria-label="t('building.panels.schemaViewer.aria')">
    <header class="building-editor-schema-viewer__header">
      <div>
        <h2>{{ t("building.panels.schemaViewer.title") }}</h2>
        <p>{{ t("building.panels.schemaViewer.description") }}</p>
      </div>
      <code>{{ appSchema.id }}</code>
    </header>

    <pre>{{ formattedSchema }}</pre>
  </section>
</template>

<style scoped>
.building-editor-schema-viewer {
  display: grid;
  min-width: 0;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-editor-schema-viewer__header {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.building-editor-schema-viewer h2,
.building-editor-schema-viewer p {
  margin: 0;
}

.building-editor-schema-viewer h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-editor-schema-viewer p,
.building-editor-schema-viewer code {
  color: var(--aoi-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.building-editor-schema-viewer code {
  max-width: 100%;
  overflow-wrap: anywhere;
}

.building-editor-schema-viewer pre {
  min-width: 0;
  max-width: 100%;
  overflow: auto;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-code-bg, var(--aoi-surface));
  color: var(--aoi-text);
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  padding: 12px;
  white-space: pre;
}
</style>

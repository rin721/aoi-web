<script setup lang="ts">
import LowCodeRenderer from "~/components/lowcode/LowCodeRenderer"
import type { LowCodePage } from "~/types/lowcode"

defineProps<{
  pageSchema: LowCodePage
  selectedNodeId?: string | null
}>()

const { t } = useI18n()

const emit = defineEmits<{
  "select-node": [id: string]
}>()

function onCanvasClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const nodeElement = target?.closest<HTMLElement>("[data-lowcode-node-id]")
  const nodeId = nodeElement?.dataset.lowcodeNodeId

  if (!nodeId) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  emit("select-node", nodeId)
}
</script>

<template>
  <section class="building-editor-canvas" :aria-label="t('building.panels.canvas.aria')">
    <header class="building-editor-canvas__header">
      <div>
        <h2>{{ t("building.panels.canvas.title") }}</h2>
        <p>{{ pageSchema.title || pageSchema.name }}</p>
      </div>
      <code>{{ pageSchema.path }}</code>
    </header>

    <div
      class="building-editor-canvas__viewport"
      @click.capture="onCanvasClick"
    >
      <LowCodeRenderer
        :actions-enabled="false"
        :data-sources="pageSchema.dataSources"
        :node="pageSchema.layout"
        :page-events="pageSchema.events"
        :theme="pageSchema.theme"
        selectable
        :selected-node-id="selectedNodeId || undefined"
        @select-node="emit('select-node', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.building-editor-canvas {
  display: grid;
  min-width: 0;
  gap: 12px;
}

.building-editor-canvas__header {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-editor-canvas__header h2,
.building-editor-canvas__header p {
  margin: 0;
}

.building-editor-canvas__header h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-editor-canvas__header p,
.building-editor-canvas__header code {
  color: var(--aoi-text-muted);
  font-size: 12px;
}

.building-editor-canvas__header code {
  max-width: 100%;
  overflow-wrap: anywhere;
}

.building-editor-canvas__viewport {
  min-width: 0;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: clamp(16px, 3vw, 28px);
}

.building-editor-canvas__viewport :deep(.low-code-renderer-node) {
  cursor: pointer;
}

.building-editor-canvas__viewport :deep(.low-code-renderer-node:hover) {
  outline: 1px dashed var(--aoi-state-border-active);
  outline-offset: 3px;
}

.building-editor-canvas__viewport :deep(.low-code-renderer-node--selected) {
  outline: 2px solid var(--aoi-accent-60);
  outline-offset: 4px;
}
</style>

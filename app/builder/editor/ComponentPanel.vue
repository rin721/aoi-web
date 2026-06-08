<script setup lang="ts">
import { computed } from "vue"
import { componentRegistry } from "~/lowcode/componentRegistry"

const components = computed(() =>
  Object.values(componentRegistry).sort((left, right) => left.name.localeCompare(right.name))
)

const emit = defineEmits<{
  "add-component": [type: string]
}>()
</script>

<template>
  <section class="building-editor-panel" aria-label="Component panel">
    <header class="building-editor-panel__header">
      <div>
        <h2>ComponentPanel</h2>
        <p>组件面板</p>
      </div>
      <strong>{{ components.length }}</strong>
    </header>

    <div class="building-editor-component-list">
      <button
        v-for="component in components"
        :key="component.type"
        class="building-editor-component-card"
        type="button"
        @click="emit('add-component', component.type)"
      >
        <span>{{ component.category }}</span>
        <strong>{{ component.name }}</strong>
        <code>{{ component.type }}</code>
        <em>添加到画布</em>
      </button>
    </div>
  </section>
</template>

<style scoped>
.building-editor-panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-editor-panel__header {
  display: flex;
  min-width: 0;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.building-editor-panel__header h2,
.building-editor-panel__header p {
  margin: 0;
}

.building-editor-panel__header h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-editor-panel__header p,
.building-editor-component-card span,
.building-editor-component-card code {
  color: var(--aoi-text-muted);
  font-size: 12px;
}

.building-editor-panel__header strong {
  display: inline-grid;
  min-width: 32px;
  min-height: 28px;
  place-items: center;
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
  font-size: 13px;
}

.building-editor-component-list {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.building-editor-component-card {
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

.building-editor-component-card:hover {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
}

.building-editor-component-card:focus-visible {
  outline: var(--aoi-focus-ring-width) solid var(--aoi-focus);
  outline-offset: var(--aoi-focus-ring-offset);
}

.building-editor-component-card strong,
.building-editor-component-card code,
.building-editor-component-card em {
  min-width: 0;
  overflow-wrap: anywhere;
}

.building-editor-component-card strong {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-editor-component-card em {
  color: var(--aoi-accent-60);
  font-size: 12px;
  font-style: normal;
  font-weight: 760;
}
</style>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { getComponentRegistry } from "~/lowcode/componentRegistry"
import { translateComponentCategory, translateComponentName } from "~/lowcode/componentI18n"
import { subscribe as subscribeToPluginRegistry } from "~/lowcode/plugins/pluginRegistry"

const { t } = useI18n()
const pluginRegistryVersion = ref(0)
let unsubscribeFromPluginRegistry: (() => void) | undefined

const components = computed(() => {
  pluginRegistryVersion.value

  return Object.values(getComponentRegistry())
    .map((component) => ({
      ...component,
      categoryLabel: translateComponentCategory(component, t),
      nameLabel: translateComponentName(component, t)
    }))
    .sort((left, right) => left.nameLabel.localeCompare(right.nameLabel))
})

const emit = defineEmits<{
  "add-component": [type: string]
}>()

onMounted(() => {
  unsubscribeFromPluginRegistry = subscribeToPluginRegistry(() => {
    pluginRegistryVersion.value += 1
  })
})

onBeforeUnmount(() => {
  unsubscribeFromPluginRegistry?.()
})
</script>

<template>
  <section class="building-editor-panel" :aria-label="t('building.panels.component.aria')">
    <header class="building-editor-panel__header">
      <div>
        <h2>{{ t("building.panels.component.title") }}</h2>
        <p>{{ t("building.panels.component.description") }}</p>
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
        <span>{{ component.categoryLabel }}</span>
        <strong>{{ component.nameLabel }}</strong>
        <code>{{ component.type }}</code>
        <em>{{ t("building.panels.component.addToCanvas") }}</em>
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

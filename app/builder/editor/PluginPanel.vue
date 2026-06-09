<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import AoiButton from "~/components/aoi/AoiButton.vue"
import {
  disablePlugin,
  enablePlugin,
  listPlugins,
  subscribe as subscribeToPluginRegistry
} from "~/lowcode/plugins/pluginRegistry"

const { t } = useI18n()
const pluginRegistryVersion = ref(0)
let unsubscribeFromPluginRegistry: (() => void) | undefined

const plugins = computed(() => {
  pluginRegistryVersion.value

  return listPlugins()
})

function togglePlugin(pluginId: string, enabled: boolean) {
  if (enabled) {
    disablePlugin(pluginId)
  } else {
    enablePlugin(pluginId)
  }
}

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
  <section class="building-editor-plugin-panel" :aria-label="t('building.panels.plugin.aria')">
    <header class="building-editor-plugin-panel__header">
      <div>
        <h2>{{ t("building.panels.plugin.title") }}</h2>
        <p>{{ t("building.panels.plugin.description") }}</p>
      </div>
      <strong>{{ plugins.length }}</strong>
    </header>

    <div
      v-if="plugins.length"
      class="building-editor-plugin-list"
    >
      <article
        v-for="plugin in plugins"
        :key="plugin.id"
        class="building-editor-plugin-card"
      >
        <div class="building-editor-plugin-card__summary">
          <span :class="{ 'building-editor-plugin-card__status--enabled': plugin.enabled }">
            {{ plugin.enabled ? t("building.common.enabled") : t("building.common.disabled") }}
          </span>
          <strong>{{ plugin.name }}</strong>
          <code>{{ plugin.id }}</code>
          <em>{{ plugin.contributionKinds.join(", ") }}</em>
        </div>

        <AoiButton
          :icon="plugin.enabled ? 'circle-pause' : 'circle-play'"
          size="sm"
          :variant="plugin.enabled ? 'outlined' : 'tonal'"
          @click="togglePlugin(plugin.id, plugin.enabled)"
        >
          {{ plugin.enabled ? t("building.common.disable") : t("building.common.enable") }}
        </AoiButton>
      </article>
    </div>

    <div
      v-else
      class="building-editor-plugin-panel__empty"
    >
      <strong>{{ t("building.panels.plugin.emptyTitle") }}</strong>
      <p>{{ t("building.panels.plugin.emptyDescription") }}</p>
    </div>
  </section>
</template>

<style scoped>
.building-editor-plugin-panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-editor-plugin-panel__header {
  display: flex;
  min-width: 0;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.building-editor-plugin-panel__header h2,
.building-editor-plugin-panel__header p {
  margin: 0;
}

.building-editor-plugin-panel__header h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-editor-plugin-panel__header p,
.building-editor-plugin-card__summary span,
.building-editor-plugin-card__summary code,
.building-editor-plugin-card__summary em,
.building-editor-plugin-panel__empty p {
  color: var(--aoi-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.building-editor-plugin-panel__header strong {
  display: inline-grid;
  min-width: 32px;
  min-height: 28px;
  place-items: center;
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
  font-size: 13px;
}

.building-editor-plugin-list,
.building-editor-plugin-card,
.building-editor-plugin-card__summary,
.building-editor-plugin-panel__empty {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.building-editor-plugin-card,
.building-editor-plugin-panel__empty {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-surface);
  padding: 10px;
}

.building-editor-plugin-card__summary strong,
.building-editor-plugin-card__summary code,
.building-editor-plugin-card__summary em,
.building-editor-plugin-panel__empty strong,
.building-editor-plugin-panel__empty p {
  min-width: 0;
  overflow-wrap: anywhere;
}

.building-editor-plugin-card__summary strong,
.building-editor-plugin-panel__empty strong {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-editor-plugin-card__summary em {
  font-style: normal;
}

.building-editor-plugin-card__summary .building-editor-plugin-card__status--enabled {
  color: var(--aoi-accent-60);
  font-weight: 800;
}
</style>

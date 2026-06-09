<script setup lang="ts">
import { computed } from "vue"
import AoiButton from "~/components/aoi/AoiButton.vue"
import type { LowCodePage, PageVersion } from "~/types/lowcode"

defineProps<{
  page?: LowCodePage | null
  versions: PageVersion[]
}>()

const { t } = useI18n()

const emit = defineEmits<{
  "restore-version": [version: PageVersion]
}>()

function formatDate(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function formatVersionSchema(version: PageVersion) {
  return JSON.stringify(version.schema, null, 2)
}

const versionCountLabel = computed(() => (count: number) => `${count}`)
</script>

<template>
  <section class="building-editor-version-panel" :aria-label="t('building.panels.version.aria')">
    <header class="building-editor-version-panel__header">
      <div>
        <h2>{{ t("building.panels.version.title") }}</h2>
        <p>{{ t("building.panels.version.description") }}</p>
      </div>
      <strong>{{ versionCountLabel(versions.length) }}</strong>
    </header>

    <div
      v-if="!page"
      class="building-editor-version-panel__empty"
    >
      <strong>{{ t("building.panels.version.noPageTitle") }}</strong>
      <p>{{ t("building.panels.version.noPageDescription") }}</p>
    </div>

    <div
      v-else-if="!versions.length"
      class="building-editor-version-panel__empty"
    >
      <strong>{{ t("building.panels.version.emptyTitle") }}</strong>
      <p>{{ t("building.panels.version.emptyDescription") }}</p>
    </div>

    <div
      v-else
      class="building-editor-version-list"
    >
      <article
        v-for="version in versions"
        :key="version.id"
        class="building-editor-version-card"
      >
        <div class="building-editor-version-card__summary">
          <strong>{{ version.label }}</strong>
          <span>{{ formatDate(version.createdAt) }}</span>
          <code>{{ version.id }}</code>
        </div>

        <AoiButton
          icon="history"
          size="sm"
          variant="outlined"
          @click="emit('restore-version', version)"
        >
          {{ t("building.common.restore") }}
        </AoiButton>

        <details class="building-editor-version-card__details">
          <summary>{{ t("building.common.viewJson") }}</summary>
          <pre>{{ formatVersionSchema(version) }}</pre>
        </details>
      </article>
    </div>
  </section>
</template>

<style scoped>
.building-editor-version-panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-editor-version-panel__header {
  display: flex;
  min-width: 0;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.building-editor-version-panel__header h2,
.building-editor-version-panel__header p,
.building-editor-version-panel__empty p {
  margin: 0;
}

.building-editor-version-panel__header h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-editor-version-panel__header p,
.building-editor-version-card__summary span,
.building-editor-version-card__summary code,
.building-editor-version-panel__empty p,
.building-editor-version-card__details summary {
  color: var(--aoi-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.building-editor-version-panel__header strong {
  display: inline-grid;
  min-width: 32px;
  min-height: 28px;
  place-items: center;
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
  font-size: 13px;
}

.building-editor-version-panel__empty,
.building-editor-version-list,
.building-editor-version-card,
.building-editor-version-card__summary,
.building-editor-version-card__details {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.building-editor-version-panel__empty,
.building-editor-version-card {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-surface);
  padding: 10px;
}

.building-editor-version-panel__empty strong,
.building-editor-version-card__summary strong,
.building-editor-version-card__summary code {
  min-width: 0;
  overflow-wrap: anywhere;
}

.building-editor-version-panel__empty strong,
.building-editor-version-card__summary strong {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-editor-version-card__details summary {
  cursor: pointer;
  font-weight: 760;
}

.building-editor-version-card__details pre {
  max-height: 220px;
  min-width: 0;
  overflow: auto;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-code-bg, var(--aoi-surface));
  color: var(--aoi-text);
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  padding: 10px;
  white-space: pre;
}
</style>

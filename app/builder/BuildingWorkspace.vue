<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import BuilderShell from "~/builder/BuilderShell.vue"
import { listLowCodeApps } from "~/builder/editor/schemaStorage"
import { getComponentRegistry } from "~/lowcode/componentRegistry"
import { getDefaultDataSources } from "~/lowcode/dataSources/dataSourceRegistry"
import { mockLowCodeApp } from "~/lowcode/schemas/mockPageSchema"
import { getThemes } from "~/lowcode/themes/themeRegistry"
import type { LowCodeAppSummary } from "~/types/lowcode"

interface PlatformStage {
  description: string
  label: string
  status: "done" | "next" | "later"
}

const apps = ref<LowCodeAppSummary[]>(listLowCodeApps())
const { t } = useI18n()
const componentCount = computed(() => Object.keys(getComponentRegistry()).length)
const dataSourceCount = computed(() => getDefaultDataSources().length)
const themeCount = computed(() => getThemes().length)
const defaultEditorTo = computed(() => `/building/apps/${mockLowCodeApp.id}/editor`)
const platformStats = computed(() => [
  { label: t("building.console.stats.apps"), value: apps.value.length },
  { label: t("building.console.stats.components"), value: componentCount.value },
  { label: t("building.console.stats.dataSources"), value: dataSourceCount.value },
  { label: t("building.console.stats.themes"), value: themeCount.value }
])
const platformStages = computed<PlatformStage[]>(() => [
  {
    description: t("building.console.stages.schema.description"),
    label: t("building.console.stages.schema.label"),
    status: "done"
  },
  {
    description: t("building.console.stages.data.description"),
    label: t("building.console.stages.data.label"),
    status: "next"
  },
  {
    description: t("building.console.stages.advanced.description"),
    label: t("building.console.stages.advanced.label"),
    status: "later"
  }
])

function refreshApps() {
  apps.value = listLowCodeApps()
}

function getEditorTo(appId: string) {
  return `/building/apps/${appId}/editor`
}

function getPreviewTo(appId: string) {
  return `/building/apps/${appId}/preview`
}

function getRuntimeTo(appId: string) {
  return `/building/apps/${appId}/runtime`
}

function formatPageCount(count: number) {
  return t("building.common.pageCount", { count })
}

function getStageStatusLabel(status: PlatformStage["status"]) {
  return t(`building.console.stageStatus.${status}`)
}

onMounted(refreshApps)
</script>

<template>
  <div class="aoi-page building-page">
    <BuilderShell
      :title="t('building.console.title')"
      :description="t('building.console.description')"
    >
      <template #toolbar>
        <span class="building-toolbar-badge">/building</span>
        <span class="building-toolbar-badge">{{ t("building.common.devOnly") }}</span>
        <span class="building-toolbar-badge">lowcode.app.v1</span>
        <AoiButton
          icon="hammer"
          size="sm"
          :to="defaultEditorTo"
          variant="tonal"
        >
          {{ t("building.console.openEditor") }}
        </AoiButton>
      </template>

      <template #resources>
        <section class="building-console-panel" :aria-label="t('building.console.resourcesAria')">
          <header>
            <h2>{{ t("building.console.resourcesTitle") }}</h2>
            <p>{{ t("building.console.resourcesDescription") }}</p>
          </header>

          <div class="building-console-stats">
            <div
              v-for="item in platformStats"
              :key="item.label"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </section>

        <section class="building-console-panel" :aria-label="t('building.console.roadmapAria')">
          <header>
            <h2>{{ t("building.console.roadmapTitle") }}</h2>
            <p>{{ t("building.console.roadmapDescription") }}</p>
          </header>

          <ol class="building-console-stage-list">
            <li
              v-for="stage in platformStages"
              :key="stage.label"
              :class="`building-console-stage-list__item--${stage.status}`"
            >
              <span>{{ getStageStatusLabel(stage.status) }}</span>
              <strong>{{ stage.label }}</strong>
              <p>{{ stage.description }}</p>
            </li>
          </ol>
        </section>
      </template>

      <template #canvas>
        <section class="building-console-hero" :aria-label="t('building.console.heroAria')">
          <div>
            <p>{{ t("building.console.heroEyebrow") }}</p>
            <h2>{{ t("building.console.heroTitle") }}</h2>
            <span>
              {{ t("building.console.heroDescription") }}
            </span>
          </div>

          <div class="building-console-hero__actions">
            <AoiButton
              icon="hammer"
              :to="defaultEditorTo"
              variant="filled"
            >
              {{ t("building.console.startFromMock") }}
            </AoiButton>
            <AoiButton
              icon="play"
              :to="getRuntimeTo(mockLowCodeApp.id)"
              variant="outlined"
            >
              {{ t("building.common.openRuntime") }}
            </AoiButton>
          </div>
        </section>

        <section class="building-console-panel" :aria-label="t('building.console.localAppsAria')">
          <header class="building-console-panel__split">
            <div>
              <h2>{{ t("building.console.localAppsTitle") }}</h2>
              <p>{{ t("building.console.localAppsDescription") }}</p>
            </div>
            <AoiButton
              icon="refresh-cw"
              size="sm"
              variant="outlined"
              @click="refreshApps"
            >
              {{ t("building.common.refresh") }}
            </AoiButton>
          </header>

          <div class="building-app-grid">
            <article
              v-for="app in apps"
              :key="app.id"
              class="building-app-card"
            >
              <div>
                <span>{{ app.id }}</span>
                <strong>{{ app.name }}</strong>
                <p>{{ formatPageCount(app.pageCount) }}</p>
              </div>

              <div class="building-app-card__actions">
                <AoiButton
                  icon="pencil"
                  size="sm"
                  :to="getEditorTo(app.id)"
                  variant="tonal"
                >
                  {{ t("building.common.editor") }}
                </AoiButton>
                <AoiButton
                  icon="eye"
                  size="sm"
                  :to="getPreviewTo(app.id)"
                  variant="outlined"
                >
                  {{ t("building.common.preview") }}
                </AoiButton>
                <AoiButton
                  icon="play"
                  size="sm"
                  :to="getRuntimeTo(app.id)"
                  variant="outlined"
                >
                  {{ t("building.common.runtime") }}
                </AoiButton>
              </div>
            </article>
          </div>
        </section>
      </template>

      <template #inspector>
        <section class="building-console-panel" :aria-label="t('building.console.contractAria')">
          <header>
            <h2>{{ t("building.console.contractTitle") }}</h2>
            <p>{{ t("building.console.contractDescription") }}</p>
          </header>

          <ul class="building-console-contract">
            <li>{{ t("building.console.contract.appBoundary") }}</li>
            <li>{{ t("building.console.contract.layoutPrimary") }}</li>
            <li>{{ t("building.console.contract.recursiveNodes") }}</li>
            <li>{{ t("building.console.contract.registryRenderer") }}</li>
            <li>{{ t("building.console.contract.sqliteLocal") }}</li>
          </ul>
        </section>
      </template>
    </BuilderShell>
  </div>
</template>

<style scoped>
.building-page {
  min-width: 0;
}

.building-toolbar-badge {
  display: inline-grid;
  min-height: var(--aoi-control-height-sm);
  place-items: center;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-card-bg);
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 800;
  padding: 0 10px;
}

.building-console-panel,
.building-console-hero,
.building-app-card {
  display: grid;
  min-width: 0;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-console-panel header,
.building-console-panel__split,
.building-console-hero > div,
.building-app-card > div {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.building-console-panel__split {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
}

.building-console-panel h2,
.building-console-panel p,
.building-console-hero h2,
.building-console-hero p,
.building-console-hero span,
.building-app-card p,
.building-console-contract {
  margin: 0;
}

.building-console-panel h2,
.building-app-card strong {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-console-hero h2 {
  max-width: 760px;
  color: var(--aoi-text);
  font-size: clamp(28px, 5vw, 48px);
  line-height: 1.05;
}

.building-console-panel p,
.building-console-hero span,
.building-app-card p,
.building-app-card span,
.building-console-contract,
.building-console-stage-list p {
  color: var(--aoi-text-muted);
  font-size: 13px;
  line-height: 1.55;
}

.building-console-hero > div > p {
  color: var(--aoi-accent-60);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.building-console-hero__actions,
.building-app-card__actions {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
}

.building-console-stats {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.building-console-stats div {
  display: grid;
  min-width: 0;
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-surface);
  padding: 10px;
}

.building-console-stats span {
  color: var(--aoi-text-muted);
  font-size: 12px;
}

.building-console-stats strong {
  color: var(--aoi-accent-60);
  font-size: 22px;
}

.building-console-stage-list,
.building-console-contract,
.building-app-grid {
  display: grid;
  min-width: 0;
  gap: 10px;
}

.building-console-stage-list,
.building-console-contract {
  list-style: none;
  padding: 0;
}

.building-console-stage-list li,
.building-console-contract li {
  display: grid;
  min-width: 0;
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-surface);
  padding: 10px;
}

.building-console-stage-list span {
  width: fit-content;
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
  font-size: 11px;
  font-weight: 850;
  padding: 3px 7px;
  text-transform: uppercase;
}

.building-console-stage-list strong {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-app-grid {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.building-app-card span,
.building-app-card strong,
.building-app-card p {
  min-width: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .building-console-panel__split {
    grid-template-columns: minmax(0, 1fr);
  }

  .building-console-stats {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

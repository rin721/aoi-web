<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import AoiButton from "~/components/aoi/AoiButton.vue"
import LowCodeRenderer from "~/components/lowcode/LowCodeRenderer"
import {
  loadLowCodeApp,
  loadOrCreateLowCodeApp,
  normalizeLowCodeApp
} from "~/builder/editor/schemaStorage"
import type { LowCodeApp, LowCodePage } from "~/types/lowcode"

const props = defineProps<{
  appId: string
  pagePath?: string | string[]
}>()

const { t } = useI18n()
const appSchema = ref<LowCodeApp>(normalizeLowCodeApp(loadOrCreateLowCodeApp(props.appId)))
const restoredFromLocal = ref(false)

const requestedPath = computed(() => normalizeRequestedPath(props.pagePath))
const matchedPage = computed(() => {
  const path = requestedPath.value

  if (!path) {
    return null
  }

  return appSchema.value.pages.find((page) => page.path === path) || null
})
const fallbackPage = computed(() =>
  appSchema.value.pages.find((page) => page.id === appSchema.value.currentPageId)
  || appSchema.value.pages[0]
  || null
)
const pageSchema = computed<LowCodePage | null>(() =>
  matchedPage.value || fallbackPage.value
)
const usingFallback = computed(() => Boolean(requestedPath.value && !matchedPage.value))
const editorTo = computed(() => `/building/apps/${props.appId}/editor`)

function normalizeRequestedPath(pagePath?: string | string[]) {
  const segments = Array.isArray(pagePath)
    ? pagePath
    : pagePath
      ? [pagePath]
      : []

  const joined = segments
    .flatMap((segment) => segment.split("/"))
    .map((segment) => decodeURIComponent(segment).trim())
    .filter(Boolean)
    .join("/")

  return joined ? `/${joined}` : ""
}

onMounted(() => {
  const stored = loadLowCodeApp(props.appId)

  if (stored) {
    appSchema.value = normalizeLowCodeApp(stored)
    restoredFromLocal.value = true
  }
})
</script>

<template>
  <div class="aoi-page building-preview-page">
    <header class="building-preview-page__header">
      <div>
        <p class="building-preview-page__eyebrow">{{ t("building.preview.eyebrow", { appId }) }}</p>
        <h1>{{ pageSchema?.title || pageSchema?.name || t("building.common.preview") }}</h1>
        <p v-if="usingFallback">
          {{ t("building.preview.fallbackNotice", { path: requestedPath }) }}
        </p>
        <p v-else>
          {{ restoredFromLocal ? t("building.preview.restoredNotice") : t("building.preview.defaultNotice") }}
        </p>
      </div>

      <AoiButton
        icon="arrow-left"
        size="sm"
        :to="editorTo"
        variant="outlined"
      >
        {{ t("building.common.backToEditor") }}
      </AoiButton>
    </header>

    <main class="building-preview-page__canvas" :aria-label="t('building.preview.canvasAria')">
      <LowCodeRenderer
        v-if="pageSchema"
        :data-sources="pageSchema.dataSources"
        :node="pageSchema.layout"
        :page-events="pageSchema.events"
        :theme="pageSchema.theme"
      />

      <p v-else class="building-preview-page__empty">
        {{ t("building.preview.empty") }}
      </p>
    </main>
  </div>
</template>

<style scoped>
.building-preview-page {
  display: grid;
  min-width: 0;
  gap: var(--aoi-grid-gap);
}

.building-preview-page__header {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 16px;
}

.building-preview-page__header h1,
.building-preview-page__header p,
.building-preview-page__empty {
  margin: 0;
}

.building-preview-page__header h1 {
  color: var(--aoi-text);
  font-size: 28px;
  line-height: 1.12;
}

.building-preview-page__header p,
.building-preview-page__empty {
  color: var(--aoi-text-muted);
  line-height: 1.6;
}

.building-preview-page__eyebrow {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.building-preview-page__canvas {
  min-width: 0;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: clamp(16px, 3vw, 28px);
}
</style>

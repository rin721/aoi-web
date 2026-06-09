<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import LowCodeRenderer from "~/components/lowcode/LowCodeRenderer"
import { resolveRuntimeDataSources } from "~/lowcode/dataSources/dataSourceManager"
import {
  loadOrCreateRuntimeLowCodeApp,
  loadRuntimeLowCodeApp,
  normalizeRuntimeLowCodeApp
} from "~/lowcode/runtime/lowCodeRuntimeApp"
import type { LowCodeApp, LowCodePage } from "~/types/lowcode"

const props = defineProps<{
  appId: string
  pagePath?: string | string[]
}>()

const { t } = useI18n()
const appSchema = ref<LowCodeApp>(normalizeRuntimeLowCodeApp(loadOrCreateRuntimeLowCodeApp(props.appId)))

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
const runtimeDataSources = computed(() =>
  pageSchema.value ? resolveRuntimeDataSources(appSchema.value, pageSchema.value) : []
)

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
  const stored = loadRuntimeLowCodeApp(props.appId)

  if (stored) {
    appSchema.value = normalizeRuntimeLowCodeApp(stored)
  }
})
</script>

<template>
  <main class="low-code-runtime-view" :aria-label="t('building.runtime.aria')">
    <p
      v-if="usingFallback"
      class="low-code-runtime-view__notice"
      role="status"
    >
      {{ t("building.runtime.fallbackNotice", { path: requestedPath }) }}
    </p>

    <LowCodeRenderer
      v-if="pageSchema"
      :data-sources="runtimeDataSources"
      :node="pageSchema.layout"
      :page-events="pageSchema.events"
      :theme="pageSchema.theme"
    />

    <p v-else class="low-code-runtime-view__notice">
      {{ t("building.runtime.empty") }}
    </p>
  </main>
</template>

<style scoped>
.low-code-runtime-view {
  display: grid;
  min-width: 0;
  gap: var(--aoi-grid-gap);
}

.low-code-runtime-view__notice {
  margin: 0;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  color: var(--aoi-text-muted);
  line-height: 1.6;
  padding: 12px 14px;
}
</style>

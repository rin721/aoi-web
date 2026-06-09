<script setup lang="ts">
import { computed, ref } from "vue"
import AoiButton from "~/components/aoi/AoiButton.vue"
import AoiTextField from "~/components/aoi/AoiTextField.vue"
import { formatLowCodeAppExport, parseLowCodeAppImport } from "~/builder/editor/publishSchema"
import type { LowCodeApp, LowCodePage } from "~/types/lowcode"

const props = defineProps<{
  appSchema: LowCodeApp
  currentPage?: LowCodePage | null
}>()

const emit = defineEmits<{
  "import-app": [appSchema: LowCodeApp]
}>()

const { t } = useI18n()
const importJson = ref("")
const statusMessage = ref("")
const statusTone = ref<"info" | "success" | "danger">("info")

const formattedSchema = computed(() => formatLowCodeAppExport(props.appSchema))
const pageCountLabel = computed(() => `${props.appSchema.pages.length}`)
const currentPagePath = computed(() => props.currentPage?.path || t("building.common.none"))

function setStatus(message: string, tone: "info" | "success" | "danger" = "info") {
  statusMessage.value = message
  statusTone.value = tone
}

async function copyExportJson() {
  if (!import.meta.client) {
    setStatus(t("building.panels.publish.copyBrowserOnly"), "danger")
    return
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(formattedSchema.value)
      setStatus(t("building.panels.publish.copySuccess"), "success")
      return
    }

    const textarea = document.createElement("textarea")
    textarea.value = formattedSchema.value
    textarea.setAttribute("readonly", "true")
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.append(textarea)
    textarea.select()
    const copied = document.execCommand("copy")
    textarea.remove()

    setStatus(
      copied ? t("building.panels.publish.copySuccess") : t("building.panels.publish.copyFailedManual"),
      copied ? "success" : "danger"
    )
  } catch {
    setStatus(t("building.panels.publish.copyPermissionFailed"), "danger")
  }
}

function downloadExportJson() {
  if (!import.meta.client) {
    setStatus(t("building.panels.publish.downloadBrowserOnly"), "danger")
    return
  }

  try {
    const blob = new Blob([formattedSchema.value], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `lowcode-app-${props.appSchema.id}.json`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setStatus(t("building.panels.publish.downloadSuccess"), "success")
  } catch {
    setStatus(t("building.panels.publish.downloadFailed"), "danger")
  }
}

function importAppSchema() {
  const importedApp = parseLowCodeAppImport(importJson.value)

  if (!importedApp) {
    setStatus(t("building.panels.publish.importInvalid"), "danger")
    return
  }

  emit("import-app", importedApp)
  importJson.value = ""
  setStatus(t("building.panels.publish.importSuccess"), "success")
}
</script>

<template>
  <section class="building-editor-publish-panel" :aria-label="t('building.panels.publish.aria')">
    <header class="building-editor-publish-panel__header">
      <div>
        <h2>{{ t("building.panels.publish.title") }}</h2>
        <p>{{ t("building.panels.publish.description") }}</p>
      </div>
    </header>

    <div class="building-editor-publish-panel__stats" :aria-label="t('building.panels.publish.statsAria')">
      <div>
        <span>{{ t("building.common.app") }}</span>
        <strong>{{ appSchema.id }}</strong>
      </div>
      <div>
        <span>{{ t("building.common.pages") }}</span>
        <strong>{{ pageCountLabel }}</strong>
      </div>
      <div class="building-editor-publish-panel__wide">
        <span>{{ t("building.panels.publish.currentPath") }}</span>
        <strong>{{ currentPagePath }}</strong>
      </div>
    </div>

    <div class="building-editor-publish-panel__actions">
      <AoiButton
        icon="copy"
        size="sm"
        variant="tonal"
        @click="copyExportJson"
      >
        {{ t("building.panels.publish.copyJson") }}
      </AoiButton>
      <AoiButton
        icon="download"
        size="sm"
        variant="outlined"
        @click="downloadExportJson"
      >
        {{ t("building.panels.publish.downloadJson") }}
      </AoiButton>
    </div>

    <AoiTextField
      v-model="importJson"
      class="building-editor-publish-panel__import"
      icon="upload"
      :label="t('building.panels.publish.importLabel')"
      multiline
      placeholder="{ &quot;schemaVersion&quot;: &quot;lowcode.app.v1&quot;, ... }"
      :rows="8"
      variant="outlined"
    />

    <AoiButton
      icon="upload"
      size="sm"
      :disabled="!importJson.trim()"
      variant="outlined"
      @click="importAppSchema"
    >
      {{ t("building.panels.publish.importToCurrent") }}
    </AoiButton>

    <p
      v-if="statusMessage"
      class="building-editor-publish-panel__status"
      :class="`building-editor-publish-panel__status--${statusTone}`"
      role="status"
    >
      {{ statusMessage }}
    </p>
  </section>
</template>

<style scoped>
.building-editor-publish-panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-editor-publish-panel__header {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.building-editor-publish-panel h2,
.building-editor-publish-panel p {
  margin: 0;
}

.building-editor-publish-panel h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-editor-publish-panel p {
  color: var(--aoi-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.building-editor-publish-panel__stats {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.building-editor-publish-panel__stats div {
  display: grid;
  min-width: 0;
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-surface);
  padding: 10px;
}

.building-editor-publish-panel__stats span {
  color: var(--aoi-text-muted);
  font-size: 12px;
}

.building-editor-publish-panel__stats strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--aoi-text);
  font-size: 13px;
  line-height: 1.45;
}

.building-editor-publish-panel__wide {
  grid-column: 1 / -1;
}

.building-editor-publish-panel__actions {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
}

.building-editor-publish-panel__import {
  min-width: 0;
}

.building-editor-publish-panel__status {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  padding: 8px 10px;
}

.building-editor-publish-panel__status--success {
  border-color: var(--aoi-success-border, var(--aoi-border));
  color: var(--aoi-success, var(--aoi-text));
}

.building-editor-publish-panel__status--danger {
  border-color: var(--aoi-danger, var(--aoi-border));
  color: var(--aoi-danger, var(--aoi-text));
}
</style>

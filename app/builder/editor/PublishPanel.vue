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

const importJson = ref("")
const statusMessage = ref("")
const statusTone = ref<"info" | "success" | "danger">("info")

const formattedSchema = computed(() => formatLowCodeAppExport(props.appSchema))
const pageCountLabel = computed(() => `${props.appSchema.pages.length}`)
const currentPagePath = computed(() => props.currentPage?.path || "none")

function setStatus(message: string, tone: "info" | "success" | "danger" = "info") {
  statusMessage.value = message
  statusTone.value = tone
}

async function copyExportJson() {
  if (!import.meta.client) {
    setStatus("复制仅在浏览器中可用。", "danger")
    return
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(formattedSchema.value)
      setStatus("已复制当前应用 JSON。", "success")
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

    setStatus(copied ? "已复制当前应用 JSON。" : "复制失败，请手动选择 SchemaViewer 内容。", copied ? "success" : "danger")
  } catch {
    setStatus("复制失败，请检查浏览器剪贴板权限。", "danger")
  }
}

function downloadExportJson() {
  if (!import.meta.client) {
    setStatus("下载仅在浏览器中可用。", "danger")
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
    setStatus("已生成应用 JSON 下载。", "success")
  } catch {
    setStatus("下载失败，请检查浏览器文件下载权限。", "danger")
  }
}

function importAppSchema() {
  const importedApp = parseLowCodeAppImport(importJson.value)

  if (!importedApp) {
    setStatus("导入失败：请输入合法的 LowCodeApp JSON。", "danger")
    return
  }

  emit("import-app", importedApp)
  importJson.value = ""
  setStatus("已导入应用 Schema，点击保存后持久化。", "success")
}
</script>

<template>
  <section class="building-editor-publish-panel" aria-label="Publish and export panel">
    <header class="building-editor-publish-panel__header">
      <div>
        <h2>PublishPanel</h2>
        <p>导出、复制或导入当前 LowCodeApp JSON。本轮不做云发布。</p>
      </div>
    </header>

    <div class="building-editor-publish-panel__stats" aria-label="Current app export summary">
      <div>
        <span>App</span>
        <strong>{{ appSchema.id }}</strong>
      </div>
      <div>
        <span>Pages</span>
        <strong>{{ pageCountLabel }}</strong>
      </div>
      <div class="building-editor-publish-panel__wide">
        <span>Current path</span>
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
        复制 JSON
      </AoiButton>
      <AoiButton
        icon="download"
        size="sm"
        variant="outlined"
        @click="downloadExportJson"
      >
        下载 JSON
      </AoiButton>
    </div>

    <AoiTextField
      v-model="importJson"
      class="building-editor-publish-panel__import"
      icon="upload"
      label="导入 LowCodeApp JSON"
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
      导入到当前应用
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

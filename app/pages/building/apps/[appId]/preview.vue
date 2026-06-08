<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import AoiButton from "~/components/aoi/AoiButton.vue"
import LowCodeRenderer from "~/components/lowcode/LowCodeRenderer"
import {
  loadLowCodePageSchema
} from "~/builder/editor/schemaStorage"
import { mockPageSchema } from "~/lowcode/schemas/mockPageSchema"
import type { LowCodePage } from "~/types/lowcode"

if (!import.meta.dev) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page not found"
  })
}

const route = useRoute()
const appId = computed(() => {
  const value = route.params.appId

  if (Array.isArray(value)) {
    return value[0] || "mock-app"
  }

  return value || "mock-app"
})
const pageSchema = ref<LowCodePage>(clonePageSchema(mockPageSchema))
const restoredFromLocal = ref(false)
const editorTo = computed(() => `/building/apps/${appId.value}/editor`)

useHead(() => ({
  title: `Building Preview - ${appId.value}`
}))

function clonePageSchema(schema: LowCodePage) {
  return JSON.parse(JSON.stringify(schema)) as LowCodePage
}

onMounted(() => {
  const restored = loadLowCodePageSchema(appId.value, mockPageSchema.id)

  if (!restored) {
    return
  }

  pageSchema.value = restored
  restoredFromLocal.value = true
})
</script>

<template>
  <div class="aoi-page building-preview-page">
    <header class="building-preview-page__header">
      <div>
        <p class="building-preview-page__eyebrow">Preview · {{ appId }}</p>
        <h1>{{ pageSchema.title || pageSchema.name }}</h1>
        <p>
          {{ restoredFromLocal ? "正在预览本地保存的 Schema。" : "未找到本地保存结果，当前展示 mockPageSchema。" }}
        </p>
      </div>

      <AoiButton
        icon="arrow-left"
        size="sm"
        :to="editorTo"
        variant="outlined"
      >
        返回编辑器
      </AoiButton>
    </header>

    <main class="building-preview-page__canvas" aria-label="Saved schema preview">
      <LowCodeRenderer :node="pageSchema.root" />
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
.building-preview-page__header p {
  margin: 0;
}

.building-preview-page__header h1 {
  color: var(--aoi-text);
  font-size: 28px;
  line-height: 1.12;
}

.building-preview-page__header p {
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

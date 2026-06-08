<script setup lang="ts">
import { computed, ref, watch } from "vue"
import AoiButton from "~/components/aoi/AoiButton.vue"
import AoiSelect from "~/components/aoi/AoiSelect.vue"
import AoiTextField from "~/components/aoi/AoiTextField.vue"
import {
  cloneTheme,
  getDefaultTheme,
  getThemeById,
  getThemeOptions,
  normalizeTheme
} from "~/lowcode/themes/themeRegistry"
import type { ThemeConfig } from "~/types/lowcode"

const props = defineProps<{
  theme?: ThemeConfig
}>()

const emit = defineEmits<{
  "update-theme": [theme: ThemeConfig]
}>()

const selectedThemeId = ref(props.theme?.id || getDefaultTheme().id)
const currentTheme = computed(() => normalizeTheme(props.theme))
const themeOptions = computed(() => getThemeOptions())

function emitTheme(theme: ThemeConfig) {
  emit("update-theme", cloneTheme(theme))
}

function selectTheme(themeId: string) {
  selectedThemeId.value = themeId

  const nextTheme = getThemeById(themeId)

  if (nextTheme) {
    emitTheme(nextTheme)
  }
}

function resetTheme() {
  emitTheme(getDefaultTheme())
}

function updateColor(key: keyof ThemeConfig["colors"], value: string) {
  emitTheme({
    ...currentTheme.value,
    colors: {
      ...currentTheme.value.colors,
      [key]: value
    }
  })
}

function updateSpacing(key: keyof ThemeConfig["spacing"], value: string) {
  emitTheme({
    ...currentTheme.value,
    spacing: {
      ...currentTheme.value.spacing,
      [key]: value
    }
  })
}

function updateRadius(key: keyof ThemeConfig["radius"], value: string) {
  emitTheme({
    ...currentTheme.value,
    radius: {
      ...currentTheme.value.radius,
      [key]: value
    }
  })
}

watch(
  () => props.theme?.id,
  (themeId) => {
    selectedThemeId.value = themeId || getDefaultTheme().id
  },
  { immediate: true }
)
</script>

<template>
  <section class="building-editor-theme-panel" aria-label="Theme panel">
    <header class="building-editor-theme-panel__header">
      <div>
        <h2>Theme</h2>
        <p>Low-code render tokens.</p>
      </div>
      <strong>{{ currentTheme.name }}</strong>
    </header>

    <div class="building-editor-theme-panel__controls">
      <AoiSelect
        :model-value="selectedThemeId"
        label="Theme preset"
        :options="themeOptions"
        variant="outlined"
        @update:model-value="selectTheme"
      />

      <AoiButton
        icon="rotate-ccw"
        size="sm"
        variant="outlined"
        @click="resetTheme"
      >
        Reset
      </AoiButton>
    </div>

    <div class="building-editor-theme-token-grid">
      <AoiTextField
        :model-value="currentTheme.colors.primary"
        label="Primary"
        variant="outlined"
        @update:model-value="updateColor('primary', $event)"
      />
      <AoiTextField
        :model-value="currentTheme.colors.background"
        label="Background"
        variant="outlined"
        @update:model-value="updateColor('background', $event)"
      />
      <AoiTextField
        :model-value="currentTheme.colors.text"
        label="Text"
        variant="outlined"
        @update:model-value="updateColor('text', $event)"
      />
      <AoiTextField
        :model-value="currentTheme.spacing.md"
        label="Spacing"
        variant="outlined"
        @update:model-value="updateSpacing('md', $event)"
      />
      <AoiTextField
        :model-value="currentTheme.radius.lg"
        label="Radius"
        variant="outlined"
        @update:model-value="updateRadius('lg', $event)"
      />
    </div>

    <div
      class="building-editor-theme-preview"
      :style="{
        '--theme-preview-bg': currentTheme.colors.background,
        '--theme-preview-border': currentTheme.colors.border,
        '--theme-preview-primary': currentTheme.colors.primary,
        '--theme-preview-radius': currentTheme.radius.lg,
        '--theme-preview-text': currentTheme.colors.text
      }"
    >
      <span />
      <strong>{{ currentTheme.name }}</strong>
    </div>
  </section>
</template>

<style scoped>
.building-editor-theme-panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-editor-theme-panel__header {
  display: flex;
  min-width: 0;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.building-editor-theme-panel__header h2,
.building-editor-theme-panel__header p {
  margin: 0;
}

.building-editor-theme-panel__header h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-editor-theme-panel__header p {
  color: var(--aoi-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.building-editor-theme-panel__header strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--aoi-accent-60);
  font-size: 13px;
}

.building-editor-theme-panel__controls,
.building-editor-theme-token-grid {
  display: grid;
  min-width: 0;
  gap: 10px;
}

.building-editor-theme-preview {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  border: 1px solid var(--theme-preview-border);
  border-radius: var(--theme-preview-radius);
  background: var(--theme-preview-bg);
  color: var(--theme-preview-text);
  padding: 10px;
}

.building-editor-theme-preview span {
  display: block;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--theme-preview-primary);
}

.building-editor-theme-preview strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
}
</style>

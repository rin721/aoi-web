<script setup lang="ts">
import { AOI_ACCENT_PRESETS } from "~/stores/app-settings"
import type { AoiPreferredTheme } from "~/stores/app-settings"

const settings = useAppSettingsStore()
const fileInput = ref<HTMLInputElement | null>(null)

const themeCards: Array<{ icon: string, label: string, value: AoiPreferredTheme }> = [
  { icon: "sun", label: "浅色主题", value: "light" },
  { icon: "moon", label: "深色主题", value: "dark" },
  { icon: "monitor-cog", label: "跟随系统", value: "system" }
]

const customAccentModel = computed({
  get: () => settings.customAccent,
  set: (value: string) => settings.setCustomAccent(value)
})

function pickBackground() {
  fileInput.value?.click()
}

async function onBackgroundChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    await settings.setBackgroundFile(file)
  }

  input.value = ""
}

function formatBytes(value: number) {
  if (!value) {
    return "未上传"
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)}KB`
  }

  return `${(value / 1024 / 1024).toFixed(1)}MB`
}
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="外观"
      description="用主题、个性色和本地背景图把 Aoi 调成自己的样子。"
    />

    <SettingsPanel
      icon="sun-moon"
      title="主题"
      description="切换浅色、深色或跟随系统。"
    >
      <div class="settings-card-grid">
        <button
          v-for="item in themeCards"
          :key="item.value"
          class="settings-choice-card"
          :class="{ 'settings-choice-card--active': settings.preferredTheme === item.value }"
          type="button"
          @click="settings.setPreferredTheme(item.value)"
        >
          <AoiIcon :name="item.icon" :size="22" decorative />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="swatch-book"
      title="个性色"
      description="选择一套色板，或切到自定义色。"
    >
      <div class="settings-palette-grid">
        <button
          v-for="preset in AOI_ACCENT_PRESETS"
          :key="preset.value"
          class="settings-palette-card"
          :class="{ 'settings-palette-card--active': settings.accentMode === 'preset' && settings.accentPreset === preset.value }"
          type="button"
          @click="settings.setAccentPreset(preset.value)"
        >
          <span
            class="settings-palette-card__preview"
            :style="{
              '--preview-10': preset.accent10,
              '--preview-20': preset.accent20,
              '--preview-50': preset.accent50,
              '--preview-60': preset.accent60
            }"
          />
          <strong>{{ preset.label }}</strong>
          <span>{{ preset.subtitle }}</span>
        </button>
      </div>

      <div class="settings-custom-color">
        <label class="settings-custom-color__picker">
          <span :style="{ backgroundColor: customAccentModel }" />
          <input
            v-model="customAccentModel"
            aria-label="自定义主题色"
            type="color"
          >
        </label>
        <AoiTextField
          v-model="customAccentModel"
          label="自定义主题色"
          placeholder="#0f9fb7"
          variant="outlined"
          supporting-text="选择或输入 6 位十六进制颜色。"
        />
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="image-plus"
      title="背景"
      description="背景图只保存在当前浏览器，不会上传。"
    >
      <template #actions>
        <AoiButton variant="outlined" size="sm" icon="upload" @click="pickBackground">
          选择文件
        </AoiButton>
        <AoiButton
          variant="text"
          size="sm"
          icon="x"
          :disabled="!settings.backgroundImageId"
          @click="settings.clearBackground()"
        >
          清除
        </AoiButton>
      </template>

      <input
        ref="fileInput"
        class="settings-hidden-input"
        accept="image/png,image/jpeg,image/webp"
        type="file"
        @change="onBackgroundChange"
      >

      <div
        class="settings-background-preview"
        :class="{ 'settings-background-preview--empty': !settings.backgroundObjectUrl }"
        :style="{ backgroundImage: settings.backgroundObjectUrl ? `url(${settings.backgroundObjectUrl})` : undefined }"
      >
        <span v-if="!settings.backgroundObjectUrl">
          <AoiIcon name="image" :size="28" decorative />
          尚未上传背景
        </span>
      </div>

      <p class="settings-note">
        {{ settings.backgroundFileName || "当前使用默认渐变背景" }}
        <span v-if="settings.backgroundFileSize"> · {{ formatBytes(settings.backgroundFileSize) }}</span>
      </p>
      <p v-if="settings.backgroundError" class="settings-error">{{ settings.backgroundError }}</p>

      <div class="settings-slider-grid">
        <AoiSlider v-model="settings.backgroundOpacity" label="背景强度" :min="0" :max="1" :step="0.05" />
        <AoiSlider v-model="settings.backgroundBlur" label="背景模糊" :min="0" :max="24" :step="1" />
        <AoiSlider v-model="settings.backgroundDim" label="遮罩强度" :min="0" :max="0.9" :step="0.05" />
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="navigation"
      title="导航"
      description="让侧栏和移动导航带一点个性色。"
    >
      <SettingsRow
        title="彩色导航栏"
        description="使用当前主题色轻微染色导航栏背景。"
      >
        <AoiSwitch v-model="settings.colorfulNavigation" />
      </SettingsRow>
    </SettingsPanel>

    <SettingsPanel
      icon="rotate-ccw"
      title="恢复默认"
      description="只重置外观、色板和背景，不影响播放器、本地互动和高级数据。"
    >
      <AoiButton variant="outlined" icon="rotate-ccw" @click="settings.resetAppearance()">
        重置外观
      </AoiButton>
    </SettingsPanel>
  </div>
</template>

<style scoped>
.settings-choice-card,
.settings-palette-card {
  display: grid;
  min-height: 104px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-md);
  background: var(--aoi-card-bg);
  color: var(--aoi-text);
  cursor: pointer;
  font: inherit;
  gap: 8px;
  justify-items: start;
  padding: 14px;
  text-align: left;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    border-color var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-press);
}

.settings-choice-card:hover,
.settings-palette-card:hover {
  background: var(--aoi-state-hover);
}

.settings-choice-card:active,
.settings-palette-card:active {
  transform: scale(.98);
}

.settings-choice-card--active,
.settings-palette-card--active {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
}

.settings-choice-card span,
.settings-palette-card strong {
  font-weight: 820;
}

.settings-palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.settings-palette-card {
  min-height: 148px;
}

.settings-palette-card__preview {
  display: block;
  width: 100%;
  height: 66px;
  border-radius: var(--aoi-radius-sm);
  background:
    radial-gradient(circle at 78% 72%, var(--preview-10) 0 18%, transparent 19%),
    linear-gradient(135deg, var(--preview-20), var(--preview-50) 52%, var(--preview-60));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .42);
}

.settings-palette-card span:not(.settings-palette-card__preview) {
  color: var(--aoi-text-muted);
}

.settings-custom-color {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.settings-custom-color__picker {
  position: relative;
  display: inline-grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border: 1px solid var(--aoi-border);
  border-radius: 999px;
  background: var(--aoi-surface-solid);
  cursor: pointer;
  overflow: hidden;
}

.settings-custom-color__picker span {
  width: 42px;
  height: 42px;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .48);
}

.settings-custom-color__picker input,
.settings-hidden-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.settings-background-preview {
  display: grid;
  min-height: 220px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-md);
  background:
    linear-gradient(135deg, rgba(34, 184, 207, .16), transparent 42%),
    linear-gradient(315deg, rgba(242, 112, 156, .18), transparent 40%),
    var(--aoi-surface-muted);
  background-position: center;
  background-size: cover;
  color: var(--aoi-text-muted);
  font-weight: 760;
}

.settings-background-preview--empty span {
  display: inline-grid;
  gap: 8px;
  justify-items: center;
}

.settings-slider-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 760px) {
  .settings-custom-color,
  .settings-slider-grid {
    grid-template-columns: 1fr;
  }
}
</style>

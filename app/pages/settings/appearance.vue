<script setup lang="ts">
import { AOI_ACCENT_PRESETS } from "~/stores/app-settings"
import type {
  AoiAppearanceContrast,
  AoiAppearanceDensity,
  AoiAppearanceShape,
  AoiAppearanceSize,
  AoiPreferredTheme
} from "~/stores/app-settings"

const { t } = useI18n()
const settings = useAppSettingsStore()
const fileInput = ref<HTMLInputElement | null>(null)

const themeCards: Array<{ icon: string, label: string, value: AoiPreferredTheme }> = [
  { icon: "sun", label: "浅色主题", value: "light" },
  { icon: "moon", label: "深色主题", value: "dark" },
  { icon: "monitor-cog", label: "跟随系统", value: "system" }
]

interface AppearanceOption<T extends string> {
  description: string
  icon: string
  label: string
  value: T
}

const densityOptions = computed<Array<AppearanceOption<AoiAppearanceDensity>>>(() => [
  {
    icon: "panel-top-open",
    label: t("settings.appearance.density.comfortable.label"),
    description: t("settings.appearance.density.comfortable.description"),
    value: "comfortable"
  },
  {
    icon: "rows-3",
    label: t("settings.appearance.density.compact.label"),
    description: t("settings.appearance.density.compact.description"),
    value: "compact"
  }
])

const sizeOptions = computed<Array<AppearanceOption<AoiAppearanceSize>>>(() => [
  {
    icon: "minimize-2",
    label: t("settings.appearance.size.small.label"),
    description: t("settings.appearance.size.small.description"),
    value: "small"
  },
  {
    icon: "scan",
    label: t("settings.appearance.size.default.label"),
    description: t("settings.appearance.size.default.description"),
    value: "default"
  },
  {
    icon: "maximize-2",
    label: t("settings.appearance.size.large.label"),
    description: t("settings.appearance.size.large.description"),
    value: "large"
  }
])

const shapeOptions = computed<Array<AppearanceOption<AoiAppearanceShape>>>(() => [
  {
    icon: "square",
    label: t("settings.appearance.shape.square.label"),
    description: t("settings.appearance.shape.square.description"),
    value: "square"
  },
  {
    icon: "squircle",
    label: t("settings.appearance.shape.soft.label"),
    description: t("settings.appearance.shape.soft.description"),
    value: "soft"
  },
  {
    icon: "circle",
    label: t("settings.appearance.shape.pill.label"),
    description: t("settings.appearance.shape.pill.description"),
    value: "pill"
  }
])

const contrastOptions = computed<Array<AppearanceOption<AoiAppearanceContrast>>>(() => [
  {
    icon: "contrast",
    label: t("settings.appearance.contrast.normal.label"),
    description: t("settings.appearance.contrast.normal.description"),
    value: "normal"
  },
  {
    icon: "badge-alert",
    label: t("settings.appearance.contrast.high.label"),
    description: t("settings.appearance.contrast.high.description"),
    value: "high"
  }
])

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
      icon="sliders-horizontal"
      :title="t('settings.appearance.form.title')"
      :description="t('settings.appearance.form.description')"
    >
      <div class="settings-form-grid">
        <section class="settings-form-group">
          <div class="settings-form-group__copy">
            <strong>{{ t("settings.appearance.form.densityTitle") }}</strong>
            <span>{{ t("settings.appearance.form.densityDescription") }}</span>
          </div>
          <div class="settings-segmented" role="group" :aria-label="t('settings.appearance.form.densityTitle')">
            <button
              v-for="item in densityOptions"
              :key="item.value"
              class="settings-segmented__item"
              :class="{ 'settings-segmented__item--active': settings.appearanceDensity === item.value }"
              type="button"
              :aria-pressed="settings.appearanceDensity === item.value"
              @click="settings.setAppearanceDensity(item.value)"
            >
              <AoiIcon :name="item.icon" :size="18" decorative />
              <span>{{ item.label }}</span>
              <small>{{ item.description }}</small>
            </button>
          </div>
        </section>

        <section class="settings-form-group">
          <div class="settings-form-group__copy">
            <strong>{{ t("settings.appearance.form.sizeTitle") }}</strong>
            <span>{{ t("settings.appearance.form.sizeDescription") }}</span>
          </div>
          <div class="settings-segmented settings-segmented--three" role="group" :aria-label="t('settings.appearance.form.sizeTitle')">
            <button
              v-for="item in sizeOptions"
              :key="item.value"
              class="settings-segmented__item"
              :class="{ 'settings-segmented__item--active': settings.appearanceSize === item.value }"
              type="button"
              :aria-pressed="settings.appearanceSize === item.value"
              @click="settings.setAppearanceSize(item.value)"
            >
              <AoiIcon :name="item.icon" :size="18" decorative />
              <span>{{ item.label }}</span>
              <small>{{ item.description }}</small>
            </button>
          </div>
        </section>

        <section class="settings-form-group">
          <div class="settings-form-group__copy">
            <strong>{{ t("settings.appearance.form.shapeTitle") }}</strong>
            <span>{{ t("settings.appearance.form.shapeDescription") }}</span>
          </div>
          <div class="settings-segmented settings-segmented--three" role="group" :aria-label="t('settings.appearance.form.shapeTitle')">
            <button
              v-for="item in shapeOptions"
              :key="item.value"
              class="settings-segmented__item"
              :class="{ 'settings-segmented__item--active': settings.appearanceShape === item.value }"
              type="button"
              :aria-pressed="settings.appearanceShape === item.value"
              @click="settings.setAppearanceShape(item.value)"
            >
              <AoiIcon :name="item.icon" :size="18" decorative />
              <span>{{ item.label }}</span>
              <small>{{ item.description }}</small>
            </button>
          </div>
        </section>

        <section class="settings-form-group">
          <div class="settings-form-group__copy">
            <strong>{{ t("settings.appearance.form.contrastTitle") }}</strong>
            <span>{{ t("settings.appearance.form.contrastDescription") }}</span>
          </div>
          <div class="settings-segmented" role="group" :aria-label="t('settings.appearance.form.contrastTitle')">
            <button
              v-for="item in contrastOptions"
              :key="item.value"
              class="settings-segmented__item"
              :class="{ 'settings-segmented__item--active': settings.appearanceContrast === item.value }"
              type="button"
              :aria-pressed="settings.appearanceContrast === item.value"
              @click="settings.setAppearanceContrast(item.value)"
            >
              <AoiIcon :name="item.icon" :size="18" decorative />
              <span>{{ item.label }}</span>
              <small>{{ item.description }}</small>
            </button>
          </div>
        </section>
      </div>

      <SettingsRow
        :title="t('settings.appearance.form.colorfulNavTitle')"
        :description="t('settings.appearance.form.colorfulNavDescription')"
      >
        <AoiSwitch v-model="settings.colorfulNavigation" />
      </SettingsRow>
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
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  color: var(--aoi-text);
  cursor: pointer;
  font: inherit;
  gap: 8px;
  justify-items: start;
  padding: var(--aoi-card-padding);
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

.settings-form-grid {
  display: grid;
  gap: var(--aoi-grid-gap-compact);
}

.settings-form-group {
  display: grid;
  grid-template-columns: minmax(0, .42fr) minmax(0, 1fr);
  gap: var(--aoi-grid-gap);
  align-items: stretch;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-control-bg);
  padding: var(--aoi-row-padding);
}

.settings-form-group__copy {
  display: grid;
  align-content: center;
  gap: 4px;
}

.settings-form-group__copy strong,
.settings-form-group__copy span {
  margin: 0;
}

.settings-form-group__copy strong {
  color: var(--aoi-text);
}

.settings-form-group__copy span {
  color: var(--aoi-text-muted);
  line-height: 1.7;
}

.settings-segmented {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.settings-segmented--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.settings-segmented__item {
  display: grid;
  min-width: 0;
  min-height: calc(var(--aoi-control-height-lg) + 30px);
  align-content: center;
  justify-items: start;
  border: 1px solid transparent;
  border-radius: var(--aoi-radius-choice);
  background: transparent;
  color: var(--aoi-text);
  cursor: pointer;
  font: inherit;
  gap: 4px;
  padding: 10px 12px;
  text-align: left;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    border-color var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-press);
}

.settings-segmented__item:hover {
  background: var(--aoi-state-hover);
}

.settings-segmented__item:active {
  transform: scale(.98);
}

.settings-segmented__item--active {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
}

.settings-segmented__item span {
  overflow: hidden;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-segmented__item small {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--aoi-text-muted);
  font-size: .78rem;
  font-weight: 640;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  border-radius: var(--aoi-radius-card);
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
  border-radius: var(--aoi-radius-round);
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
  border-radius: var(--aoi-radius-container);
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
  .settings-form-group,
  .settings-slider-grid {
    grid-template-columns: 1fr;
  }

  .settings-segmented,
  .settings-segmented--three {
    grid-template-columns: 1fr;
  }
}
</style>

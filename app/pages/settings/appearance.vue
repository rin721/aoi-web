<script setup lang="ts">
import { AOI_ACCENT_PRESETS } from "~/stores/app-settings"
import type {
  AoiAppearanceContrast,
  AoiAppearanceDensity,
  AoiAppearanceShape,
  AoiAppearanceSize,
  AoiPreferredTheme
} from "~/stores/app-settings"
import type {
  AoiContentWidthMode,
  AoiContentWidthPercentKey,
  AoiContentWidthScope,
  AoiSpecUnitKey
} from "~/utils/aoiSpecUnits"
import {
  AOI_CONTENT_WIDTH_PERCENT_RANGES,
  AOI_SPEC_UNIT_RANGES
} from "~/utils/aoiSpecUnits"
import type { AoiRgbaColor } from "~/utils/aoiColor"

const { t } = useI18n()
const settings = useAppSettingsStore()
const resetAppearanceConfirmOpen = ref(false)
const resettingAppearance = ref(false)

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

const specUnitControls: Array<{
  descriptionKey: string
  key: AoiSpecUnitKey
  labelKey: string
  titleKey: string
}> = [
  {
    key: "baseFontPx",
    titleKey: "settings.appearance.specUnits.baseFont.title",
    descriptionKey: "settings.appearance.specUnits.baseFont.description",
    labelKey: "settings.appearance.specUnits.baseFont.label"
  },
  {
    key: "spaceUnitPx",
    titleKey: "settings.appearance.specUnits.space.title",
    descriptionKey: "settings.appearance.specUnits.space.description",
    labelKey: "settings.appearance.specUnits.space.label"
  },
  {
    key: "radiusUnitPx",
    titleKey: "settings.appearance.specUnits.radius.title",
    descriptionKey: "settings.appearance.specUnits.radius.description",
    labelKey: "settings.appearance.specUnits.radius.label"
  },
  {
    key: "controlHeightPx",
    titleKey: "settings.appearance.specUnits.controlHeight.title",
    descriptionKey: "settings.appearance.specUnits.controlHeight.description",
    labelKey: "settings.appearance.specUnits.controlHeight.label"
  },
  {
    key: "railWidthPx",
    titleKey: "settings.appearance.specUnits.railWidth.title",
    descriptionKey: "settings.appearance.specUnits.railWidth.description",
    labelKey: "settings.appearance.specUnits.railWidth.label"
  },
  {
    key: "mobileNavHeightPx",
    titleKey: "settings.appearance.specUnits.mobileNavHeight.title",
    descriptionKey: "settings.appearance.specUnits.mobileNavHeight.description",
    labelKey: "settings.appearance.specUnits.mobileNavHeight.label"
  },
  {
    key: "videoGridMinCardWidthPx",
    titleKey: "settings.appearance.specUnits.videoGridMinCardWidth.title",
    descriptionKey: "settings.appearance.specUnits.videoGridMinCardWidth.description",
    labelKey: "settings.appearance.specUnits.videoGridMinCardWidth.label"
  },
  {
    key: "settingsCardMinWidthPx",
    titleKey: "settings.appearance.specUnits.settingsCardMinWidth.title",
    descriptionKey: "settings.appearance.specUnits.settingsCardMinWidth.description",
    labelKey: "settings.appearance.specUnits.settingsCardMinWidth.label"
  }
]

const contentWidthControls: Array<{
  descriptionKey: string
  labelKey: string
  modeKey: "contentWidthMode" | "contentWideWidthMode"
  percentKey: AoiContentWidthPercentKey
  pxKey: "contentMaxWidthPx" | "contentWideMaxWidthPx"
  scope: AoiContentWidthScope
  titleKey: string
}> = [
  {
    scope: "content",
    modeKey: "contentWidthMode",
    percentKey: "contentWidthPercent",
    pxKey: "contentMaxWidthPx",
    titleKey: "settings.appearance.specUnits.contentMaxWidth.title",
    descriptionKey: "settings.appearance.specUnits.contentMaxWidth.description",
    labelKey: "settings.appearance.specUnits.contentMaxWidth.label"
  },
  {
    scope: "wide",
    modeKey: "contentWideWidthMode",
    percentKey: "contentWideWidthPercent",
    pxKey: "contentWideMaxWidthPx",
    titleKey: "settings.appearance.specUnits.contentWideMaxWidth.title",
    descriptionKey: "settings.appearance.specUnits.contentWideMaxWidth.description",
    labelKey: "settings.appearance.specUnits.contentWideMaxWidth.label"
  }
]

const widthModeOptions = computed(() => [
  {
    icon: "ruler",
    label: t("settings.appearance.specUnits.widthMode.px"),
    value: "px"
  },
  {
    icon: "percent",
    label: t("settings.appearance.specUnits.widthMode.percent"),
    value: "percent"
  }
])

const customAccentModel = computed<AoiRgbaColor>({
  get: () => settings.customAccent,
  set: (value) => settings.setCustomAccent(value)
})
const defaultCustomAccent = computed(() => settings.activeDefaultCustomAccent())

function setSpecUnit(key: AoiSpecUnitKey, value: number) {
  settings.setSpecUnit(key, value)
}

function setContentWidthMode(scope: AoiContentWidthScope, value: string) {
  settings.setContentWidthMode(scope, value as AoiContentWidthMode)
}

function setContentWidthValue(control: typeof contentWidthControls[number], value: number) {
  if (settings.specUnits[control.modeKey] === "percent") {
    settings.setContentWidthPercent(control.scope, value)
    return
  }

  settings.setSpecUnit(control.pxKey, value)
}

function contentWidthDescription(control: typeof contentWidthControls[number]) {
  const mode = settings.specUnits[control.modeKey]
  const value = mode === "percent"
    ? `${settings.specUnits[control.percentKey]}%`
    : `${settings.specUnits[control.pxKey]}px`

  return `${value} · ${t(control.descriptionKey)}`
}

function contentWidthSliderValue(control: typeof contentWidthControls[number]) {
  return settings.specUnits[control.modeKey] === "percent"
    ? settings.specUnits[control.percentKey]
    : settings.specUnits[control.pxKey]
}

function contentWidthSliderRange(control: typeof contentWidthControls[number]) {
  return settings.specUnits[control.modeKey] === "percent"
    ? AOI_CONTENT_WIDTH_PERCENT_RANGES[control.percentKey]
    : AOI_SPEC_UNIT_RANGES[control.pxKey]
}

function contentWidthSliderLabel(control: typeof contentWidthControls[number]) {
  const suffix = settings.specUnits[control.modeKey] === "percent"
    ? t("settings.appearance.specUnits.widthMode.percent")
    : t("settings.appearance.specUnits.widthMode.px")

  return `${t(control.labelKey)} (${suffix})`
}

function setAppearanceDensity(value: string) {
  settings.setAppearanceDensity(value as AoiAppearanceDensity)
}

function setAppearanceSize(value: string) {
  settings.setAppearanceSize(value as AoiAppearanceSize)
}

function setAppearanceShape(value: string) {
  settings.setAppearanceShape(value as AoiAppearanceShape)
}

function setAppearanceContrast(value: string) {
  settings.setAppearanceContrast(value as AoiAppearanceContrast)
}

async function onBackgroundChange(files: File[]) {
  const file = files[0]

  if (file) {
    await settings.setBackgroundFile(file)
  }
}

async function confirmResetAppearance() {
  resettingAppearance.value = true

  try {
    await settings.resetAppearance()
    resetAppearanceConfirmOpen.value = false
  } finally {
    resettingAppearance.value = false
  }
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
    >
      <template #actions>
        <AoiButton
          variant="outlined"
          size="sm"
          icon="rotate-ccw"
          :disabled="!settings.hydrated || resettingAppearance"
          @click="resetAppearanceConfirmOpen = true"
        >
          {{ t("settings.resetPage.action") }}
        </AoiButton>
      </template>
    </SettingsPageHeader>

    <SettingsPanel
      icon="sun-moon"
      title="主题"
      description="切换浅色、深色或跟随系统。"
    >
      <div class="settings-card-grid">
        <AoiChoiceCard
          v-for="item in themeCards"
          :key="item.value"
          :value="item.value"
          :title="item.label"
          :icon="item.icon"
          :selected="settings.preferredTheme === item.value"
          @select="settings.setPreferredTheme(item.value)"
        />
      </div>
    </SettingsPanel>

    <SettingsPanel
      id="appearance-spec-presets"
      icon="sliders-horizontal"
      :title="t('settings.appearance.form.title')"
      :description="t('settings.appearance.form.description')"
    >
      <template #actions>
        <AoiButton
          variant="outlined"
          size="sm"
          icon="ruler"
          to="/settings/appearance#appearance-spec-units"
        >
          {{ t("settings.appearance.specUnits.jump") }}
        </AoiButton>
      </template>

      <div class="settings-form-grid">
        <section class="settings-form-group">
          <div class="settings-form-group__copy">
            <strong>{{ t("settings.appearance.form.densityTitle") }}</strong>
            <span>{{ t("settings.appearance.form.densityDescription") }}</span>
          </div>
          <AoiSegmentedControl
            :model-value="settings.appearanceDensity"
            :items="densityOptions"
            :aria-label="t('settings.appearance.form.densityTitle')"
            :columns="2"
            @update:model-value="setAppearanceDensity"
          />
        </section>

        <section class="settings-form-group">
          <div class="settings-form-group__copy">
            <strong>{{ t("settings.appearance.form.sizeTitle") }}</strong>
            <span>{{ t("settings.appearance.form.sizeDescription") }}</span>
          </div>
          <AoiSegmentedControl
            :model-value="settings.appearanceSize"
            :items="sizeOptions"
            :aria-label="t('settings.appearance.form.sizeTitle')"
            :columns="3"
            @update:model-value="setAppearanceSize"
          />
        </section>

        <section class="settings-form-group">
          <div class="settings-form-group__copy">
            <strong>{{ t("settings.appearance.form.shapeTitle") }}</strong>
            <span>{{ t("settings.appearance.form.shapeDescription") }}</span>
          </div>
          <AoiSegmentedControl
            :model-value="settings.appearanceShape"
            :items="shapeOptions"
            :aria-label="t('settings.appearance.form.shapeTitle')"
            :columns="3"
            @update:model-value="setAppearanceShape"
          />
        </section>

        <section class="settings-form-group">
          <div class="settings-form-group__copy">
            <strong>{{ t("settings.appearance.form.contrastTitle") }}</strong>
            <span>{{ t("settings.appearance.form.contrastDescription") }}</span>
          </div>
          <AoiSegmentedControl
            :model-value="settings.appearanceContrast"
            :items="contrastOptions"
            :aria-label="t('settings.appearance.form.contrastTitle')"
            :columns="2"
            @update:model-value="setAppearanceContrast"
          />
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
      id="appearance-spec-units"
      icon="ruler"
      :title="t('settings.appearance.specUnits.title')"
      :description="t('settings.appearance.specUnits.description')"
    >
      <template #actions>
        <AoiButton
          variant="outlined"
          size="sm"
          icon="rotate-ccw"
          @click="settings.resetSpecUnits()"
        >
          {{ t("settings.appearance.specUnits.reset") }}
        </AoiButton>
      </template>

      <div class="settings-spec-grid">
        <SettingsRow
          v-for="control in contentWidthControls"
          :key="control.scope"
          :title="t(control.titleKey)"
          :description="contentWidthDescription(control)"
        >
          <div class="settings-width-control">
            <AoiSegmentedControl
              class="settings-width-mode"
              :model-value="settings.specUnits[control.modeKey]"
              :items="widthModeOptions"
              :aria-label="t(control.titleKey)"
              :columns="2"
              @update:model-value="(value) => setContentWidthMode(control.scope, value)"
            />
            <AoiSlider
              class="settings-spec-slider"
              :model-value="contentWidthSliderValue(control)"
              :label="contentWidthSliderLabel(control)"
              :min="contentWidthSliderRange(control).min"
              :max="contentWidthSliderRange(control).max"
              :step="contentWidthSliderRange(control).step"
              @update:model-value="(value) => setContentWidthValue(control, value)"
            />
          </div>
        </SettingsRow>

        <SettingsRow
          v-for="control in specUnitControls"
          :key="control.key"
          :title="t(control.titleKey)"
          :description="`${settings.specUnits[control.key]}px · ${t(control.descriptionKey)}`"
        >
          <AoiSlider
            class="settings-spec-slider"
            :model-value="settings.specUnits[control.key]"
            :label="t(control.labelKey)"
            :min="AOI_SPEC_UNIT_RANGES[control.key].min"
            :max="AOI_SPEC_UNIT_RANGES[control.key].max"
            :step="AOI_SPEC_UNIT_RANGES[control.key].step"
            @update:model-value="(value) => setSpecUnit(control.key, value)"
          />
        </SettingsRow>
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="swatch-book"
      :title="t('settings.appearance.palette.title')"
      :description="t('settings.appearance.palette.description')"
    >
      <div class="settings-palette-grid">
        <AoiChoiceCard
          v-for="preset in AOI_ACCENT_PRESETS"
          :key="preset.value"
          class="settings-palette-card"
          :value="preset.value"
          :title="preset.label"
          :description="preset.subtitle"
          :selected="settings.accentMode === 'preset' && settings.accentPreset === preset.value"
          @select="settings.setAccentPreset(preset.value)"
        >
          <template #preview>
            <span
              class="settings-palette-card__preview"
              :style="{
                '--preview-10': preset.accent10,
                '--preview-20': preset.accent20,
                '--preview-50': preset.accent50,
                '--preview-60': preset.accent60
              }"
            />
          </template>
        </AoiChoiceCard>
      </div>

      <div class="settings-custom-color">
        <AoiColorPalette
          v-model="customAccentModel"
          :label="t('settings.appearance.palette.customTitle')"
          :reset-label="t('components.colorPalette.reset')"
          :reset-value="defaultCustomAccent"
        />
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="image-plus"
      title="背景"
      description="背景图只保存在当前浏览器，不会上传。"
    >
      <template #actions>
        <AoiFileInput accept="image/png,image/jpeg,image/webp" @change="onBackgroundChange">
          <template #default="{ open }">
            <AoiButton variant="outlined" size="sm" icon="upload" @click="open">
              选择文件
            </AoiButton>
          </template>
        </AoiFileInput>
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
      <AoiButton
        variant="outlined"
        icon="rotate-ccw"
        :disabled="!settings.hydrated || resettingAppearance"
        @click="resetAppearanceConfirmOpen = true"
      >
        重置外观
      </AoiButton>
    </SettingsPanel>

    <AoiDialog v-model:open="resetAppearanceConfirmOpen">
      <template #headline>{{ t("settings.resetPage.appearance.title") }}</template>
      <p class="settings-note">{{ t("settings.resetPage.appearance.description") }}</p>
      <template #actions>
        <AoiButton
          variant="text"
          :disabled="resettingAppearance"
          @click="resetAppearanceConfirmOpen = false"
        >
          {{ t("settings.resetPage.cancel") }}
        </AoiButton>
        <AoiButton
          icon="check"
          :loading="resettingAppearance"
          @click="confirmResetAppearance"
        >
          {{ t("settings.resetPage.confirm") }}
        </AoiButton>
      </template>
    </AoiDialog>
  </div>
</template>

<style scoped>
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
  gap: max(4px, calc(var(--aoi-grid-gap-compact) - 8px));
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

.settings-palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--aoi-settings-card-min-width), 1fr));
  gap: var(--aoi-grid-gap-compact);
}

.settings-palette-card {
  min-height: calc(var(--aoi-settings-card-min-width) - 22px);
}

.settings-palette-card__preview {
  display: block;
  width: 100%;
  height: calc(var(--aoi-control-height-lg) + var(--aoi-grid-gap));
  border-radius: var(--aoi-radius-card);
  background:
    radial-gradient(circle at 78% 72%, var(--preview-10) 0 18%, transparent 19%),
    linear-gradient(135deg, var(--preview-20), var(--preview-50) 52%, var(--preview-60));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .42);
}

.settings-custom-color {
  display: grid;
  justify-items: start;
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
  gap: var(--aoi-grid-gap-compact);
  justify-items: center;
}

.settings-slider-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--aoi-grid-gap-compact);
}

.settings-spec-grid {
  display: grid;
  gap: var(--aoi-grid-gap-compact);
}

.settings-width-control {
  display: grid;
  width: min(calc(var(--aoi-settings-card-min-width) * 2.18), 100%);
  gap: var(--aoi-grid-gap-compact);
}

.settings-width-mode :deep(.aoi-segmented__item) {
  min-height: var(--aoi-control-height-md);
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  padding: 0 var(--aoi-row-padding);
}

.settings-spec-slider {
  width: min(calc(var(--aoi-settings-card-min-width) * 1.88), 100%);
}

@media (max-width: 760px) {
  .settings-custom-color,
  .settings-form-group,
  .settings-slider-grid {
    grid-template-columns: 1fr;
  }
}
</style>

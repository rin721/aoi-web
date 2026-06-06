<script setup lang="ts">
import type { AoiDataMode } from "~/stores/app-settings"
import type { AoiRevealMotionEffect, AoiRevealMotionReplay } from "~/utils/aoiReveal"

const { t } = useI18n()
const settings = useAppSettingsStore()

const dataModes: Array<{
  description: string
  icon: string
  label: string
  value: AoiDataMode
}> = [
  {
    description: "减少非必要加载，适合移动网络和弱网。",
    icon: "leaf",
    label: "省流模式",
    value: "economy"
  },
  {
    description: "平衡加载速度和信息完整度。",
    icon: "gauge",
    label: "标准模式",
    value: "standard"
  },
  {
    description: "优先更快展示更多内容，适合稳定网络。",
    icon: "zap",
    label: "极速模式",
    value: "turbo"
  }
]

const revealEffectOptions = computed(() => [
  { label: t("settings.preference.reveal.effect.contextual"), value: "contextual" },
  { label: t("settings.preference.reveal.effect.pop"), value: "pop" },
  { label: t("settings.preference.reveal.effect.rise"), value: "rise" },
  { label: t("settings.preference.reveal.effect.fade"), value: "fade" },
  { label: t("settings.preference.reveal.effect.slideLeft"), value: "slide-left" },
  { label: t("settings.preference.reveal.effect.slideRight"), value: "slide-right" }
])
const revealReplayOptions = computed(() => [
  {
    icon: "repeat",
    label: t("settings.preference.reveal.replay.repeat.label"),
    description: t("settings.preference.reveal.replay.repeat.description"),
    value: "repeat",
    disabled: !settings.revealMotionEnabled
  },
  {
    icon: "badge-check",
    label: t("settings.preference.reveal.replay.once.label"),
    description: t("settings.preference.reveal.replay.once.description"),
    value: "once",
    disabled: !settings.revealMotionEnabled
  }
])
const revealEffectModel = computed({
  get: () => settings.revealMotionEffect,
  set: (value: string) => settings.setRevealMotionEffect(value as AoiRevealMotionEffect)
})
const revealReplayModel = computed({
  get: () => settings.revealMotionReplay,
  set: (value: string) => settings.setRevealMotionReplay(value as AoiRevealMotionReplay)
})
const revealDurationModel = computed({
  get: () => settings.revealMotionDurationMs,
  set: (value: number) => {
    settings.revealMotionDurationMs = clampRevealSetting(value, 120, 800)
  }
})
const revealDistanceModel = computed({
  get: () => settings.revealMotionDistancePx,
  set: (value: number) => {
    settings.revealMotionDistancePx = clampRevealSetting(value, 0, 48)
  }
})
const revealStaggerModel = computed({
  get: () => settings.revealMotionStaggerMs,
  set: (value: number) => {
    settings.revealMotionStaggerMs = clampRevealSetting(value, 0, 120)
  }
})
const revealMaxDelayModel = computed({
  get: () => settings.revealMotionMaxDelayMs,
  set: (value: number) => {
    settings.revealMotionMaxDelayMs = clampRevealSetting(value, 0, 600)
  }
})

function clampRevealSetting(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(max, Math.max(min, value))
}
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="偏好"
      description="管理浏览、隐私和搜索相关的本地偏好。"
    />

    <SettingsPanel
      icon="radio"
      title="流量模式"
      description="当前版本先保存为本地偏好，后续接入真实分页和预加载策略。"
    >
      <div class="settings-card-grid">
        <AoiChoiceCard
          v-for="mode in dataModes"
          :key="mode.value"
          class="settings-mode-card"
          :value="mode.value"
          :title="mode.label"
          :description="mode.description"
          :icon="mode.icon"
          :selected="settings.dataMode === mode.value"
          @select="settings.dataMode = mode.value"
        />
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="mouse-pointer-click"
      title="浏览"
      description="这些设置会影响现有视频卡片和元信息。"
    >
      <SettingsRow
        title="在新标签页打开视频"
        description="首页、搜索和历史中的视频卡片将使用新标签打开。"
      >
        <AoiSwitch v-model="settings.openVideosInNewTab" />
      </SettingsRow>

      <SettingsRow
        title="使用相对日期"
        description="视频发布时间显示为“刚刚 / x 天前”等相对文本。"
      >
        <AoiSwitch v-model="settings.useRelativeDates" />
      </SettingsRow>
    </SettingsPanel>

    <SettingsPanel
      icon="sparkles"
      :title="t('settings.preference.reveal.title')"
      :description="t('settings.preference.reveal.description')"
    >
      <SettingsRow
        :title="t('settings.preference.reveal.enabledTitle')"
        :description="t('settings.preference.reveal.enabledDescription')"
      >
        <AoiSwitch v-model="settings.revealMotionEnabled" />
      </SettingsRow>

      <SettingsRow
        :title="t('settings.preference.reveal.effectTitle')"
        :description="t('settings.preference.reveal.effectDescription')"
      >
        <AoiSelect
          v-model="revealEffectModel"
          class="settings-reveal-control"
          variant="outlined"
          :label="t('settings.preference.reveal.effectLabel')"
          :options="revealEffectOptions"
          :disabled="!settings.revealMotionEnabled"
        />
      </SettingsRow>

      <SettingsRow
        :title="t('settings.preference.reveal.replayTitle')"
        :description="t('settings.preference.reveal.replayDescription')"
      >
        <AoiSegmentedControl
          v-model="revealReplayModel"
          class="settings-reveal-control"
          :items="revealReplayOptions"
          :columns="2"
          :aria-label="t('settings.preference.reveal.replayTitle')"
        />
      </SettingsRow>

      <div class="settings-reveal-slider-grid">
        <SettingsRow
          :title="t('settings.preference.reveal.durationTitle')"
          :description="`${settings.revealMotionDurationMs}ms`"
        >
          <AoiSlider
            v-model="revealDurationModel"
            :label="t('settings.preference.reveal.durationLabel')"
            :min="120"
            :max="800"
            :step="20"
            :disabled="!settings.revealMotionEnabled"
          />
        </SettingsRow>

        <SettingsRow
          :title="t('settings.preference.reveal.distanceTitle')"
          :description="`${settings.revealMotionDistancePx}px`"
        >
          <AoiSlider
            v-model="revealDistanceModel"
            :label="t('settings.preference.reveal.distanceLabel')"
            :min="0"
            :max="48"
            :step="2"
            :disabled="!settings.revealMotionEnabled"
          />
        </SettingsRow>

        <SettingsRow
          :title="t('settings.preference.reveal.staggerTitle')"
          :description="`${settings.revealMotionStaggerMs}ms`"
        >
          <AoiSlider
            v-model="revealStaggerModel"
            :label="t('settings.preference.reveal.staggerLabel')"
            :min="0"
            :max="120"
            :step="5"
            :disabled="!settings.revealMotionEnabled"
          />
        </SettingsRow>

        <SettingsRow
          :title="t('settings.preference.reveal.maxDelayTitle')"
          :description="`${settings.revealMotionMaxDelayMs}ms`"
        >
          <AoiSlider
            v-model="revealMaxDelayModel"
            :label="t('settings.preference.reveal.maxDelayLabel')"
            :min="0"
            :max="600"
            :step="20"
            :disabled="!settings.revealMotionEnabled"
          />
        </SettingsRow>
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="shield-check"
      title="隐私"
      description="只影响当前浏览器的本地行为和本地存储。"
    >
      <SettingsRow
        title="停用观看历史"
        description="打开后视频页不再写入历史，也不会继续更新播放进度。"
      >
        <AoiSwitch v-model="settings.disableWatchHistory" />
      </SettingsRow>

      <SettingsRow
        title="隐藏最近搜索"
        description="当前项目尚未保存最近搜索；此项会作为未来搜索历史的默认隐私偏好。"
      >
        <AoiSwitch v-model="settings.hideRecentSearches" />
      </SettingsRow>
    </SettingsPanel>

    <SettingsPanel
      icon="focus"
      title="专注"
      description="保留为本地偏好，给后续推荐模块接入使用。"
    >
      <SettingsRow
        title="禁用搜索推荐"
        description="未来搜索推荐接入后会默认关闭推荐提示。"
      >
        <AoiSwitch v-model="settings.noSearchRecommendations" />
      </SettingsRow>

      <SettingsRow
        title="禁用相关视频"
        description="未来视频相关推荐接入后会默认隐藏相关列表。"
      >
        <AoiSwitch v-model="settings.noRelatedVideos" />
      </SettingsRow>
    </SettingsPanel>
  </div>
</template>

<style scoped>
.settings-mode-card {
  min-height: 136px;
}

.settings-reveal-control {
  width: min(280px, 100%);
}

.settings-reveal-slider-grid {
  display: grid;
  gap: var(--aoi-grid-gap-compact);
}
</style>

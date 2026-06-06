<script setup lang="ts">
import type { AoiDataMode } from "~/stores/app-settings"

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
</style>

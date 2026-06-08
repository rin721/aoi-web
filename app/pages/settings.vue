<script setup lang="ts">
const route = useRoute()
const settings = useAppSettingsStore()
const query = ref("")

const settingGroups = computed(() => {
  const groups = [
    {
      label: "应用设置",
      items: [
        { icon: "palette", label: "外观", keywords: "主题 色板 背景 DIY 自定义 规格 尺寸 单位 间距 圆角 导航宽度 卡片宽度", to: "/settings/appearance" },
        { icon: "play-circle", label: "播放器", keywords: "音量 静音 倍速 剧场", to: "/settings/player" },
        { icon: "message-square-text", label: "弹幕", keywords: "弹幕 占位", to: "/settings/danmaku" },
        { icon: "sliders-horizontal", label: "偏好", keywords: "省流 隐私 新标签 日期 搜索 进度条 NProgress loading", to: "/settings/preference" },
        { icon: "languages", label: "语言", keywords: "中文 English 日本語 i18n", to: "/settings/language" },
        { icon: "flask-conical", label: "实验", keywords: "实验 功能预览", to: "/settings/experimental" },
        { icon: "keyboard", label: "快捷键", keywords: "键盘 播放 评论", to: "/settings/shortcut-key" }
      ]
    },
    {
      label: "项目",
      items: [
        { icon: "info", label: "关于", keywords: "版本 技术栈 仓库", to: "/settings/about" },
        { icon: "heart-handshake", label: "鸣谢", keywords: "链接 友情链接 致谢", to: "/settings/acknowledgement" },
        { icon: "database", label: "高级", keywords: "API mock 错误 本地缓存 重置 数据", to: "/settings/advanced" }
      ]
    }
  ]

  if (settings.developerModeEnabled) {
    groups[1]?.items.push({
      icon: "code-2",
      label: "开发者",
      keywords: "开发者 developer defaults build config restore profiles runtime profile 构建 默认 配置 恢复 多配置 运行时 档案 字段选择 差异预览",
      to: "/settings/developer"
    })
  }

  return groups
})

const normalizedQuery = computed(() => query.value.trim().toLowerCase())
const visibleGroups = computed(() => {
  if (!normalizedQuery.value) {
    return settingGroups.value
  }

  return settingGroups.value
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const haystack = `${item.label} ${item.keywords}`.toLowerCase()

        return haystack.includes(normalizedQuery.value)
      })
    }))
    .filter((group) => group.items.length > 0)
})
const activeItem = computed(() => {
  return settingGroups.value
    .flatMap((group) => group.items)
    .find((item) => route.path === item.to)
})

useHead(() => ({
  title: activeItem.value ? `${activeItem.value.label} - 设置 - Aoi` : "设置 - Aoi"
}))
</script>

<template>
  <div class="aoi-page settings-shell">
    <SettingsShellNav
      v-model="query"
      :groups="visibleGroups"
      :active-path="route.path"
      title="设置"
      description="调整 Aoi 的外观、偏好、本地数据和开发诊断。"
      search-label="搜索设置"
      search-placeholder="主题、背景、播放器..."
      empty-text="没有匹配的设置项。"
    />

    <main class="settings-shell__content">
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.settings-shell {
  display: grid;
  max-width: var(--aoi-content-wide-max-width);
  grid-template-columns: minmax(var(--aoi-settings-shell-nav-min-width), var(--aoi-settings-shell-nav-width)) minmax(0, 1fr);
  gap: var(--aoi-settings-shell-gap);
  align-items: start;
  animation: none;
}

.settings-shell__content {
  min-width: 0;
}

@media (max-width: 900px) {
  .settings-shell {
    grid-template-columns: 1fr;
  }
}
</style>

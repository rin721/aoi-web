<script setup lang="ts">
const route = useRoute()
const query = ref("")

const settingGroups = [
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

const normalizedQuery = computed(() => query.value.trim().toLowerCase())
const visibleGroups = computed(() => {
  if (!normalizedQuery.value) {
    return settingGroups
  }

  return settingGroups
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
  return settingGroups
    .flatMap((group) => group.items)
    .find((item) => route.path === item.to)
})

useHead(() => ({
  title: activeItem.value ? `${activeItem.value.label} - 设置 - Aoi` : "设置 - Aoi"
}))
</script>

<template>
  <div class="aoi-page settings-shell">
    <aside class="settings-shell__nav" aria-label="设置分类">
      <div class="settings-shell__intro">
        <span class="settings-shell__mark" aria-hidden="true">
          <AoiIcon name="settings" :size="22" decorative />
        </span>
        <div>
          <h1>设置</h1>
          <p>调整 Aoi 的外观、偏好、本地数据和开发诊断。</p>
        </div>
      </div>

      <AoiTextField
        v-model="query"
        class="settings-shell__search-field"
        icon="search"
        label="搜索设置"
        placeholder="主题、背景、播放器..."
        variant="outlined"
        type="search"
      />

      <nav class="settings-shell__groups" aria-label="设置页面">
        <section
          v-for="group in visibleGroups"
          :key="group.label"
          class="settings-shell__group"
        >
          <h2>{{ group.label }}</h2>
          <AoiLink
            v-for="item in group.items"
            :key="item.to"
            class="settings-shell__nav-item"
            :class="{ 'settings-shell__nav-item--active': route.path === item.to }"
            :to="item.to"
          >
            <AoiIcon :name="item.icon" :size="17" decorative />
            <span>{{ item.label }}</span>
          </AoiLink>
        </section>

        <p v-if="visibleGroups.length === 0" class="settings-shell__empty">
          没有匹配的设置项。
        </p>
      </nav>
    </aside>

    <nav class="settings-shell__mobile-groups" aria-label="设置页面">
      <template
        v-for="group in visibleGroups"
        :key="group.label"
      >
        <AoiLink
          v-for="item in group.items"
          :key="item.to"
          class="settings-shell__nav-item"
          :class="{ 'settings-shell__nav-item--active': route.path === item.to }"
          :to="item.to"
        >
          <AoiIcon :name="item.icon" :size="17" decorative />
          <span>{{ item.label }}</span>
        </AoiLink>
      </template>

      <p v-if="visibleGroups.length === 0" class="settings-shell__empty">
        没有匹配的设置项。
      </p>
    </nav>

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

.settings-shell__nav {
  position: sticky;
  top: var(--aoi-settings-sticky-top);
  z-index: var(--aoi-z-sticky);
  display: grid;
  max-height: calc(100dvh - var(--aoi-settings-sticky-top) * 2);
  align-self: start;
  gap: var(--aoi-grid-gap-compact);
  overflow: auto;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-container);
  background: var(--aoi-panel-bg);
  box-shadow: var(--aoi-shadow-sm);
  padding: var(--aoi-card-padding);
}

.settings-shell__search-field {
  --md-filled-text-field-container-height: var(--aoi-control-height-md);
  --md-outlined-text-field-container-height: var(--aoi-control-height-md);
}

.settings-shell__intro {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--aoi-grid-gap-compact);
  align-items: start;
}

.settings-shell__mark {
  display: inline-grid;
  width: var(--aoi-settings-shell-mark-size);
  height: var(--aoi-settings-shell-mark-size);
  place-items: center;
  border-radius: var(--aoi-radius-round);
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-60);
}

.settings-shell__intro h1,
.settings-shell__intro p,
.settings-shell__group h2 {
  margin: 0;
}

.settings-shell__intro h1 {
  font-size: var(--aoi-settings-shell-title-size);
  line-height: 1.1;
}

.settings-shell__intro p,
.settings-shell__empty {
  color: var(--aoi-text-muted);
  line-height: 1.7;
}

.settings-shell__groups {
  display: grid;
  gap: var(--aoi-grid-gap);
}

.settings-shell__mobile-groups {
  display: none;
}

.settings-shell__group {
  display: grid;
  gap: max(6px, calc(var(--aoi-grid-gap-compact) - 5px));
}

.settings-shell__group h2 {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 780;
  letter-spacing: 0;
}

.settings-shell__nav-item {
  display: flex;
  min-height: var(--aoi-settings-nav-item-height);
  align-items: center;
  gap: var(--aoi-nav-group-gap);
  border-radius: var(--aoi-radius-choice);
  color: var(--aoi-text);
  font-weight: 720;
  padding: 0 calc(var(--aoi-nav-group-gap) + 1px);
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-press);
}

.settings-shell__nav-item:hover {
  background: var(--aoi-state-hover);
}

.settings-shell__nav-item:active {
  transform: scale(.98);
}

.settings-shell__nav-item--active {
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
}

.settings-shell__content {
  min-width: 0;
}

@media (max-width: 900px) {
  .settings-shell {
    grid-template-columns: 1fr;
  }

  .settings-shell__nav {
    position: static;
    max-height: none;
    overflow: visible;
    gap: var(--aoi-grid-gap-compact);
    padding: var(--aoi-card-padding);
  }

  .settings-shell__groups {
    display: none;
  }

  .settings-shell__mobile-groups {
    position: sticky;
    top: var(--aoi-settings-mobile-sticky-top);
    z-index: var(--aoi-z-sticky);
    display: flex;
    overflow-x: auto;
    gap: var(--aoi-grid-gap-compact);
    border: 1px solid var(--aoi-border);
    border-radius: var(--aoi-radius-card);
    background: var(--aoi-panel-bg);
    box-shadow: var(--aoi-shadow-sm);
    padding: var(--aoi-grid-gap-compact);
    scrollbar-width: none;
    backdrop-filter: blur(var(--aoi-nav-surface-blur));
  }

  .settings-shell__mobile-groups::-webkit-scrollbar {
    display: none;
  }

  .settings-shell__mobile-groups .settings-shell__empty {
    flex: 0 0 auto;
    margin: 0;
    padding: 0 max(6px, calc(var(--aoi-grid-gap-compact) - 6px));
  }

  .settings-shell__nav-item {
    min-width: max-content;
    min-height: var(--aoi-settings-nav-item-mobile-height);
    border: 1px solid var(--aoi-border);
    background: var(--aoi-card-bg);
    padding: 0 var(--aoi-row-padding);
  }
}

@media (max-width: 639px) {
  .settings-shell__nav {
    border-radius: var(--aoi-radius-card);
  }

  .settings-shell__intro {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .settings-shell__intro h1 {
    font-size: var(--aoi-settings-shell-mobile-title-size);
  }
}
</style>

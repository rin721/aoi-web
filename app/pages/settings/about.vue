<script setup lang="ts">
const techStack = [
  { description: "Vue framework for the Aoi frontend", href: "https://nuxt.com/", label: "Nuxt 4" },
  { description: "Composition API and component runtime", href: "https://vuejs.org/", label: "Vue 3" },
  { description: "Typed application source", href: "https://www.typescriptlang.org/", label: "TypeScript" },
  { description: "Local client stores", href: "https://pinia.vuejs.org/", label: "Pinia" },
  { description: "Wrapped through local Aoi components", href: "https://material-web.dev/", label: "Material Web" }
]
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="关于"
      description="Aoi 是一个前端优先的视频社区原型，保留未来 Go API 的契约方向。"
    />

    <SettingsPanel
      icon="sparkles"
      title="Aoi Web"
      description="一个用于打磨视频社区信息架构、播放体验、上传草稿和本地互动的 Nuxt 4 原型。"
    >
      <div class="settings-about-hero">
        <strong>Aoi</strong>
        <span>Nuxt 4 Frontend · Local Mock API · Aoi Design System</span>
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="blocks"
      title="使用技术"
      description="项目依赖保持轻量，Material Web 通过 Aoi wrapper 暴露。"
    >
      <div class="settings-link-list">
        <AoiLink
          v-for="item in techStack"
          :key="item.href"
          class="settings-link-card"
          external
          target="_blank"
          :to="item.href"
        >
          <strong>{{ item.label }}</strong>
          <span>{{ item.description }}</span>
          <AoiIcon name="external-link" :size="16" decorative />
        </AoiLink>
      </div>
    </SettingsPanel>
  </div>
</template>

<style scoped>
.settings-about-hero {
  display: grid;
  min-height: 160px;
  align-content: end;
  gap: 8px;
  overflow: hidden;
  border-radius: var(--aoi-radius-md);
  background:
    radial-gradient(circle at 84% 26%, color-mix(in srgb, var(--aoi-sakura-50) 46%, transparent), transparent 26%),
    linear-gradient(135deg, var(--aoi-accent-20), var(--aoi-accent-50) 52%, var(--aoi-secondary-50));
  color: white;
  padding: 20px;
}

.settings-about-hero strong {
  font-size: 38px;
  line-height: 1;
}

.settings-about-hero span {
  font-weight: 760;
}

.settings-link-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.settings-link-card {
  display: grid;
  min-height: 104px;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 10px;
  align-content: start;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-md);
  background: var(--aoi-card-bg);
  padding: 14px;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-press);
}

.settings-link-card:hover {
  background: var(--aoi-state-hover);
  color: var(--aoi-accent-60);
}

.settings-link-card:active {
  transform: scale(.98);
}

.settings-link-card strong {
  font-weight: 840;
}

.settings-link-card span {
  grid-column: 1 / -1;
  color: var(--aoi-text-muted);
  line-height: 1.55;
}
</style>

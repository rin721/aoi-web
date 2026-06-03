<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

function isActive(path: string) {
  if (path === "/") {
    return route.path === "/"
  }

  return route.path === path || route.path.startsWith(`${path}/`)
}

const primaryItems = computed(() => [
  { icon: "home", label: t("nav.home"), to: "/", active: isActive("/") },
  { icon: "search", label: t("nav.search"), to: "/search", active: isActive("/search") },
  { icon: "layout-grid", label: t("nav.categories"), to: "/category", active: isActive("/category") },
  { icon: "history", label: t("nav.history"), to: "/history", active: isActive("/history") },
  { icon: "star", label: t("nav.collections"), to: "/collections", active: isActive("/collections") },
  { icon: "radio-tower", label: t("nav.following"), to: "/feed/following", active: isActive("/feed/following") },
  { icon: "upload", label: t("nav.upload"), to: "/upload", active: isActive("/upload") }
])

const isSettingsActive = computed(() => isActive("/settings"))
</script>

<template>
  <nav class="app-rail" aria-label="桌面主导航">
    <div class="app-rail__group">
      <AoiIconButton
        v-for="item in primaryItems"
        :key="item.to"
        :icon="item.icon"
        :label="item.label"
        :to="item.to"
        :active="item.active"
        :variant="item.active ? 'tonal' : 'standard'"
      />
    </div>
    <AoiIconButton
      icon="settings"
      :label="t('nav.settings')"
      to="/settings"
      :active="isSettingsActive"
      :variant="isSettingsActive ? 'tonal' : 'standard'"
    />
  </nav>
</template>

<style scoped>
.app-rail {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  display: flex;
  width: var(--aoi-rail-width);
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  border-right: 1px solid var(--aoi-border);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 12px 0 30px rgba(34, 184, 207, 0.08);
  backdrop-filter: blur(18px);
  padding: 10px 0;
}

.app-rail__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 639px) {
  .app-rail {
    display: none;
  }
}
</style>

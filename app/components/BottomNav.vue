<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

function isActive(path: string) {
  if (path === "/") {
    return route.path === "/"
  }

  return route.path === path || route.path.startsWith(`${path}/`)
}

const items = computed(() => [
  { icon: "home", label: t("nav.home"), to: "/", active: isActive("/") },
  { icon: "layout-grid", label: t("nav.categories"), to: "/category", active: isActive("/category") },
  { icon: "radio-tower", label: t("nav.following"), to: "/feed/following", active: isActive("/feed/following") },
  { icon: "search", label: t("nav.search"), to: "/search", active: isActive("/search") }
])
</script>

<template>
  <nav class="bottom-nav" aria-label="移动端主导航">
    <AoiLink
      v-for="item in items"
      :key="item.to"
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': item.active }"
      :to="item.to"
      :aria-current="item.active ? 'page' : undefined"
    >
      <AoiIcon :name="item.icon" :size="20" decorative />
      <span>{{ item.label }}</span>
    </AoiLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  inset: auto 0 0;
  z-index: 40;
  display: none;
  height: var(--aoi-mobile-nav-height);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--aoi-border);
  background: var(--aoi-nav-bg);
  backdrop-filter: blur(18px);
}

.bottom-nav__item {
  display: grid;
  min-width: 0;
  place-items: center;
  color: var(--aoi-icon);
  font-size: 11px;
  font-weight: 650;
  gap: 2px;
}

.bottom-nav__item:hover {
  background: var(--aoi-nav-hover-bg);
}

.bottom-nav__item:active {
  background: var(--aoi-nav-pressed-bg);
}

.bottom-nav__item--active {
  color: var(--aoi-nav-active-color);
}

@media (max-width: 639px) {
  .bottom-nav {
    display: grid;
  }
}
</style>

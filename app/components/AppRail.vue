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
const isLoginActive = computed(() => isActive("/login") || isActive("/register"))
const secondaryItems = computed(() => [
  { icon: "log-in", label: "登录", to: "/login", active: isLoginActive.value },
  { icon: "settings", label: t("nav.settings"), to: "/settings", active: isSettingsActive.value }
])
</script>

<template>
  <nav class="app-rail" aria-label="桌面主导航">
    <div class="app-rail__group">
      <AoiLink
        v-for="item in primaryItems"
        :key="item.to"
        :to="item.to"
        custom
      >
        <template #default="{ navigate }">
          <span class="app-rail__item">
            <AoiButton
              class="app-rail__button"
              :class="{ 'app-rail__button--active': item.active }"
              :aria-label="item.label"
              :icon="item.icon"
              :variant="item.active ? 'tonal' : 'text'"
              size="sm"
              type="button"
              @click="navigate"
            />
            <span class="app-rail__label" aria-hidden="true">{{ item.label }}</span>
          </span>
        </template>
      </AoiLink>
    </div>

    <div class="app-rail__group">
      <AoiLink
        v-for="item in secondaryItems"
        :key="item.to"
        :to="item.to"
        custom
      >
        <template #default="{ navigate }">
          <span class="app-rail__item">
            <AoiButton
              class="app-rail__button"
              :class="{ 'app-rail__button--active': item.active }"
              :aria-label="item.label"
              :icon="item.icon"
              :variant="item.active ? 'tonal' : 'text'"
              size="sm"
              type="button"
              @click="navigate"
            />
            <span class="app-rail__label" aria-hidden="true">{{ item.label }}</span>
          </span>
        </template>
      </AoiLink>
    </div>
  </nav>
</template>

<style scoped>
.app-rail {
  --app-rail-action-size: calc(var(--aoi-rail-width) * 0.72);
  --app-rail-icon-size: calc(var(--app-rail-action-size) * 0.48);
  --app-rail-press-bg: var(--aoi-nav-pressed-bg);
  --app-rail-hover-bg: var(--aoi-nav-hover-bg);
  --app-rail-active-bg: var(--aoi-nav-active-bg);
  --app-rail-active-color: var(--aoi-nav-active-color);
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  display: flex;
  width: var(--aoi-rail-width);
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  border-right: 1px solid var(--aoi-border);
  background: var(--aoi-nav-bg);
  box-shadow: 12px 0 30px rgba(34, 184, 207, 0.08);
  backdrop-filter: blur(18px);
  padding: 10px 0;
}

.app-rail__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-rail__item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.app-rail__label {
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  z-index: 1;
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--aoi-accent-60) 8%, var(--aoi-border));
  border-radius: 999px;
  background: var(--aoi-nav-hover-bg);
  color: var(--aoi-text);
  font-size: .78rem;
  font-weight: 720;
  line-height: 1;
  opacity: 0;
  padding: 0 10px;
  pointer-events: none;
  transform: translate(-6px, -50%) scale(.96);
  transform-origin: left center;
  transition:
    opacity 180ms var(--aoi-ease-out),
    transform 180ms var(--aoi-ease-out);
  white-space: nowrap;
}

.app-rail__item:hover .app-rail__label,
.app-rail__item:focus-within .app-rail__label {
  opacity: 1;
  transform: translate(0, -50%) scale(1);
}

.app-rail :deep(.app-rail__button) {
  display: inline-flex;
  width: var(--app-rail-action-size);
  inline-size: var(--app-rail-action-size);
  height: var(--app-rail-action-size);
  block-size: var(--app-rail-action-size);
  min-width: var(--app-rail-action-size);
  min-inline-size: var(--app-rail-action-size);
  min-height: var(--app-rail-action-size);
  min-block-size: var(--app-rail-action-size);
  max-width: var(--app-rail-action-size);
  max-inline-size: var(--app-rail-action-size);
  max-height: var(--app-rail-action-size);
  max-block-size: var(--app-rail-action-size);
  align-items: center;
  justify-content: center;
  gap: 0;
  border-radius: 999px;
  box-shadow: none;
  padding-inline: 0;
  color: var(--aoi-text);
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-press);
  --md-elevated-button-container-height: var(--app-rail-action-size);
  --md-filled-button-container-height: var(--app-rail-action-size);
  --md-filled-tonal-button-container-height: var(--app-rail-action-size);
  --md-outlined-button-container-height: var(--app-rail-action-size);
  --md-text-button-container-height: var(--app-rail-action-size);
  --md-elevated-button-container-shape: 999px;
  --md-filled-button-container-shape: 999px;
  --md-filled-tonal-button-container-shape: 999px;
  --md-outlined-button-container-shape: 999px;
  --md-text-button-container-shape: 999px;
  --md-filled-tonal-button-container-elevation: 0;
  --md-filled-tonal-button-focus-container-elevation: 0;
  --md-filled-tonal-button-hover-container-elevation: 0;
  --md-filled-tonal-button-pressed-container-elevation: 0;
  --md-text-button-container-color: transparent;
  --md-text-button-icon-color: var(--aoi-text);
  --md-text-button-label-text-color: var(--aoi-text);
  --md-text-button-hover-icon-color: var(--aoi-text);
  --md-text-button-hover-label-text-color: var(--aoi-text);
  --md-text-button-hover-state-layer-color: var(--app-rail-hover-bg);
  --md-text-button-hover-state-layer-opacity: 1;
  --md-text-button-focus-icon-color: var(--aoi-text);
  --md-text-button-focus-label-text-color: var(--aoi-text);
  --md-text-button-focus-state-layer-color: var(--app-rail-hover-bg);
  --md-text-button-focus-state-layer-opacity: 1;
  --md-text-button-pressed-icon-color: var(--app-rail-active-color);
  --md-text-button-pressed-label-text-color: var(--app-rail-active-color);
  --md-text-button-pressed-state-layer-color: var(--app-rail-press-bg);
  --md-text-button-pressed-state-layer-opacity: 1;
  --md-filled-tonal-button-container-color: var(--app-rail-active-bg);
  --md-filled-tonal-button-hover-container-color: var(--app-rail-active-bg);
  --md-filled-tonal-button-pressed-container-color: var(--app-rail-press-bg);
  --md-filled-tonal-button-icon-color: var(--app-rail-active-color);
  --md-filled-tonal-button-label-text-color: var(--app-rail-active-color);
  --md-filled-tonal-button-hover-icon-color: var(--app-rail-active-color);
  --md-filled-tonal-button-hover-label-text-color: var(--app-rail-active-color);
  --md-filled-tonal-button-pressed-icon-color: var(--app-rail-active-color);
  --md-filled-tonal-button-pressed-label-text-color: var(--app-rail-active-color);
}

.app-rail :deep(.app-rail__button:hover) {
  background: var(--app-rail-hover-bg);
}

.app-rail :deep(.app-rail__button--active),
.app-rail :deep(.app-rail__button--active:hover) {
  background: var(--app-rail-active-bg);
  color: var(--app-rail-active-color);
}

.app-rail :deep(.app-rail__button:active) {
  background: var(--app-rail-press-bg);
  color: var(--app-rail-active-color);
  transform: scale(.94);
}

.app-rail :deep(.app-rail__button .aoi-icon) {
  display: inline-grid;
  place-items: center;
  font-size: var(--app-rail-icon-size) !important;
  line-height: 1;
}

.app-rail :deep(.app-rail__button .aoi-icon > svg),
.app-rail :deep(.app-rail__button .aoi-icon > .iconify) {
  stroke-width: 2.35;
}

@media (max-width: 639px) {
  .app-rail {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-rail__label {
    transition-duration: 1ms;
  }
}
</style>

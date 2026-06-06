<script setup lang="ts">
const { desktopPrimaryItems, secondaryItems } = useAoiNavigation()
</script>

<template>
  <nav class="app-rail" aria-label="桌面主导航">
    <div class="app-rail__group">
      <AoiLink
        v-for="item in desktopPrimaryItems"
        :key="item.to"
        class="app-rail__link"
        :class="{ 'app-rail__link--active': item.active }"
        :to="item.to"
        :aria-current="item.active ? 'page' : undefined"
        :aria-label="item.label"
      >
        <AoiIcon class="app-rail__icon" :name="item.icon" size="var(--aoi-nav-icon-size)" decorative />
        <span class="app-rail__label" aria-hidden="true">{{ item.label }}</span>
      </AoiLink>
    </div>

    <div class="app-rail__group">
      <AoiLink
        v-for="item in secondaryItems"
        :key="item.to"
        class="app-rail__link"
        :class="{ 'app-rail__link--active': item.active }"
        :to="item.to"
        :aria-current="item.active ? 'page' : undefined"
        :aria-label="item.label"
      >
        <AoiIcon class="app-rail__icon" :name="item.icon" size="var(--aoi-nav-icon-size)" decorative />
        <span class="app-rail__label" aria-hidden="true">{{ item.label }}</span>
      </AoiLink>
    </div>
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
  background: var(--aoi-nav-bg);
  box-shadow: 10px 0 28px rgba(19, 80, 96, 0.08);
  backdrop-filter: blur(18px);
  padding: var(--aoi-nav-rail-padding-block) 0;
}

.app-rail__group {
  display: flex;
  flex-direction: column;
  gap: var(--aoi-nav-group-gap);
}

.app-rail__link {
  position: relative;
  display: grid;
  width: var(--aoi-nav-action-size);
  height: var(--aoi-nav-action-size);
  place-items: center;
  border-radius: var(--aoi-radius-nav-indicator);
  color: var(--aoi-icon);
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-press);
}

.app-rail__link:hover,
.app-rail__link:focus-visible {
  border-radius: var(--aoi-radius-nav-indicator);
  background: var(--aoi-nav-hover-bg);
  color: var(--aoi-text);
}

.app-rail__link:active {
  border-radius: var(--aoi-radius-nav-indicator);
  background: var(--aoi-nav-pressed-bg);
  color: var(--aoi-nav-active-color);
  transform: scale(.94);
}

.app-rail__link--active {
  border-radius: var(--aoi-radius-nav-indicator);
  background: var(--aoi-nav-active-bg);
  color: var(--aoi-nav-active-color);
}

.app-rail__icon {
  font-size: var(--aoi-nav-icon-size);
}

.app-rail__icon :deep(svg),
.app-rail__icon :deep(.iconify) {
  stroke-width: 2.35;
}

.app-rail__label {
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  z-index: 1;
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-surface-solid);
  box-shadow: var(--aoi-shadow-sm);
  color: var(--aoi-text);
  font-size: .78rem;
  font-weight: 760;
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

.app-rail__link:hover .app-rail__label,
.app-rail__link:focus-visible .app-rail__label {
  opacity: 1;
  transform: translate(0, -50%) scale(1);
}

@media (max-width: 639px) {
  .app-rail {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-rail__link,
  .app-rail__label {
    transition-duration: 1ms;
  }
}
</style>

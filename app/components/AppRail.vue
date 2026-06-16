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
        <span class="app-rail__button-layer" aria-hidden="true">
          <AoiIconButton
            class="app-rail__button"
            :active="item.active"
            :icon="item.icon"
            :label="item.label"
            :tone="item.active ? 'accent' : 'muted'"
            :variant="item.active ? 'tonal' : 'plain'"
            aria-hidden="true"
            tabindex="-1"
            type="button"
          />
        </span>
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
        <span class="app-rail__button-layer" aria-hidden="true">
          <AoiIconButton
            class="app-rail__button"
            :active="item.active"
            :icon="item.icon"
            :label="item.label"
            :tone="item.active ? 'accent' : 'muted'"
            :variant="item.active ? 'tonal' : 'plain'"
            aria-hidden="true"
            tabindex="-1"
            type="button"
          />
        </span>
        <span class="app-rail__label" aria-hidden="true">{{ item.label }}</span>
      </AoiLink>
    </div>
  </nav>
</template>

<style scoped>
.app-rail {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: var(--aoi-z-nav);
  display: flex;
  width: var(--aoi-rail-width);
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  border-right: 1px solid var(--aoi-border);
  background: var(--aoi-nav-bg);
  box-shadow: 10px 0 28px rgba(19, 80, 96, 0.08);
  backdrop-filter: blur(var(--aoi-nav-surface-blur));
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
  transform: translate3d(0, 0, 0);
  transition:
    color var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-press);
  will-change: transform;
}

.app-rail__link:hover,
.app-rail__link:focus-visible {
  color: var(--aoi-text);
}

.app-rail__link:active {
  color: var(--aoi-nav-active-color);
  transform: translate3d(0, 0, 0) scale(.94);
}

.app-rail__link--active {
  color: var(--aoi-nav-active-color);
}

.app-rail__button-layer,
.app-rail__button {
  width: var(--aoi-nav-action-size);
  height: var(--aoi-nav-action-size);
}

.app-rail__button-layer {
  display: inline-grid;
  place-items: center;
}

.app-rail__button {
  --md-icon-button-icon-size: var(--aoi-nav-icon-size);
  --md-icon-button-state-layer-size: var(--aoi-nav-action-size);
  --md-filled-tonal-icon-button-container-shape: var(--aoi-radius-nav-indicator);
  --md-icon-button-container-shape: var(--aoi-radius-nav-indicator);
  color: inherit;
}

.app-rail__label {
  position: absolute;
  left: calc(100% + var(--aoi-nav-group-gap));
  top: 50%;
  z-index: var(--aoi-z-floating);
  display: inline-flex;
  min-height: calc(var(--aoi-control-height-sm) - 4px);
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
  padding: 0 var(--aoi-nav-group-gap);
  pointer-events: none;
  transform: translate3d(calc(var(--aoi-nav-group-gap) * -.6), -50%, 0) scale(.96);
  transform-origin: left center;
  transition:
    opacity 180ms var(--aoi-ease-out),
    transform 180ms var(--aoi-ease-out);
  white-space: nowrap;
}

.app-rail__link:hover .app-rail__label,
.app-rail__link:focus-visible .app-rail__label {
  opacity: 1;
  transform: translate3d(0, -50%, 0) scale(1);
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

  .app-rail__link {
    will-change: auto;
  }
}
</style>

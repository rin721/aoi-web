<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <header class="mobile-header">
    <AoiIconButton icon="menu" label="打开菜单" />
    <NuxtLink class="mobile-header__brand" to="/">
      {{ t("app.name") }}
    </NuxtLink>
    <AoiIconButton icon="search" :label="t('nav.search')" to="/search" />
  </header>
</template>

<style scoped>
.mobile-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 40;
  display: none;
  height: var(--aoi-mobile-nav-height);
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--aoi-border);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  padding: 0 14px;
}

.mobile-header__brand {
  color: var(--aoi-accent-60);
  font-family: Montserrat, Inter, "Noto Sans SC", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 800;
}

@media (max-width: 639px) {
  .mobile-header {
    display: flex;
  }
}
</style>

<script setup lang="ts">
withDefaults(defineProps<{
  description?: string
  icon?: string
  title: string
}>(), {
  description: undefined,
  icon: undefined
})
</script>

<template>
  <section class="settings-panel">
    <header class="settings-panel__header">
      <span v-if="icon" class="settings-panel__icon" aria-hidden="true">
        <AoiIcon :name="icon" :size="18" decorative />
      </span>
      <div class="settings-panel__copy">
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="settings-panel__actions">
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>

<style scoped>
.settings-panel {
  display: grid;
  gap: var(--aoi-grid-gap);
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-md);
  background: var(--aoi-panel-bg);
  box-shadow: var(--aoi-shadow-sm);
  padding: 18px;
}

.settings-panel__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}

.settings-panel__icon {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 999px;
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-60);
}

.settings-panel__copy {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.settings-panel__copy h2,
.settings-panel__copy p {
  margin: 0;
}

.settings-panel__copy h2 {
  color: var(--aoi-text);
  font-size: 17px;
}

.settings-panel__copy p {
  color: var(--aoi-text-muted);
  line-height: 1.7;
}

.settings-panel__actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: end;
}

@media (max-width: 639px) {
  .settings-panel__header {
    grid-template-columns: 1fr;
  }

  .settings-panel__actions {
    justify-content: start;
  }
}
</style>

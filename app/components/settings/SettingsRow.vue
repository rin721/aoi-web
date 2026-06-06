<script setup lang="ts">
withDefaults(defineProps<{
  description?: string
  title: string
}>(), {
  description: undefined
})
</script>

<template>
  <div class="settings-row">
    <div class="settings-row__copy">
      <strong>{{ title }}</strong>
      <span v-if="description">{{ description }}</span>
    </div>
    <div class="settings-row__control">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.settings-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, .44fr);
  gap: var(--aoi-grid-gap);
  align-items: center;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-control-bg);
  padding: var(--aoi-row-padding);
}

.settings-row__copy {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.settings-row__copy strong,
.settings-row__copy span {
  margin: 0;
}

.settings-row__copy strong {
  color: var(--aoi-text);
}

.settings-row__copy span {
  color: var(--aoi-text-muted);
  line-height: 1.7;
}

.settings-row__control {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
}

@media (max-width: 639px) {
  .settings-row {
    grid-template-columns: 1fr;
  }

  .settings-row__control {
    justify-content: start;
  }
}
</style>

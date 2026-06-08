<script setup lang="ts">
const props = withDefaults(defineProps<{
  as?: string
  icon?: string
  message?: string
  tone?: "success" | "error" | "info" | "warning"
}>(), {
  as: "p",
  icon: undefined,
  message: undefined,
  tone: "info"
})
</script>

<template>
  <component
    :is="props.as"
    v-if="props.message || $slots.default"
    class="aoi-status-message"
    :class="`aoi-status-message--${props.tone}`"
  >
    <AoiIcon v-if="props.icon" :name="props.icon" :size="15" decorative />
    <slot>{{ props.message }}</slot>
  </component>
</template>

<style scoped>
.aoi-status-message {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  line-height: 1.7;
  padding: 10px 12px;
}

.aoi-status-message--success {
  border-color: color-mix(in srgb, var(--aoi-accent-60) 24%, var(--aoi-border));
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-60);
}

.aoi-status-message--error {
  border-color: color-mix(in srgb, var(--aoi-danger) 24%, var(--aoi-border));
  background: color-mix(in srgb, var(--aoi-danger) 9%, var(--aoi-surface));
  color: var(--aoi-danger);
}

.aoi-status-message--warning {
  border-color: color-mix(in srgb, var(--aoi-sun-50) 32%, var(--aoi-border));
  background: color-mix(in srgb, var(--aoi-sun-50) 14%, var(--aoi-surface));
  color: var(--aoi-text);
}

.aoi-status-message--info {
  background: var(--aoi-surface-muted);
  color: var(--aoi-text-muted);
}
</style>

<script setup lang="ts">
import type { AoiMetaPillTone } from "~/types/ui"

const props = withDefaults(defineProps<{
  icon?: string
  size?: "sm" | "md"
  tone?: AoiMetaPillTone
}>(), {
  icon: undefined,
  size: "sm",
  tone: "default"
})
</script>

<template>
  <span class="aoi-meta-pill" :class="[`aoi-meta-pill--${props.size}`, `aoi-meta-pill--tone-${props.tone}`]">
    <AoiIcon v-if="props.icon" :name="props.icon" :size="props.size === 'sm' ? 14 : 16" decorative />
    <slot />
  </span>
</template>

<style scoped>
.aoi-meta-pill {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-surface);
  color: var(--aoi-text-muted);
  font-weight: 760;
  line-height: 1.25;
}

.aoi-meta-pill--sm {
  min-height: 26px;
  font-size: 12px;
  padding: 4px 8px;
}

.aoi-meta-pill--md {
  min-height: 32px;
  font-size: 13px;
  padding: 5px 10px;
}

.aoi-meta-pill--tone-accent {
  border-color: color-mix(in srgb, var(--aoi-accent-60) 22%, var(--aoi-border));
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-60);
}

.aoi-meta-pill--tone-danger {
  border-color: color-mix(in srgb, var(--aoi-danger) 26%, var(--aoi-border));
  color: var(--aoi-danger);
}

.aoi-meta-pill--tone-muted {
  background: var(--aoi-surface-muted);
}
</style>

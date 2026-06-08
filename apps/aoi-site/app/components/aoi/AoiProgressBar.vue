<script setup lang="ts">
import type { AoiProgressBarTone } from "~/types/ui"

const props = withDefaults(defineProps<{
  label?: string
  max?: number
  size?: "sm" | "md"
  tone?: AoiProgressBarTone
  value: number
}>(), {
  label: undefined,
  max: 100,
  size: "sm",
  tone: "accent"
})

const normalizedMax = computed(() => Number.isFinite(props.max) && props.max > 0 ? props.max : 100)
const normalizedValue = computed(() => {
  if (!Number.isFinite(props.value)) {
    return 0
  }

  return Math.min(normalizedMax.value, Math.max(0, props.value))
})
const progressStyle = computed(() => ({
  "--aoi-progress-bar-value": `${normalizedValue.value / normalizedMax.value * 100}%`
}))
</script>

<template>
  <span
    class="aoi-progress-bar"
    :class="[`aoi-progress-bar--${props.size}`, `aoi-progress-bar--tone-${props.tone}`]"
    :style="progressStyle"
    role="progressbar"
    :aria-label="props.label"
    :aria-valuemin="0"
    :aria-valuemax="normalizedMax"
    :aria-valuenow="normalizedValue"
  >
    <span class="aoi-progress-bar__fill" />
  </span>
</template>

<style scoped>
.aoi-progress-bar {
  display: block;
  width: 100%;
  overflow: hidden;
  border-radius: var(--aoi-radius-round);
  background: var(--aoi-border);
}

.aoi-progress-bar--sm {
  height: 5px;
}

.aoi-progress-bar--md {
  height: 8px;
}

.aoi-progress-bar__fill {
  display: block;
  width: var(--aoi-progress-bar-value);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--aoi-accent-50), var(--aoi-accent-60));
}

.aoi-progress-bar--tone-danger .aoi-progress-bar__fill {
  background: var(--aoi-danger);
}

.aoi-progress-bar--tone-muted .aoi-progress-bar__fill {
  background: var(--aoi-text-muted);
}
</style>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: number
  ariaLabel?: string
  disabled?: boolean
  label?: string
  max?: number
  min?: number
  step?: number
  tone?: "default" | "inverse"
  compact?: boolean
}>(), {
  ariaLabel: undefined,
  compact: false,
  disabled: false,
  label: undefined,
  max: 100,
  min: 0,
  modelValue: 0,
  step: 1,
  tone: "default"
})

const emit = defineEmits<{
  change: [value: number]
  "update:modelValue": [value: number]
}>()

function readValue(event: Event) {
  const target = event.target as HTMLElement & { value?: number | string }
  const value = Number(target.value)

  if (!Number.isFinite(value)) {
    return props.modelValue
  }

  return value
}

function onInput(event: Event) {
  emit("update:modelValue", readValue(event))
}

function onChange(event: Event) {
  const value = readValue(event)

  emit("update:modelValue", value)
  emit("change", value)
}
</script>

<template>
  <label
    class="aoi-slider-field"
    :class="[
      `aoi-slider-field--${tone}`,
      { 'aoi-slider-field--compact': compact }
    ]"
  >
    <span v-if="label" class="aoi-slider-field__label">{{ label }}</span>
    <md-slider
      class="aoi-slider"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :aria-label="ariaLabel || label"
      :disabled="disabled || undefined"
      @input="onInput"
      @change="onChange"
    />
  </label>
</template>

<style scoped>
.aoi-slider-field {
  display: grid;
  gap: 8px;
  color: var(--aoi-text);
}

.aoi-slider-field__label {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 720;
}

.aoi-slider {
  width: 100%;
  --md-slider-active-track-color: var(--aoi-slider-active, var(--aoi-accent-60));
  --md-slider-handle-color: var(--aoi-slider-active, var(--aoi-accent-60));
  --md-slider-inactive-track-color: var(--aoi-slider-inactive, var(--aoi-accent-20));
}

.aoi-slider-field--compact {
  gap: 4px;
}

.aoi-slider-field--inverse {
  --aoi-slider-active: var(--aoi-accent-40);
  --aoi-slider-inactive: rgba(255, 255, 255, .26);
  color: rgba(255, 255, 255, .86);
}

.aoi-slider-field--inverse .aoi-slider-field__label {
  color: rgba(255, 255, 255, .78);
}
</style>

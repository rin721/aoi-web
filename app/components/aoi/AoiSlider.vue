<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: number
  disabled?: boolean
  label?: string
  max?: number
  min?: number
  step?: number
}>(), {
  disabled: false,
  label: undefined,
  max: 100,
  min: 0,
  modelValue: 0,
  step: 1
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
  <label class="aoi-slider-field">
    <span v-if="label" class="aoi-slider-field__label">{{ label }}</span>
    <md-slider
      class="aoi-slider"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
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
  --md-slider-active-track-color: var(--aoi-accent-60);
  --md-slider-handle-color: var(--aoi-accent-60);
  --md-slider-inactive-track-color: var(--aoi-accent-20);
}
</style>

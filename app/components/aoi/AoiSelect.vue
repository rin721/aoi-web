<script setup lang="ts">
export interface AoiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue?: string
  options?: AoiSelectOption[]
  label?: string
  variant?: "filled" | "outlined"
  disabled?: boolean
}>(), {
  modelValue: "",
  options: () => [],
  label: undefined,
  variant: "filled",
  disabled: false
})

const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const tagName = computed(() => props.variant === "outlined" ? "md-outlined-select" : "md-filled-select")

function onChange(event: Event) {
  emit("update:modelValue", (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <component
    :is="tagName"
    class="aoi-text-field"
    :value="modelValue"
    :label="label"
    :disabled="disabled || undefined"
    @change="onChange"
  >
    <md-select-option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :disabled="option.disabled || undefined"
    >
      <div slot="headline">{{ option.label }}</div>
    </md-select-option>
  </component>
</template>

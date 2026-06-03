<script setup lang="ts">
type TextFieldVariant = "filled" | "outlined"

const props = withDefaults(defineProps<{
  modelValue?: string
  variant?: TextFieldVariant
  label?: string
  placeholder?: string
  supportingText?: string
  errorText?: string
  type?: string
  disabled?: boolean
  maxLength?: number
  multiline?: boolean
  rows?: number
}>(), {
  modelValue: "",
  variant: "filled",
  label: undefined,
  placeholder: undefined,
  supportingText: undefined,
  errorText: undefined,
  type: "text",
  disabled: false,
  maxLength: undefined,
  multiline: false,
  rows: undefined
})

const emit = defineEmits<{
  enter: [event: KeyboardEvent]
  keydown: [event: KeyboardEvent]
  "update:modelValue": [value: string]
}>()

const tagName = computed(() => props.variant === "outlined" ? "md-outlined-text-field" : "md-filled-text-field")
const fieldRef = ref<(HTMLElement & { value?: string }) | null>(null)
let cleanupInternalControl: (() => void) | undefined

function onInput(event: Event) {
  const field = event.currentTarget as HTMLElement & { value?: string }
  const target = event.target as HTMLInputElement & { value?: string }

  emit("update:modelValue", readFieldValue(field, target))
}

function onKeydown(event: KeyboardEvent) {
  emit("keydown", event)

  if (event.key === "Enter") {
    emit("enter", event)
  }

  requestAnimationFrame(() => {
    emit("update:modelValue", readFieldValue())
  })
}

function readFieldValue(
  field: (HTMLElement & { value?: string }) | null = fieldRef.value,
  target?: HTMLInputElement & { value?: string }
) {
  const internalControl = field?.shadowRoot?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea")

  return internalControl?.value ?? field?.value ?? target?.value ?? ""
}

function emitInternalValue() {
  emit("update:modelValue", readFieldValue())
}

function attachInternalControl() {
  cleanupInternalControl?.()

  const internalControl = fieldRef.value?.shadowRoot?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea")

  if (!internalControl) {
    cleanupInternalControl = undefined
    return
  }

  internalControl.addEventListener("change", emitInternalValue)
  internalControl.addEventListener("input", emitInternalValue)
  internalControl.addEventListener("keyup", emitInternalValue)

  cleanupInternalControl = () => {
    internalControl.removeEventListener("change", emitInternalValue)
    internalControl.removeEventListener("input", emitInternalValue)
    internalControl.removeEventListener("keyup", emitInternalValue)
  }
}

onMounted(() => {
  nextTick(() => {
    attachInternalControl()
    window.setTimeout(attachInternalControl)
  })
})

onBeforeUnmount(() => {
  cleanupInternalControl?.()
})
</script>

<template>
  <component
    ref="fieldRef"
    :is="tagName"
    class="aoi-text-field"
    :value="modelValue"
    :label="label"
    :placeholder="placeholder"
    :supporting-text="supportingText"
    :error-text="errorText"
    :error="Boolean(errorText) || undefined"
    :type="multiline ? 'textarea' : type"
    :maxlength="maxLength"
    :rows="rows"
    :disabled="disabled || undefined"
    @input="onInput"
    @change="onInput"
    @keydown="onKeydown"
  />
</template>

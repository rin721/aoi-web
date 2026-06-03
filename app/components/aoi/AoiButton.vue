<script setup lang="ts">
type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "elevated"
type ButtonSize = "sm" | "md" | "lg"

const props = withDefaults(defineProps<{
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  trailingIcon?: string
  loading?: boolean
  disabled?: boolean
  ariaLabel?: string
  href?: string
  to?: string
  target?: string
  type?: "button" | "submit" | "reset"
}>(), {
  variant: "filled",
  size: "md",
  icon: undefined,
  trailingIcon: undefined,
  loading: false,
  disabled: false,
  ariaLabel: undefined,
  href: undefined,
  to: undefined,
  target: undefined,
  type: "button"
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const tagName = computed(() => {
  const map: Record<ButtonVariant, string> = {
    elevated: "md-elevated-button",
    filled: "md-filled-button",
    outlined: "md-outlined-button",
    text: "md-text-button",
    tonal: "md-filled-tonal-button"
  }

  return map[props.variant]
})

const resolvedHref = computed(() => props.href || props.to)
const resolvedIcon = computed(() => props.loading ? "loader-circle" : props.icon)
const hasTrailingIcon = computed(() => Boolean(props.trailingIcon && !props.loading))

function onClick(event: MouseEvent) {
  emit("click", event)
}
</script>

<template>
  <component
    :is="tagName"
    class="aoi-button"
    :class="`aoi-button--${size}`"
    :disabled="disabled || loading || undefined"
    :href="resolvedHref"
    :target="target"
    :type="type"
    :trailing-icon="hasTrailingIcon || undefined"
    :aria-label="ariaLabel"
    @click="onClick"
  >
    <AoiIcon
      v-if="resolvedIcon"
      slot="icon"
      :class="{ 'aoi-spin': loading }"
      :name="resolvedIcon"
      decorative
    />
    <AoiIcon
      v-if="hasTrailingIcon && trailingIcon"
      slot="icon"
      :name="trailingIcon"
      decorative
    />
    <slot />
  </component>
</template>

<style scoped>
.aoi-spin {
  animation: aoi-spin 900ms linear infinite;
}

@keyframes aoi-spin {
  to {
    rotate: 360deg;
  }
}
</style>

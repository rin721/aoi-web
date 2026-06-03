<script setup lang="ts">
type IconButtonVariant = "standard" | "filled" | "tonal" | "outlined"
type IconButtonSize = "sm" | "md" | "lg"

const props = withDefaults(defineProps<{
  icon: string
  label: string
  variant?: IconButtonVariant
  size?: IconButtonSize
  active?: boolean
  disabled?: boolean
  href?: string
  to?: string
}>(), {
  variant: "standard",
  size: "md",
  active: false,
  disabled: false,
  href: undefined,
  to: undefined
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const tagName = computed(() => {
  const map: Record<IconButtonVariant, string> = {
    filled: "md-filled-icon-button",
    outlined: "md-outlined-icon-button",
    standard: "md-icon-button",
    tonal: "md-filled-tonal-icon-button"
  }

  return map[props.variant]
})

const iconSize = computed(() => {
  const map: Record<IconButtonSize, number> = {
    sm: 18,
    md: 21,
    lg: 24
  }

  return map[props.size]
})

const resolvedHref = computed(() => props.href || props.to)
const ariaCurrent = computed(() => props.active && resolvedHref.value ? "page" : undefined)

function onClick(event: MouseEvent) {
  emit("click", event)
}
</script>

<template>
  <component
    :is="tagName"
    class="aoi-icon-button"
    :class="{ 'aoi-icon-button--active': active }"
    :aria-label="label"
    :aria-current="ariaCurrent"
    :disabled="disabled || undefined"
    :href="resolvedHref"
    :toggle="active || undefined"
    :selected="active || undefined"
    @click="onClick"
  >
    <AoiIcon :name="icon" :size="iconSize" decorative />
  </component>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router"

type IconButtonVariant = "standard" | "filled" | "tonal" | "outlined"
type IconButtonSize = "sm" | "md" | "lg"
type LinkTarget = "_blank" | "_parent" | "_self" | "_top" | (string & {})

const props = withDefaults(defineProps<{
  icon: string
  label: string
  variant?: IconButtonVariant
  size?: IconButtonSize
  active?: boolean
  disabled?: boolean
  external?: boolean
  href?: RouteLocationRaw
  noRel?: boolean
  rel?: string | null
  target?: LinkTarget | null
  to?: RouteLocationRaw
}>(), {
  variant: "standard",
  size: "md",
  active: false,
  disabled: false,
  external: undefined,
  href: undefined,
  noRel: false,
  rel: undefined,
  target: undefined,
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

const hasLink = computed(() => Boolean(props.to || props.href))
const ariaCurrent = computed(() => props.active && hasLink.value ? "page" : undefined)

function onClick(event: MouseEvent) {
  emit("click", event)
}
</script>

<template>
  <AoiLink
    v-if="hasLink && !disabled"
    class="aoi-icon-button-link"
    :aria-current="ariaCurrent"
    :aria-label="label"
    :external="external"
    :href="href"
    :no-rel="noRel"
    :rel="rel"
    :target="target"
    :to="to"
    @click="onClick"
  >
    <component
      :is="tagName"
      class="aoi-icon-button"
      :class="{ 'aoi-icon-button--active': active }"
      aria-hidden="true"
      :selected="active || undefined"
      tabindex="-1"
      :toggle="active || undefined"
    >
      <AoiIcon :name="icon" :size="iconSize" decorative />
    </component>
  </AoiLink>
  <component
    v-else
    :is="tagName"
    class="aoi-icon-button"
    :class="{ 'aoi-icon-button--active': active }"
    :aria-label="label"
    :disabled="disabled || undefined"
    :selected="active || undefined"
    :toggle="active || undefined"
    @click="onClick"
  >
    <AoiIcon :name="icon" :size="iconSize" decorative />
  </component>
</template>

<style scoped>
.aoi-icon-button-link {
  display: inline-flex;
  color: inherit;
  text-decoration: none;
}

.aoi-icon-button-link > .aoi-icon-button {
  pointer-events: none;
}
</style>

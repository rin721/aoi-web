<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router"

type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "elevated"
type ButtonSize = "sm" | "md" | "lg"
type LinkTarget = "_blank" | "_parent" | "_self" | "_top" | (string & {})

const props = withDefaults(defineProps<{
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  trailingIcon?: string
  loading?: boolean
  disabled?: boolean
  ariaLabel?: string
  ariaPressed?: boolean
  external?: boolean
  href?: RouteLocationRaw
  noRel?: boolean
  rel?: string | null
  target?: LinkTarget | null
  to?: RouteLocationRaw
  type?: "button" | "submit" | "reset"
}>(), {
  variant: "filled",
  size: "md",
  icon: undefined,
  trailingIcon: undefined,
  loading: false,
  disabled: false,
  ariaLabel: undefined,
  ariaPressed: undefined,
  external: undefined,
  href: undefined,
  noRel: false,
  rel: undefined,
  target: undefined,
  to: undefined,
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

const hasLink = computed(() => Boolean(props.to || props.href))
const resolvedIcon = computed(() => props.loading ? "loader-circle" : props.icon)
const hasTrailingIcon = computed(() => Boolean(props.trailingIcon && !props.loading))

function onClick(event: MouseEvent) {
  emit("click", event)
}
</script>

<template>
  <AoiLink
    v-if="hasLink && !disabled && !loading"
    class="aoi-button-link"
    :aria-label="ariaLabel"
    :aria-pressed="ariaPressed"
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
      class="aoi-button"
      :class="`aoi-button--${size}`"
      aria-hidden="true"
      tabindex="-1"
      :type="type"
      :trailing-icon="hasTrailingIcon || undefined"
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
  </AoiLink>
  <component
    v-else
    :is="tagName"
    class="aoi-button"
    :class="`aoi-button--${size}`"
    :aria-label="ariaLabel"
    :aria-pressed="ariaPressed"
    :disabled="disabled || loading || undefined"
    :type="type"
    :trailing-icon="hasTrailingIcon || undefined"
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

.aoi-button-link {
  display: inline-flex;
  color: inherit;
  text-decoration: none;
}

.aoi-button-link > .aoi-button {
  pointer-events: none;
}

@keyframes aoi-spin {
  to {
    rotate: 360deg;
  }
}
</style>

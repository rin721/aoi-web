<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router"

type PlainButtonSize = "sm" | "md" | "lg"
type LinkTarget = "_blank" | "_parent" | "_self" | "_top" | (string & {})

const props = withDefaults(defineProps<{
  size?: PlainButtonSize
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
  ariaLabel: undefined,
  ariaPressed: undefined,
  disabled: false,
  external: undefined,
  href: undefined,
  icon: undefined,
  loading: false,
  noRel: false,
  rel: undefined,
  size: "md",
  target: undefined,
  to: undefined,
  trailingIcon: undefined,
  type: "button"
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <span class="aoi-plain-button">
    <AoiButton
      :aria-label="props.ariaLabel"
      :aria-pressed="props.ariaPressed"
      :disabled="props.disabled"
      :external="props.external"
      :href="props.href"
      :icon="props.icon"
      :loading="props.loading"
      :no-rel="props.noRel"
      :rel="props.rel"
      :size="props.size"
      :target="props.target"
      :to="props.to"
      :trailing-icon="props.trailingIcon"
      :type="props.type"
      variant="text"
      @click="emit('click', $event)"
    >
      <slot />
    </AoiButton>
  </span>
</template>

<style scoped>
.aoi-plain-button {
  display: inline-flex;
  vertical-align: middle;
  --md-text-button-label-text-color: var(--aoi-text-muted);
  --md-text-button-hover-label-text-color: var(--aoi-text);
  --md-text-button-focus-label-text-color: var(--aoi-text);
  --md-text-button-pressed-label-text-color: var(--aoi-text);
  --md-text-button-icon-color: var(--aoi-icon);
  --md-text-button-hover-icon-color: var(--aoi-text);
  --md-text-button-focus-icon-color: var(--aoi-text);
  --md-text-button-pressed-icon-color: var(--aoi-text);
  --md-text-button-hover-state-layer-color: var(--aoi-text);
  --md-text-button-focus-state-layer-color: var(--aoi-text);
  --md-text-button-pressed-state-layer-color: var(--aoi-text);
  --md-text-button-hover-state-layer-opacity: .06;
  --md-text-button-focus-state-layer-opacity: .08;
  --md-text-button-pressed-state-layer-opacity: .1;
}
</style>

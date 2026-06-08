<script setup lang="ts">
import type { AoiRevealProp, AoiSurfaceKind, AoiSurfacePadding, AoiSurfaceTone } from "~/types/ui"

const props = withDefaults(defineProps<{
  as?: string
  interactive?: boolean
  padding?: AoiSurfacePadding
  reveal?: AoiRevealProp
  selected?: boolean
  surface?: AoiSurfaceKind
  tone?: AoiSurfaceTone
}>(), {
  as: "div",
  interactive: false,
  padding: "md",
  reveal: false,
  selected: false,
  surface: "card",
  tone: "default"
})
</script>

<template>
  <component
    :is="props.as"
    v-aoi-reveal="props.reveal"
    class="aoi-surface"
    :class="[
      `aoi-surface--${props.surface}`,
      `aoi-surface--tone-${props.tone}`,
      `aoi-surface--padding-${props.padding}`,
      {
        'aoi-surface--interactive': props.interactive,
        'aoi-surface--selected': props.selected
      }
    ]"
  >
    <slot />
  </component>
</template>

<style scoped>
.aoi-surface {
  min-width: 0;
  color: var(--aoi-text);
}

.aoi-surface--plain {
  background: transparent;
}

.aoi-surface--panel,
.aoi-surface--card,
.aoi-surface--state,
.aoi-surface--code,
.aoi-surface--toolbar {
  border: 1px solid var(--aoi-border);
  box-shadow: var(--aoi-shadow-sm);
}

.aoi-surface--panel {
  border-radius: var(--aoi-radius-container);
  background: var(--aoi-panel-bg);
}

.aoi-surface--card,
.aoi-surface--state,
.aoi-surface--toolbar {
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
}

.aoi-surface--state {
  background: var(--aoi-surface);
}

.aoi-surface--code {
  overflow: hidden;
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-bg);
}

.aoi-surface--toolbar {
  background: var(--aoi-surface);
}

.aoi-surface--padding-none {
  padding: 0;
}

.aoi-surface--padding-sm {
  padding: 10px;
}

.aoi-surface--padding-md {
  padding: var(--aoi-card-padding);
}

.aoi-surface--padding-lg {
  padding: var(--aoi-panel-padding);
}

.aoi-surface--tone-accent {
  border-color: color-mix(in srgb, var(--aoi-accent-60) 24%, var(--aoi-border));
  background: color-mix(in srgb, var(--aoi-accent-10) 64%, var(--aoi-card-bg));
}

.aoi-surface--tone-danger {
  border-color: color-mix(in srgb, var(--aoi-danger) 24%, var(--aoi-border));
}

.aoi-surface--tone-muted {
  background: var(--aoi-surface-muted);
}

.aoi-surface--interactive {
  transition:
    border-color var(--aoi-motion-fast) var(--aoi-ease-out),
    background-color var(--aoi-motion-fast) var(--aoi-ease-out),
    box-shadow var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-out);
}

.aoi-surface--interactive:hover,
.aoi-surface--selected {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
}

.aoi-surface--interactive:hover {
  transform: translate3d(0, -1px, 0);
}

@media (prefers-reduced-motion: reduce) {
  .aoi-surface--interactive {
    transition: none;
  }

  .aoi-surface--interactive:hover {
    transform: none;
  }
}
</style>

<script setup lang="ts">
withDefaults(defineProps<{
  icon: string
  label: string
  disabled?: boolean
  fill?: boolean
}>(), {
  disabled: false,
  fill: true
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    class="aoi-media-overlay-button"
    :class="{ 'aoi-media-overlay-button--fill': fill }"
    type="button"
    :aria-label="label"
    :disabled="disabled || undefined"
    @click="emit('click', $event)"
  >
    <span class="aoi-media-overlay-button__control">
      <AoiIcon :name="icon" :size="32" decorative />
    </span>
  </button>
</template>

<style scoped>
.aoi-media-overlay-button {
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.aoi-media-overlay-button--fill {
  position: absolute;
  inset: 0;
}

.aoi-media-overlay-button:disabled {
  cursor: not-allowed;
  opacity: .58;
}

.aoi-media-overlay-button__control {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, .58);
  border-radius: var(--aoi-radius-round);
  background: rgba(255, 255, 255, .18);
  backdrop-filter: blur(12px);
  transition: transform var(--aoi-motion-fast) var(--aoi-ease-out);
}

.aoi-media-overlay-button:hover .aoi-media-overlay-button__control {
  transform: scale(1.06);
}

@media (prefers-reduced-motion: reduce) {
  .aoi-media-overlay-button__control {
    transition: none;
  }
}
</style>

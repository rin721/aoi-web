<script setup lang="ts">
const props = withDefaults(defineProps<{
  currentTime?: number
  duration?: number
}>(), {
  currentTime: 0,
  duration: 0
})

const emit = defineEmits<{
  seek: [seconds: number]
}>()

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const rest = String(safeSeconds % 60).padStart(2, "0")

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
  }

  return `${minutes}:${rest}`
}
</script>

<template>
  <div class="aoi-video-timeline">
    <span class="aoi-video-timeline__time">{{ formatTime(currentTime) }}</span>
    <AoiSlider
      class="aoi-video-timeline__slider"
      :model-value="currentTime"
      aria-label="播放进度"
      tone="inverse"
      compact
      :min="0"
      :max="Math.max(0, duration)"
      :step="0.1"
      @update:model-value="emit('seek', $event)"
    />
    <span class="aoi-video-timeline__time">{{ formatTime(duration) }}</span>
  </div>
</template>

<style scoped>
.aoi-video-timeline {
  display: grid;
  grid-template-columns: minmax(42px, auto) minmax(0, 1fr) minmax(42px, auto);
  align-items: center;
  gap: 9px;
  color: rgba(255, 255, 255, .88);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.aoi-video-timeline__time {
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .7);
}

.aoi-video-timeline__slider {
  --md-slider-active-track-color: var(--aoi-accent-60);
  --md-slider-handle-color: #fff;
  --md-slider-inactive-track-color: rgba(255, 255, 255, .28);
  --md-slider-with-tick-marks-active-container-color: var(--aoi-accent-60);
}

@media (max-width: 639px) {
  .aoi-video-timeline {
    grid-template-columns: 38px minmax(0, 1fr) 38px;
    gap: 6px;
    font-size: 11px;
  }
}
</style>

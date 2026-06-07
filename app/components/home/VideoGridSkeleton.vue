<script setup lang="ts">
const props = withDefaults(defineProps<{
  count?: number
  label?: string
}>(), {
  count: 8,
  label: undefined
})

const items = computed(() => Array.from({
  length: Math.max(1, Math.floor(props.count))
}, (_, index) => index))
</script>

<template>
  <AoiSkeletonGroup
    class="video-grid-skeleton"
    layout="grid"
    min-item-width="var(--aoi-video-grid-min-card-width)"
    :label="label"
  >
    <VideoCardSkeleton
      v-for="item in items"
      :key="item"
      class="video-grid-skeleton__item"
    />
  </AoiSkeletonGroup>
</template>

<style scoped>
.video-grid-skeleton {
  grid-template-columns: repeat(auto-fill, minmax(var(--aoi-video-grid-min-card-width), 1fr));
  gap: var(--aoi-video-grid-row-gap) var(--aoi-video-grid-column-gap);
}

.video-grid-skeleton__item {
  min-width: 0;
}

@media (max-width: 639px) {
  .video-grid-skeleton {
    width: 100%;
    max-width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--aoi-video-grid-mobile-row-gap) var(--aoi-video-grid-mobile-column-gap);
  }
}
</style>

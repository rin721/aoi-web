<script setup lang="ts">
import type { VideoSummary } from "~/types/api"

defineProps<{
  videos: VideoSummary[]
}>()
</script>

<template>
  <div class="video-grid">
    <AoiReveal
      v-for="(video, index) in videos"
      :key="video.id"
      class="video-grid__item"
      :index="index"
    >
      <VideoCard
        :video="video"
        :index="index"
      />
    </AoiReveal>
  </div>
</template>

<style scoped>
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--aoi-video-grid-min-card-width), 1fr));
  gap: var(--aoi-video-grid-row-gap) var(--aoi-video-grid-column-gap);
}

.video-grid__item {
  min-width: 0;
}

@media (max-width: 639px) {
  .video-grid {
    width: 100%;
    max-width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--aoi-video-grid-mobile-row-gap) var(--aoi-video-grid-mobile-column-gap);
  }
}
</style>

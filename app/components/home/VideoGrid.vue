<script setup lang="ts">
import type { VideoSummary } from "~/types/api"

withDefaults(defineProps<{
  showActions?: boolean
  videos: VideoSummary[]
}>(), {
  showActions: true
})
</script>

<template>
  <div class="video-grid">
    <VideoCard
      v-for="(video, index) in videos"
      :key="video.id"
      :video="video"
      :index="index"
      :show-actions="showActions"
    />
  </div>
</template>

<style scoped>
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(224px, 1fr));
  gap: 18px 16px;
}

@media (max-width: 639px) {
  .video-grid {
    width: 100%;
    max-width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 10px;
  }
}
</style>

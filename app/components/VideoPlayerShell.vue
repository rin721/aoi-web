<script setup lang="ts">
import type { VideoDetail } from "~/types/api"

defineProps<{
  video: VideoDetail
}>()
</script>

<template>
  <section class="video-player-shell" aria-label="视频播放器占位">
    <div class="video-player-shell__screen">
      <div class="video-player-shell__play">
        <AoiIcon name="play" :size="32" decorative />
      </div>
      <div class="video-player-shell__meta">
        <span>Mock Player</span>
        <span>{{ video.durationSeconds }}s</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.video-player-shell {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-md);
  background: var(--aoi-surface);
  box-shadow: var(--aoi-shadow-sm);
  overflow: hidden;
}

.video-player-shell__screen {
  position: relative;
  display: grid;
  aspect-ratio: 16 / 9;
  min-height: 260px;
  place-items: center;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, .2), transparent 45%),
    linear-gradient(135deg, #17262b, #216d7d 48%, #f2709c);
}

.video-player-shell__screen::before,
.video-player-shell__screen::after {
  position: absolute;
  content: "";
}

.video-player-shell__screen::before {
  top: 26px;
  left: 26px;
  width: 120px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .72);
  box-shadow: 0 18px 0 rgba(255, 255, 255, .42);
}

.video-player-shell__screen::after {
  right: 28px;
  bottom: 28px;
  width: 72px;
  height: 72px;
  border: 2px solid rgba(255, 255, 255, .72);
  border-radius: 50%;
}

.video-player-shell__play {
  position: relative;
  z-index: 1;
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, .58);
  border-radius: 50%;
  background: rgba(255, 255, 255, .18);
  color: #fff;
  backdrop-filter: blur(12px);
}

.video-player-shell__meta {
  position: absolute;
  right: 16px;
  bottom: 14px;
  z-index: 1;
  display: flex;
  gap: 10px;
  color: rgba(255, 255, 255, .84);
  font-size: 12px;
}

@media (max-width: 639px) {
  .video-player-shell__screen {
    min-height: 190px;
  }
}
</style>

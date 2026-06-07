<script setup lang="ts">
import type { VideoSummary } from "~/types/api"

withDefaults(defineProps<{
  compact?: boolean
  currentVideoId?: string
  title?: string
  videos?: VideoSummary[]
}>(), {
  compact: false,
  currentVideoId: undefined,
  title: "接下来播放",
  videos: () => []
})

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const rest = String(safeSeconds % 60).padStart(2, "0")

  return `${minutes}:${rest}`
}

function formatCount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }

  return String(value)
}
</script>

<template>
  <section class="aoi-video-queue" :class="{ 'aoi-video-queue--compact': compact }">
    <header class="aoi-video-queue__header">
      <h2>{{ title }}</h2>
      <AoiIcon name="list-video" :size="18" decorative />
    </header>

    <div class="aoi-video-queue__list">
      <AoiLink
        v-for="video in videos"
        :key="video.id"
        class="aoi-video-queue__item"
        :class="{ 'aoi-video-queue__item--active': video.id === currentVideoId }"
        :to="`/video/${video.slug}`"
      >
        <AoiLazyImage
          class="aoi-video-queue__thumb"
          :src="video.thumbnailUrl"
          alt=""
        />
        <span class="aoi-video-queue__duration">{{ formatDuration(video.durationSeconds) }}</span>
        <span class="aoi-video-queue__copy">
          <strong>{{ video.title }}</strong>
          <span>{{ video.uploader.displayName }}</span>
          <span class="aoi-video-queue__stats">
            <AoiIcon name="play" :size="12" decorative />
            {{ formatCount(video.viewCount) }}
            <AoiIcon name="message-square-text" :size="12" decorative />
            {{ formatCount(video.commentCount) }}
          </span>
        </span>
      </AoiLink>
    </div>
  </section>
</template>

<style scoped>
.aoi-video-queue {
  display: grid;
  gap: 8px;
  border: 1px solid color-mix(in srgb, var(--aoi-border) 70%, rgba(255, 148, 113, .2));
  border-radius: var(--aoi-radius-card);
  background: rgba(255, 255, 255, .74);
  box-shadow: 0 10px 32px rgba(19, 80, 96, .08);
  padding: 10px;
}

.aoi-video-queue__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.aoi-video-queue__header h2 {
  margin: 0;
  color: var(--aoi-text);
  font-size: 14px;
}

.aoi-video-queue__list {
  display: grid;
  gap: 6px;
}

.aoi-video-queue__item {
  position: relative;
  display: grid;
  min-width: 0;
  grid-template-columns: 108px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  border-radius: var(--aoi-radius-control);
  color: var(--aoi-text);
  padding: 5px;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-press);
}

.aoi-video-queue__item:hover,
.aoi-video-queue__item--active {
  background: color-mix(in srgb, var(--aoi-accent-10) 72%, white);
}

.aoi-video-queue__item:active {
  transform: scale(.98);
}

.aoi-video-queue__thumb {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--aoi-radius-control);
  background: color-mix(in srgb, var(--aoi-accent-10) 62%, white);
}

.aoi-video-queue__duration {
  position: absolute;
  bottom: 9px;
  left: 76px;
  border-radius: var(--aoi-radius-xs);
  background: rgba(0, 0, 0, .62);
  color: #fff;
  font-size: 10px;
  font-weight: 820;
  line-height: 1;
  padding: 3px 4px;
}

.aoi-video-queue__copy {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.aoi-video-queue__copy strong {
  display: -webkit-box;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.42;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.aoi-video-queue__copy span {
  overflow: hidden;
  color: var(--aoi-text-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aoi-video-queue__stats {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.aoi-video-queue--compact .aoi-video-queue__item {
  grid-template-columns: 96px minmax(0, 1fr);
}

.aoi-video-queue--compact .aoi-video-queue__duration {
  left: 64px;
}

@media (max-width: 639px) {
  .aoi-video-queue__item {
    grid-template-columns: 96px minmax(0, 1fr);
  }

  .aoi-video-queue__duration {
    left: 64px;
  }
}
</style>

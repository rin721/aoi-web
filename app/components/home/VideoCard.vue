<script setup lang="ts">
import type { VideoSummary } from "~/types/api"

const props = withDefaults(defineProps<{
  showActions?: boolean
  video: VideoSummary
  index: number
}>(), {
  showActions: true
})

const library = useLibraryStore()
const coverClass = computed(() => `video-card__cover--${(props.index % 6) + 1}`)
const detailPath = computed(() => `/video/${props.video.slug}`)
const isFavorite = computed(() => library.isFavorite(props.video.id))
const isWatchLater = computed(() => library.isWatchLater(props.video.id))
</script>

<template>
  <article class="video-card">
    <div class="video-card__media">
      <NuxtLink class="video-card__cover-link" :to="detailPath" :aria-label="video.title">
        <span class="video-card__cover" :class="coverClass" />
      </NuxtLink>
      <div v-if="showActions" class="video-card__actions" aria-label="视频快捷操作">
        <AoiIconButton
          :active="isFavorite"
          :icon="isFavorite ? 'star' : 'star'"
          :label="isFavorite ? '取消收藏' : '收藏'"
          :disabled="!library.hydrated"
          size="sm"
          :variant="isFavorite ? 'tonal' : 'standard'"
          @click="library.toggleFavorite(video)"
        />
        <AoiIconButton
          :active="isWatchLater"
          icon="clock-3"
          :label="isWatchLater ? '移出稍后看' : '稍后看'"
          :disabled="!library.hydrated"
          size="sm"
          :variant="isWatchLater ? 'tonal' : 'standard'"
          @click="library.toggleWatchLater(video)"
        />
      </div>
    </div>

    <NuxtLink class="video-card__title" :to="detailPath">{{ video.title }}</NuxtLink>
    <VideoMeta :video="video" compact />
  </article>
</template>

<style scoped>
.video-card {
  display: grid;
  min-width: 0;
  border-radius: var(--aoi-radius-sm);
  color: var(--aoi-text);
  gap: 8px;
  padding: 8px;
  transition:
    transform var(--aoi-motion-base) var(--aoi-ease-out),
    box-shadow var(--aoi-motion-base) var(--aoi-ease-out),
    background var(--aoi-motion-base) var(--aoi-ease-out);
}

.video-card:hover {
  background: var(--aoi-surface);
  box-shadow: var(--aoi-shadow-md);
  transform: translateY(-6px);
}

.video-card:active {
  transform: scale(.972);
}

.video-card__media {
  position: relative;
  min-width: 0;
}

.video-card__cover-link {
  display: block;
  border-radius: var(--aoi-radius-sm);
}

.video-card__cover {
  display: block;
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--aoi-radius-sm);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent 45%),
    var(--cover);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.32);
}

.video-card__cover::before,
.video-card__cover::after {
  position: absolute;
  content: "";
  pointer-events: none;
}

.video-card__cover::before {
  inset: auto 12px 12px auto;
  width: 42px;
  height: 42px;
  border: 2px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
}

.video-card__cover::after {
  top: 14px;
  left: 14px;
  width: 78px;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 12px 0 rgba(255, 255, 255, 0.42);
}

.video-card__cover--1 { --cover: linear-gradient(135deg, #6de5e5, #5b8def 48%, #f2709c); }
.video-card__cover--2 { --cover: linear-gradient(135deg, #f7b955, #d9f7cc 48%, #65d5e4); }
.video-card__cover--3 { --cover: linear-gradient(135deg, #7a68f0, #22b8cf 48%, #151c33); }
.video-card__cover--4 { --cover: linear-gradient(135deg, #c9f3f7, #8fc7ff 45%, #f7d3df); }
.video-card__cover--5 { --cover: linear-gradient(135deg, #17262b, #216d7d 48%, #f2709c); }
.video-card__cover--6 { --cover: linear-gradient(135deg, #fff6fb, #f2709c 45%, #22b8cf); }

.video-card__actions {
  position: absolute;
  inset: 8px 8px auto auto;
  display: flex;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: var(--aoi-radius-sm);
  background: rgba(255, 255, 255, 0.76);
  box-shadow: var(--aoi-shadow-sm);
  padding: 2px;
  backdrop-filter: blur(14px);
}

.video-card__title {
  display: -webkit-box;
  min-height: 42px;
  overflow: hidden;
  font-weight: 700;
  line-height: 1.5;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (max-width: 639px) {
  .video-card {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    gap: 7px;
    padding: 5px;
  }

  .video-card:hover {
    box-shadow: none;
    transform: none;
  }

  .video-card__cover {
    width: 100%;
    max-width: 100%;
  }

  .video-card__title {
    min-height: 40px;
    font-size: 13px;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  .video-card__actions {
    inset: 5px 5px auto auto;
    gap: 1px;
    padding: 1px;
  }
}
</style>

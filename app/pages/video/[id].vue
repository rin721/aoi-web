<script setup lang="ts">
const route = useRoute()
const api = useAoiApi()
const library = useLibraryStore()
const id = computed(() => String(route.params.id || ""))

const { data: video, error, pending, refresh } = useAsyncData(() => `video-${id.value}`, () => api.getVideoDetail(id.value), {
  watch: [id]
})

const isFavorite = computed(() => video.value ? library.isFavorite(video.value.id) : false)
const isLiked = computed(() => video.value ? library.isLiked(video.value.id) : false)
const isWatchLater = computed(() => video.value ? library.isWatchLater(video.value.id) : false)
const localLikeCount = computed(() => video.value ? video.value.likeCount + (isLiked.value ? 1 : 0) : 0)

watch([video, () => library.hydrated], ([current, hydrated]) => {
  if (import.meta.client && hydrated && current) {
    library.recordView(current)
  }
}, { immediate: true })

useHead(() => ({
  title: video.value ? `${video.value.title} - Aoi` : "Video - Aoi"
}))
</script>

<template>
  <div class="aoi-page">
    <PageState
      v-if="error"
      icon="video-off"
      title="视频不存在"
      :description="`没有找到「${route.params.id}」对应的视频。`"
      action-icon="home"
      action-label="返回首页"
      @action="navigateTo('/')"
    />

    <div v-else-if="pending" class="video-detail-state">
      <AoiProgress indeterminate />
    </div>

    <article v-else-if="video" class="video-detail">
      <VideoPlayerShell :video="video" />

      <section class="video-detail__main">
        <div class="video-detail__body">
          <PageHeader
            eyebrow="Video"
            :title="video.title"
            :description="video.description"
          >
            <template #actions>
              <AoiButton
                :variant="isLiked ? 'tonal' : 'outlined'"
                icon="heart"
                :aria-label="isLiked ? '取消点赞' : '点赞'"
                :disabled="!library.hydrated"
                @click="library.toggleLiked(video.id)"
              >
                {{ localLikeCount }}
              </AoiButton>
              <AoiButton variant="outlined" icon="message-circle">{{ video.commentCount }}</AoiButton>
            </template>
          </PageHeader>

          <VideoMeta :video="video" link-uploader />

          <div class="video-detail__actions" aria-label="本地互动操作">
            <AoiButton
              :variant="isFavorite ? 'tonal' : 'outlined'"
              icon="star"
              :aria-label="isFavorite ? '取消收藏' : '收藏'"
              :disabled="!library.hydrated"
              @click="library.toggleFavorite(video)"
            >
              {{ isFavorite ? "已收藏" : "收藏" }}
            </AoiButton>
            <AoiButton
              :variant="isWatchLater ? 'tonal' : 'outlined'"
              icon="clock-3"
              :aria-label="isWatchLater ? '移出稍后看' : '稍后看'"
              :disabled="!library.hydrated"
              @click="library.toggleWatchLater(video)"
            >
              {{ isWatchLater ? "已加入稍后看" : "稍后看" }}
            </AoiButton>
          </div>

          <div class="video-detail__tags" aria-label="标签">
            <NuxtLink
              v-for="tag in video.tags"
              :key="tag"
              class="video-detail__tag"
              :to="`/search?q=${encodeURIComponent(tag)}`"
            >
              # {{ tag }}
            </NuxtLink>
          </div>
        </div>

        <aside class="video-detail__side" aria-labelledby="related-title">
          <h2 id="related-title" class="video-detail__side-title">相关推荐</h2>
          <VideoGrid :videos="video.related" />
        </aside>
      </section>
    </article>

    <PageState
      v-else
      icon="video"
      title="视频加载中断"
      description="没有拿到视频数据。"
      action-icon="refresh-cw"
      action-label="重试"
      @action="refresh()"
    />
  </div>
</template>

<style scoped>
.video-detail {
  display: grid;
  gap: 18px;
}

.video-detail__main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 22px;
  align-items: start;
}

.video-detail__body {
  min-width: 0;
}

.video-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.video-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.video-detail__tag {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  color: var(--aoi-accent-60);
  font-size: 12px;
  font-weight: 750;
  padding: 5px 9px;
}

.video-detail__side {
  min-width: 0;
}

.video-detail__side-title {
  margin: 0 0 10px;
  color: var(--aoi-text);
  font-size: 16px;
}

.video-detail__side :deep(.video-grid) {
  grid-template-columns: 1fr;
}

.video-detail-state {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  padding: 16px;
}

@media (max-width: 960px) {
  .video-detail__main {
    grid-template-columns: 1fr;
  }

  .video-detail__side :deep(.video-grid) {
    grid-template-columns: repeat(auto-fill, minmax(224px, 1fr));
  }
}
</style>

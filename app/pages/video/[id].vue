<script setup lang="ts">
import type { CommentSortMode } from "~/types/comments"

const route = useRoute()
const api = useAoiApi()
const settings = useAppSettingsStore()
const library = useLibraryStore()
const comments = useCommentsStore()
const id = computed(() => String(route.params.id || ""))
const commentSortMode = ref<CommentSortMode>("newest")

const { data: video, error, pending, refresh } = useAsyncData(() => `video-${id.value}`, () => api.getVideoDetail(id.value), {
  watch: [id]
})

const isFavorite = computed(() => video.value ? library.isFavorite(video.value.id) : false)
const isLiked = computed(() => video.value ? library.isLiked(video.value.id) : false)
const isWatchLater = computed(() => video.value ? library.isWatchLater(video.value.id) : false)
const localLikeCount = computed(() => video.value ? video.value.likeCount + (isLiked.value ? 1 : 0) : 0)
const localCommentCount = computed(() => video.value ? comments.commentCountForVideo(video.value.id) : 0)
const displayCommentCount = computed(() => video.value ? video.value.commentCount + localCommentCount.value : 0)
const visibleComments = computed(() => video.value ? comments.commentsForVideo(video.value.id, commentSortMode.value) : [])
const initialProgressSeconds = computed(() => {
  if (!video.value || settings.disableWatchHistory) {
    return 0
  }

  return library.historyProgressForVideo(video.value.id)
})
const commentAuthorName = computed({
  get: () => comments.authorName,
  set: (value: string) => comments.setAuthorName(value)
})

watch([video, () => library.hydrated], ([current, hydrated]) => {
  if (import.meta.client && hydrated && current && !settings.disableWatchHistory) {
    library.recordView(current)
  }
}, { immediate: true })

function onPlayerProgress(seconds: number) {
  if (video.value && library.hydrated && !settings.disableWatchHistory) {
    library.updateHistoryProgress(video.value.id, seconds)
  }
}

function onPlayerEnded() {
  if (video.value && library.hydrated && !settings.disableWatchHistory) {
    library.updateHistoryProgress(video.value.id, video.value.durationSeconds)
  }
}

function submitComment(body: string) {
  if (video.value) {
    comments.submitComment(video.value.id, body)
  }
}

function editComment(commentId: string, body: string) {
  if (video.value) {
    comments.editComment(video.value.id, commentId, body)
  }
}

function deleteComment(commentId: string) {
  if (video.value) {
    comments.deleteComment(video.value.id, commentId)
  }
}

useHead(() => ({
  title: video.value ? `${video.value.title} - Aoi` : "Video - Aoi"
}))
</script>

<template>
  <div class="aoi-page">
    <PageState
      v-if="!pending && error"
      icon="video-off"
      title="视频不存在"
      :description="`没有找到“${route.params.id}”对应的视频。`"
      action-icon="home"
      action-label="返回首页"
      @action="navigateTo('/')"
    />

    <article v-else-if="!pending && video" class="video-detail">
      <VideoPlayerShell
        :video="video"
        :initial-progress-seconds="initialProgressSeconds"
        @ended="onPlayerEnded"
        @progress="onPlayerProgress"
      />

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
              <AoiButton variant="outlined" icon="message-circle">
                {{ displayCommentCount }}
              </AoiButton>
            </template>
          </PageHeader>

          <AoiReveal variant="fade">
            <VideoMeta :video="video" link-uploader />
          </AoiReveal>

          <div v-aoi-reveal="'rise'" class="video-detail__actions" aria-label="本地互动操作">
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

          <div v-aoi-reveal="'fade'" class="video-detail__tags" aria-label="标签">
            <AoiLink
              v-for="tag in video.tags"
              :key="tag"
              class="video-detail__tag"
              :to="`/search?q=${encodeURIComponent(tag)}`"
            >
              # {{ tag }}
            </AoiLink>
          </div>

          <section v-aoi-reveal="'rise'" class="video-detail__comments" aria-label="本地讨论区">
            <CommentComposer
              v-model:author-name="commentAuthorName"
              :disabled="!comments.hydrated"
              @submit="submitComment"
            />
            <CommentThread
              v-model:sort-mode="commentSortMode"
              :comments="visibleComments"
              :hydrated="comments.hydrated"
              @delete="deleteComment"
              @edit="editComment"
            />
          </section>
        </div>

        <aside v-aoi-reveal="'slide-left'" class="video-detail__side" aria-labelledby="related-title">
          <h2 id="related-title" class="video-detail__side-title">相关推荐</h2>
          <VideoGrid :videos="video.related" />
        </aside>
      </section>
    </article>

    <PageState
      v-else-if="!pending"
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

.video-detail__comments {
  display: grid;
  gap: 18px;
  margin-top: 22px;
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

@media (max-width: 960px) {
  .video-detail__main {
    grid-template-columns: 1fr;
  }

  .video-detail__side :deep(.video-grid) {
    grid-template-columns: repeat(auto-fill, minmax(224px, 1fr));
  }
}
</style>

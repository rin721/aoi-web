<script setup lang="ts">
import type { CommentSortMode } from "~/types/comments"
import type { VideoDanmakuMode } from "~/types/api"

const route = useRoute()
const api = useAoiApi()
const settings = useAppSettingsStore()
const library = useLibraryStore()
const comments = useCommentsStore()
const danmaku = useDanmakuStore()
const id = computed(() => String(route.params.id || ""))
const commentSortMode = ref<CommentSortMode>("newest")
const playerRef = ref<{ seekTo: (seconds: number) => void } | null>(null)
const playerCurrentTime = ref(0)

const { data: watchPayload, error, pending, refresh } = useAsyncData(() => `video-watch-${id.value}`, async () => {
  const video = await api.getVideoDetail(id.value)
  const [creator, danmakuPayload] = await Promise.all([
    api.getCreatorProfile(video.uploader.handle).catch(() => null),
    api.getVideoDanmaku(video.id).catch(() => ({
      items: [],
      nextCursor: null,
      totalCount: 0,
      videoId: video.id
    }))
  ])

  return {
    creator,
    danmakuItems: danmakuPayload.items,
    video
  }
}, {
  watch: [id]
})

const video = computed(() => watchPayload.value?.video || null)
const creator = computed(() => watchPayload.value?.creator || null)
const mockDanmakuItems = computed(() => watchPayload.value?.danmakuItems || [])
const mergedDanmakuItems = computed(() => {
  if (!video.value) {
    return mockDanmakuItems.value
  }

  return [
    ...mockDanmakuItems.value,
    ...danmaku.danmakuForVideo(video.value.id)
  ].sort((a, b) => a.timeSeconds - b.timeSeconds)
})
const isFavorite = computed(() => video.value ? library.isFavorite(video.value.id) : false)
const isLiked = computed(() => video.value ? library.isLiked(video.value.id) : false)
const isWatchLater = computed(() => video.value ? library.isWatchLater(video.value.id) : false)
const localLikeCount = computed(() => video.value ? video.value.likeCount + (isLiked.value ? 1 : 0) : 0)
const localCommentCount = computed(() => video.value ? comments.commentCountForVideo(video.value.id) : 0)
const displayCommentCount = computed(() => video.value ? video.value.commentCount + localCommentCount.value : 0)
const displayDanmakuCount = computed(() => mergedDanmakuItems.value.length)
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
const primaryQueue = computed(() => video.value?.related.slice(0, 1) || [])
const relatedQueue = computed(() => video.value?.related.slice(1) || [])

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

function submitDanmaku(payload: {
  body: string
  color: string
  mode: VideoDanmakuMode
  timeSeconds: number
}) {
  if (video.value) {
    danmaku.submitDanmaku(video.value.id, payload, comments.authorName)
  }
}

function seekDanmaku(seconds: number) {
  playerRef.value?.seekTo(seconds)
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
  <div class="aoi-page video-watch-page">
    <PageState
      v-if="!pending && error"
      icon="video-off"
      title="视频不存在"
      :description="`没有找到 ${route.params.id} 对应的视频。`"
      action-icon="home"
      action-label="返回首页"
      @action="navigateTo('/')"
    />

    <article v-else-if="!pending && video" class="video-watch">
      <PageHeader
        class="video-watch__header"
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
          <AoiButton variant="outlined" icon="message-square-text">
            {{ displayDanmakuCount }}
          </AoiButton>
          <AoiButton variant="outlined" icon="message-circle">
            {{ displayCommentCount }}
          </AoiButton>
        </template>
      </PageHeader>

      <AoiWatchLayout>
        <template #primary>
          <AoiVideoPlayer
            ref="playerRef"
            :src="video.sourceUrl"
            :title="video.title"
            :duration-seconds="video.durationSeconds"
            :initial-progress-seconds="initialProgressSeconds"
            :danmaku-items="mergedDanmakuItems"
            :danmaku-enabled="settings.danmakuEnabled"
            @ended="onPlayerEnded"
            @progress="onPlayerProgress"
            @send-danmaku="submitDanmaku"
            @time-change="playerCurrentTime = $event"
          />
        </template>

        <template #side>
          <CreatorCard
            v-if="creator"
            :creator="creator"
          />
          <AoiDanmakuPanel
            :items="mergedDanmakuItems"
            :current-time="playerCurrentTime"
            @seek="seekDanmaku"
          />
          <AoiVideoQueueList
            v-if="primaryQueue.length && !settings.noRelatedVideos"
            title="接下来播放"
            :videos="primaryQueue"
            compact
          />
          <AoiVideoQueueList
            v-if="relatedQueue.length && !settings.noRelatedVideos"
            title="相关推荐"
            :videos="relatedQueue"
            compact
          />
        </template>

        <template #below>
          <section class="video-watch__below">
            <div class="video-watch__meta">
              <VideoMeta :video="video" link-uploader />
            </div>

            <div v-aoi-reveal="'rise'" class="video-watch__actions" aria-label="本地互动操作">
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
              <AoiButton
                variant="outlined"
                icon="flag"
              >
                稿件举报
              </AoiButton>
            </div>

            <section v-if="video.description" v-aoi-reveal="'fade'" class="video-watch__description">
              <h2>简介</h2>
              <p>{{ video.description }}</p>
            </section>

            <div v-aoi-reveal="'fade'" class="video-watch__tags" aria-label="标签">
              <AoiLink
                v-for="tag in video.tags"
                :key="tag"
                class="video-watch__tag"
                :to="`/search?q=${encodeURIComponent(tag)}`"
              >
                # {{ tag }}
              </AoiLink>
            </div>

            <section v-aoi-reveal="'rise'" class="video-watch__comments" aria-label="本地评论区">
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
          </section>
        </template>
      </AoiWatchLayout>
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
.video-watch-page {
  position: relative;
  isolation: isolate;
}

.video-watch-page::before {
  position: fixed;
  inset: 0;
  z-index: -1;
  content: "";
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--aoi-accent-10) 82%, white) 0 220px, transparent 520px),
    linear-gradient(90deg, color-mix(in srgb, var(--aoi-sakura-20) 48%, transparent), transparent 22%),
    radial-gradient(circle at 82% 8%, color-mix(in srgb, var(--aoi-accent-40) 22%, transparent), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, .68), transparent);
  pointer-events: none;
}

.video-watch {
  display: grid;
  gap: 10px;
}

.video-watch :deep(.video-watch__header) {
  align-items: center;
  margin-bottom: 4px;
}

.video-watch :deep(.page-header__eyebrow) {
  margin-bottom: 2px;
  color: var(--aoi-sakura-50);
  font-size: 11px;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.video-watch :deep(.page-header__title) {
  font-size: clamp(22px, 2vw, 30px);
  line-height: 1.18;
}

.video-watch :deep(.page-header__description) {
  max-width: 860px;
  margin-top: 6px;
  color: color-mix(in srgb, var(--aoi-text-muted) 88%, var(--aoi-accent-60));
  font-size: 13px;
  line-height: 1.55;
}

.video-watch :deep(.page-header__actions) {
  gap: 6px;
}

.video-watch :deep(.aoi-watch-layout__side) {
  position: sticky;
  top: var(--aoi-settings-sticky-top);
  max-height: calc(100vh - 24px);
  overflow: auto;
  padding-right: 2px;
  scrollbar-width: thin;
}

.video-watch :deep(.creator-card) {
  border-color: color-mix(in srgb, var(--aoi-border) 72%, rgba(247, 112, 156, .28));
  border-radius: var(--aoi-radius-card);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, .9), rgba(255, 241, 247, .72)),
    var(--aoi-panel-bg);
  box-shadow: 0 10px 32px rgba(19, 80, 96, .08);
  padding: 10px;
}

.video-watch :deep(.creator-card:hover) {
  box-shadow: 0 14px 34px rgba(19, 80, 96, .12);
  transform: translate3d(0, -2px, 0);
}

.video-watch :deep(.creator-card__link) {
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 9px;
}

.video-watch :deep(.creator-card__avatar) {
  width: 42px;
  height: 42px;
  border-radius: var(--aoi-radius-control);
}

.video-watch :deep(.creator-card__bio) {
  -webkit-line-clamp: 1;
}

.video-watch :deep(.creator-card__actions .aoi-button) {
  --md-outlined-button-outline-color: color-mix(in srgb, var(--aoi-sakura-50) 54%, transparent);
  --md-outlined-button-label-text-color: var(--aoi-sakura-60);
  --md-outlined-button-icon-color: var(--aoi-sakura-60);
}

.video-watch__below {
  display: grid;
  gap: 14px;
  max-width: min(920px, 100%);
  padding-top: 2px;
}

.video-watch__meta {
  border: 1px solid color-mix(in srgb, var(--aoi-border) 78%, transparent);
  border-radius: var(--aoi-radius-card);
  background: rgba(255, 255, 255, .68);
  padding: 10px 12px;
}

.video-watch__actions,
.video-watch__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.video-watch__description {
  display: grid;
  gap: 8px;
  border: 1px solid color-mix(in srgb, var(--aoi-border) 78%, transparent);
  border-radius: var(--aoi-radius-card);
  background: rgba(255, 255, 255, .7);
  padding: 14px;
}

.video-watch__description h2,
.video-watch__description p {
  margin: 0;
}

.video-watch__description h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.video-watch__description p {
  color: var(--aoi-text-muted);
  line-height: 1.75;
}

.video-watch__tag {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--aoi-accent-40) 34%, var(--aoi-border));
  border-radius: var(--aoi-radius-control);
  background: color-mix(in srgb, var(--aoi-accent-10) 72%, white);
  color: var(--aoi-accent-60);
  font-size: 12px;
  font-weight: 800;
  padding: 5px 9px;
}

.video-watch__comments {
  display: grid;
  gap: 18px;
}

@media (max-width: 1100px) {
  .video-watch :deep(.aoi-watch-layout__side) {
    position: static;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

@media (max-width: 639px) {
  .video-watch {
    gap: 8px;
  }

  .video-watch :deep(.video-watch__header) {
    align-items: flex-start;
  }

  .video-watch__below {
    gap: 12px;
  }
}
</style>

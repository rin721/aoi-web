<script setup lang="ts">
const config = useRuntimeConfig()
const settings = useAppSettingsStore()
const api = useAoiApi()
const library = useLibraryStore()
const telemetry = useAoiApiTelemetry()
const uploadDrafts = useUploadDraftStore()
const following = useFollowingStore()
const comments = useCommentsStore()
const playerSettings = usePlayerSettingsStore()

const defaultCommentAuthor = "Aoi 游客"
const confirmOpen = ref(false)
const pendingAction = ref<{
  action: () => Promise<void> | void
  body: string
  title: string
} | null>(null)

const activeBaseURL = computed(() => config.public.apiMock ? "/api/mock" : config.public.apiBaseURL)
const localStats = computed(() => ({
  favorites: Object.keys(library.favoriteVideos).length,
  history: library.history.length,
  liked: library.likedCount,
  watchLater: Object.keys(library.watchLaterVideos).length
}))
const hasLocalData = computed(() => Object.values(localStats.value).some((value) => value > 0))
const uploadStats = computed(() => ({
  drafts: uploadDrafts.draftCount,
  queued: uploadDrafts.queuedCount,
  ready: uploadDrafts.readyCount
}))
const hasUploadDrafts = computed(() => uploadStats.value.drafts > 0)
const followingStats = computed(() => ({
  creators: following.followedCount,
  videos: following.latestVideos.length
}))
const hasFollowingData = computed(() => followingStats.value.creators > 0)
const commentStats = computed(() => ({
  author: comments.authorName,
  total: comments.totalCount,
  videos: comments.videoCount
}))
const hasCommentData = computed(() => commentStats.value.total > 0 || commentStats.value.author !== defaultCommentAuthor)
const playerStats = computed(() => ({
  muted: playerSettings.muted,
  playbackRate: playerSettings.playbackRate,
  theaterMode: playerSettings.theaterMode,
  volume: Math.round(playerSettings.volume * 100)
}))
const hasPlayerSettings = computed(() => {
  return playerSettings.volume !== 0.8
    || playerSettings.muted
    || playerSettings.playbackRate !== 1
    || playerSettings.theaterMode
})

const {
  data: apiStatus,
  error: apiStatusError,
  pending: apiStatusPending,
  refresh: refreshApiStatus
} = useAsyncData("api-status", () => api.getApiStatus())

function askConfirm(title: string, body: string, action: () => Promise<void> | void) {
  pendingAction.value = { action, body, title }
  confirmOpen.value = true
}

async function runPendingAction() {
  if (!pendingAction.value) {
    return
  }

  await pendingAction.value.action()
  confirmOpen.value = false
  pendingAction.value = null
}

function cancelPendingAction() {
  confirmOpen.value = false
  pendingAction.value = null
}
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="高级"
      description="保留原设置页里的 API 诊断、本地缓存统计和重置操作。"
    />

    <SettingsPanel
      icon="server"
      title="数据源"
      description="当前运行时配置只读展示。"
    >
      <div class="settings-stat-grid">
        <div class="settings-stat">
          <span>Mock API</span>
          <strong>{{ config.public.apiMock ? "开启" : "关闭" }}</strong>
        </div>
        <div class="settings-stat">
          <span>Base URL</span>
          <strong>{{ activeBaseURL }}</strong>
        </div>
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="cloud"
      title="API 状态"
      description="用于未来对接 Go API 前确认 mock 契约。"
    >
      <template #actions>
        <AoiButton
          variant="outlined"
          size="sm"
          icon="refresh-cw"
          :loading="apiStatusPending"
          @click="refreshApiStatus()"
        >
          刷新
        </AoiButton>
      </template>

      <AoiProgress v-if="apiStatusPending" indeterminate />
      <PageState
        v-else-if="apiStatusError"
        icon="cloud-alert"
        title="API 状态不可用"
        description="当前 API 状态探测失败。"
        action-icon="refresh-cw"
        action-label="重试"
        @action="refreshApiStatus()"
      />

      <template v-else-if="apiStatus">
        <div class="settings-stat-grid">
          <div class="settings-stat">
            <span>模式</span>
            <strong>{{ apiStatus.mode }}</strong>
          </div>
          <div class="settings-stat">
            <span>Base Path</span>
            <strong>{{ apiStatus.basePath }}</strong>
          </div>
          <div class="settings-stat">
            <span>Endpoint</span>
            <strong>{{ apiStatus.endpoints.length }}</strong>
          </div>
          <div class="settings-stat">
            <span>更新时间</span>
            <strong>{{ new Date(apiStatus.generatedAt).toLocaleTimeString("zh-CN") }}</strong>
          </div>
        </div>

        <div v-if="apiStatus.endpoints.length" class="settings-endpoint-list" aria-label="已实现 mock endpoints">
          <code v-for="endpoint in apiStatus.endpoints" :key="endpoint">{{ endpoint }}</code>
        </div>
      </template>
    </SettingsPanel>

    <SettingsPanel
      icon="cloud-alert"
      title="最近 API 错误"
      description="页面请求失败时保留最近 8 条，便于调试。"
    >
      <template #actions>
        <AoiButton
          variant="text"
          size="sm"
          icon="trash-2"
          :disabled="telemetry.recentErrors.value.length === 0"
          @click="telemetry.clearErrors()"
        >
          清空
        </AoiButton>
      </template>

      <p v-if="telemetry.recentErrors.value.length === 0" class="settings-note">
        暂无错误记录。
      </p>

      <ul v-else class="settings-api-errors">
        <li v-for="item in telemetry.recentErrors.value" :key="`${item.requestId}-${item.occurredAt}`">
          <strong>{{ item.statusCode }} · {{ item.code }}</strong>
          <span>{{ item.endpoint }}</span>
          <small>{{ item.message }} / {{ item.requestId }}</small>
        </li>
      </ul>
    </SettingsPanel>

    <SettingsPanel
      icon="database"
      title="本地数据"
      description="这些数据只写入当前浏览器，不会发送到 mock API。"
    >
      <div class="settings-data-panels">
        <article class="settings-data-card">
          <div>
            <h3>播放器偏好</h3>
            <p>{{ playerStats.volume }}% · {{ playerStats.playbackRate }}x · {{ playerStats.theaterMode ? "剧场" : "标准" }}</p>
          </div>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="rotate-ccw"
            :disabled="!playerSettings.hydrated || !hasPlayerSettings"
            @click="askConfirm('重置播放器偏好', '将恢复音量、静音、倍速和剧场模式默认值。', () => playerSettings.resetPlayerSettings())"
          >
            重置
          </AoiButton>
        </article>

        <article class="settings-data-card">
          <div>
            <h3>本地互动</h3>
            <p>历史 {{ localStats.history }} · 收藏 {{ localStats.favorites }} · 稍后看 {{ localStats.watchLater }} · 点赞 {{ localStats.liked }}</p>
          </div>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="rotate-ccw"
            :disabled="!library.hydrated || !hasLocalData"
            @click="askConfirm('重置本地互动数据', '将清空历史、收藏、稍后看和点赞记录。', () => library.resetLibrary())"
          >
            重置
          </AoiButton>
        </article>

        <article class="settings-data-card">
          <div>
            <h3>本地评论</h3>
            <p>评论 {{ commentStats.total }} · 参与视频 {{ commentStats.videos }} · 作者 {{ commentStats.author }}</p>
          </div>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="message-circle-x"
            :disabled="!comments.hydrated || !hasCommentData"
            @click="askConfirm('重置本地评论数据', '将清空本地评论，并恢复默认评论作者。', () => comments.resetComments())"
          >
            重置
          </AoiButton>
        </article>

        <article class="settings-data-card">
          <div>
            <h3>投稿草稿</h3>
            <p>草稿 {{ uploadStats.drafts }} · 可排队 {{ uploadStats.ready }} · 已排队 {{ uploadStats.queued }}</p>
          </div>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="trash-2"
            :disabled="!uploadDrafts.hydrated || !hasUploadDrafts"
            @click="askConfirm('清空投稿草稿', '将删除当前浏览器中的投稿草稿元数据。真实文件不会被保存或删除。', () => uploadDrafts.resetDrafts())"
          >
            清空
          </AoiButton>
        </article>

        <article class="settings-data-card">
          <div>
            <h3>本地关注</h3>
            <p>创作者 {{ followingStats.creators }} · 关注更新 {{ followingStats.videos }}</p>
          </div>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="user-minus"
            :disabled="!following.hydrated || !hasFollowingData"
            @click="askConfirm('清空本地关注', '将删除当前浏览器中的关注创作者缓存。', () => following.resetFollowing())"
          >
            清空
          </AoiButton>
        </article>

        <article class="settings-data-card settings-data-card--danger">
          <div>
            <h3>应用设置</h3>
            <p>重置主题、色板、背景和偏好设置。</p>
          </div>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="rotate-ccw"
            :disabled="!settings.hydrated"
            @click="askConfirm('重置应用设置', '将恢复外观、背景、语言和偏好的默认值，但不会清除互动、评论、投稿或关注数据。', () => settings.resetAllAppSettings())"
          >
            重置
          </AoiButton>
        </article>
      </div>
    </SettingsPanel>

    <AoiDialog v-model:open="confirmOpen">
      <template #headline>{{ pendingAction?.title }}</template>
      <p class="settings-note">{{ pendingAction?.body }}</p>
      <template #actions>
        <AoiButton variant="text" @click="cancelPendingAction">取消</AoiButton>
        <AoiButton icon="check" @click="runPendingAction">确认</AoiButton>
      </template>
    </AoiDialog>
  </div>
</template>

<style scoped>
.settings-endpoint-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.settings-endpoint-list code {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-bg);
  color: var(--aoi-accent-60);
  font-size: 12px;
  padding: 5px 8px;
}

.settings-api-errors {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.settings-api-errors li,
.settings-data-card {
  display: grid;
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-card-bg);
  list-style: none;
  padding: 11px;
}

.settings-api-errors span,
.settings-api-errors small,
.settings-data-card p {
  color: var(--aoi-text-muted);
}

.settings-data-panels {
  display: grid;
  gap: 10px;
}

.settings-data-card {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.settings-data-card h3,
.settings-data-card p {
  margin: 0;
}

.settings-data-card h3 {
  font-size: 15px;
}

.settings-data-card--danger {
  border-color: color-mix(in srgb, var(--aoi-danger) 22%, var(--aoi-border));
}

@media (max-width: 639px) {
  .settings-data-card {
    grid-template-columns: 1fr;
  }
}
</style>

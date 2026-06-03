<script setup lang="ts">
const config = useRuntimeConfig()
const settings = useAppSettingsStore()
const api = useAoiApi()
const library = useLibraryStore()
const telemetry = useAoiApiTelemetry()
const uploadDrafts = useUploadDraftStore()
const following = useFollowingStore()

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

const {
  data: apiStatus,
  error: apiStatusError,
  pending: apiStatusPending,
  refresh: refreshApiStatus
} = useAsyncData("api-status", () => api.getApiStatus())

const themeOptions = [
  { label: "跟随系统", value: "system" },
  { label: "浅色", value: "light" },
  { label: "深色", value: "dark" }
]

if (import.meta.client) {
  watchEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldDark = settings.preferredTheme === "dark" || (settings.preferredTheme === "system" && prefersDark)

    document.documentElement.classList.toggle("dark", shouldDark)
  })
}

useHead({
  title: "Settings - Aoi"
})
</script>

<template>
  <div class="aoi-page">
    <PageHeader
      icon="settings"
      title="设置"
      description="管理 Aoi 前端原型的本地偏好和 API mock 状态。"
    />

    <section class="settings-grid">
      <div class="settings-panel">
        <h2>外观</h2>
        <AoiSelect
          v-model="settings.preferredTheme"
          label="主题"
          variant="outlined"
          :options="themeOptions"
        />
      </div>

      <div class="settings-panel">
        <h2>数据源</h2>
        <div class="settings-row">
          <span>Mock API</span>
          <AoiSwitch :model-value="Boolean(config.public.apiMock)" disabled />
        </div>
        <p class="settings-note">当前 API Base URL：{{ activeBaseURL }}</p>
      </div>

      <div class="settings-panel settings-panel--wide">
        <div class="settings-panel__title-row">
          <h2>API 状态</h2>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="refresh-cw"
            :loading="apiStatusPending"
            @click="refreshApiStatus()"
          >
            刷新
          </AoiButton>
        </div>

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

        <div v-else-if="apiStatus" class="api-status">
          <div>
            <span>模式</span>
            <strong>{{ apiStatus.mode }}</strong>
          </div>
          <div>
            <span>Base Path</span>
            <strong>{{ apiStatus.basePath }}</strong>
          </div>
          <div>
            <span>Endpoint</span>
            <strong>{{ apiStatus.endpoints.length }}</strong>
          </div>
          <div>
            <span>更新时间</span>
            <strong>{{ new Date(apiStatus.generatedAt).toLocaleTimeString("zh-CN") }}</strong>
          </div>
        </div>

        <div v-if="apiStatus?.endpoints.length" class="endpoint-list" aria-label="已实现 mock endpoints">
          <code v-for="endpoint in apiStatus.endpoints" :key="endpoint">{{ endpoint }}</code>
        </div>
      </div>

      <div class="settings-panel settings-panel--wide">
        <div class="settings-panel__title-row">
          <h2>最近 API 错误</h2>
          <AoiButton
            variant="text"
            size="sm"
            icon="trash-2"
            :disabled="telemetry.recentErrors.value.length === 0"
            @click="telemetry.clearErrors()"
          >
            清空
          </AoiButton>
        </div>

        <p v-if="telemetry.recentErrors.value.length === 0" class="settings-note">
          暂无错误记录。页面请求失败时会在这里保留最近 8 条，方便后续对接 Go API 时排查。
        </p>

        <ul v-else class="api-errors">
          <li v-for="item in telemetry.recentErrors.value" :key="`${item.requestId}-${item.occurredAt}`">
            <strong>{{ item.statusCode }} · {{ item.code }}</strong>
            <span>{{ item.endpoint }}</span>
            <small>{{ item.message }} / {{ item.requestId }}</small>
          </li>
        </ul>
      </div>

      <div class="settings-panel settings-panel--wide">
        <div class="settings-panel__title-row">
          <h2>本地互动数据</h2>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="rotate-ccw"
            aria-label="重置本地数据"
            :disabled="!library.hydrated || !hasLocalData"
            @click="library.resetLibrary()"
          >
            重置本地数据
          </AoiButton>
        </div>

        <AoiProgress v-if="!library.hydrated" indeterminate />

        <div v-else class="local-library-status">
          <div>
            <span>历史</span>
            <strong>{{ localStats.history }}</strong>
          </div>
          <div>
            <span>收藏</span>
            <strong>{{ localStats.favorites }}</strong>
          </div>
          <div>
            <span>稍后看</span>
            <strong>{{ localStats.watchLater }}</strong>
          </div>
          <div>
            <span>点赞</span>
            <strong>{{ localStats.liked }}</strong>
          </div>
        </div>

        <p class="settings-note">
          这些数据只写入当前浏览器的 <code>aoi.library.v1</code>，不会发送到 mock API。
        </p>
      </div>

      <div class="settings-panel settings-panel--wide">
        <div class="settings-panel__title-row">
          <h2>投稿草稿缓存</h2>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="trash-2"
            aria-label="清空投稿草稿"
            :disabled="!uploadDrafts.hydrated || !hasUploadDrafts"
            @click="uploadDrafts.resetDrafts()"
          >
            清空草稿
          </AoiButton>
        </div>

        <AoiProgress v-if="!uploadDrafts.hydrated" indeterminate />

        <div v-else class="local-upload-status">
          <div>
            <span>草稿</span>
            <strong>{{ uploadStats.drafts }}</strong>
          </div>
          <div>
            <span>可排队</span>
            <strong>{{ uploadStats.ready }}</strong>
          </div>
          <div>
            <span>已本地排队</span>
            <strong>{{ uploadStats.queued }}</strong>
          </div>
        </div>

        <p class="settings-note">
          投稿草稿只保存元信息和本地文件摘要，存储 key 为 <code>aoi.uploadDrafts.v1</code>；真实文件不会写入浏览器存储或 mock API。
        </p>
      </div>

      <div class="settings-panel settings-panel--wide">
        <div class="settings-panel__title-row">
          <h2>本地关注缓存</h2>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="user-minus"
            aria-label="清空本地关注"
            :disabled="!following.hydrated || !hasFollowingData"
            @click="following.resetFollowing()"
          >
            清空关注
          </AoiButton>
        </div>

        <AoiProgress v-if="!following.hydrated" indeterminate />

        <div v-else class="local-following-status">
          <div>
            <span>已关注创作者</span>
            <strong>{{ followingStats.creators }}</strong>
          </div>
          <div>
            <span>关注更新</span>
            <strong>{{ followingStats.videos }}</strong>
          </div>
        </div>

        <p class="settings-note">
          本地关注只写入当前浏览器的 <code>aoi.following.v1</code>，用于预演未来 Go 用户关系接口。
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.settings-panel {
  display: grid;
  gap: 14px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  box-shadow: var(--aoi-shadow-sm);
  padding: 16px;
}

.settings-panel h2 {
  margin: 0;
  font-size: 16px;
}

.settings-panel--wide {
  grid-column: 1 / -1;
}

.settings-panel__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-note {
  margin: 0;
  color: var(--aoi-text-muted);
  line-height: 1.7;
}

.api-status,
.local-library-status,
.local-upload-status,
.local-following-status {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.api-status div,
.local-library-status div,
.local-upload-status div,
.local-following-status div {
  display: grid;
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: rgba(255, 255, 255, 0.56);
  padding: 10px;
}

.api-status span,
.local-library-status span,
.local-upload-status span,
.local-following-status span,
.api-errors span,
.api-errors small {
  color: var(--aoi-text-muted);
}

.api-status strong,
.local-library-status strong,
.local-upload-status strong,
.local-following-status strong {
  overflow: hidden;
  color: var(--aoi-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.endpoint-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.endpoint-list code {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-bg);
  color: var(--aoi-accent-60);
  font-size: 12px;
  padding: 5px 8px;
}

.api-errors {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.api-errors li {
  display: grid;
  gap: 3px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-bg);
  list-style: none;
  padding: 10px;
}

@media (max-width: 760px) {
  .api-status {
    grid-template-columns: 1fr;
  }

  .local-library-status {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .local-upload-status {
    grid-template-columns: 1fr;
  }

  .local-following-status {
    grid-template-columns: 1fr;
  }

  .settings-panel__title-row {
    align-items: start;
    flex-direction: column;
  }
}
</style>

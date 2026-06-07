<script setup lang="ts">
import { useId } from "vue"
import type { CommentSortMode } from "~/types/comments"
import type { AoiDanmakuMapper, AoiDanmakuMode } from "~/types/danmaku"
import type { PlayerPlaybackRate } from "~/types/player"
import type { VideoDanmakuItem, VideoSourceKind, VideoSourceOption } from "~/types/api"
import type { AoiDanmakuRuntimeSettings } from "~/utils/aoiDanmaku"

type DanmakuComposerExpose = {
  focus: () => void
  toggleSettings: () => void
}

type PlayerHoverMenu = "rate" | "subtitle" | "settings"

type PlayerContextMenuItem = {
  value: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  checked?: boolean
  children?: PlayerContextMenuItem[]
}

type PlayerContextMenuGroup = {
  label: string
  items: PlayerContextMenuItem[]
}

type PlayerContextMenuContext = {
  controls: {
    setDanmakuEnabled: (value: boolean) => void
    setMuted: (value: boolean) => void
    setTheaterMode: (value: boolean) => void
    selectSource: (id: string) => void
    toggleFullscreen: () => Promise<void> | void
    togglePlay: () => Promise<void> | void
    toggleWebFullscreen: () => Promise<void> | void
  }
  selectedSource: VideoSourceOption | null
  sources: VideoSourceOption[]
  state: {
    currentTime: number
    danmakuEnabled: boolean
    isFullscreen: boolean
    isPlaying: boolean
    isWebFullscreen: boolean
    muted: boolean
    playbackRate: number
    theaterMode: boolean
  }
}

const route = useRoute()
const api = useAoiApi()
const settings = useAppSettingsStore()
const playerSettings = usePlayerSettingsStore()
const library = useLibraryStore()
const comments = useCommentsStore()
const danmaku = useDanmakuStore()
const { t } = useI18n()
const id = computed(() => String(route.params.id || ""))
const commentSortMode = ref<CommentSortMode>("newest")
const composerRef = ref<DanmakuComposerExpose | null>(null)
const localDanmakuEnabled = ref(true)
const panelOpen = ref(false)
const rateMenuOpen = ref(false)
const selectedSourceId = ref("")
const settingsMenuOpen = ref(false)
const subtitleMenuOpen = ref(false)
const isFineHoverPointer = ref(false)
const playerContextMenuOpen = ref(false)
const playerContextMenuX = ref(0)
const playerContextMenuY = ref(0)
const playerContextMenuContext = shallowRef<PlayerContextMenuContext | null>(null)
const rateMenuAnchor = `${useId()}-rate`
const subtitleMenuAnchor = `${useId()}-subtitle`
const settingsMenuAnchor = `${useId()}-settings`
const hoverMenuCloseTimers = new Map<PlayerHoverMenu, ReturnType<typeof setTimeout>>()
let hoverPointerQuery: MediaQueryList | null = null

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
const danmakuAvailable = computed(() => settings.danmakuEnabled)
const playerDanmakuEnabled = computed(() => danmakuAvailable.value && localDanmakuEnabled.value)
const danmakuRuntimeSettings = computed<Partial<AoiDanmakuRuntimeSettings>>(() => ({
  blocklist: settings.danmakuBlocklist,
  bottomModeEnabled: settings.danmakuBottomModeEnabled,
  enabled: playerDanmakuEnabled.value,
  fontScale: settings.danmakuFontScale,
  opacity: settings.danmakuOpacity,
  scrollModeEnabled: settings.danmakuScrollModeEnabled,
  speed: settings.danmakuSpeed,
  topModeEnabled: settings.danmakuTopModeEnabled,
  visibleArea: settings.danmakuVisibleArea
}))
const rateMenuItems = computed(() => playerSettings.playbackRates.map((rate) => ({
  icon: rate === playerSettings.playbackRate ? "check" : "gauge",
  label: `${rate}x`,
  value: String(rate)
})))
const subtitleMenuItems = computed(() => [{
  disabled: true,
  icon: "captions-off",
  label: t("player.subtitleUnavailable"),
  value: "none"
}])
const playerSettingsMenuItems = computed(() => [{
  disabled: true,
  icon: "settings",
  label: t("player.playerSettingsUnavailable"),
  value: "none"
}])
const playerContextMenuGroups = computed<PlayerContextMenuGroup[]>(() => {
  const context = playerContextMenuContext.value

  if (!context) {
    return []
  }

  return [
    {
      label: t("player.contextPlayback"),
      items: [
        {
          icon: context.state.isPlaying ? "pause" : "play",
          label: context.state.isPlaying ? t("player.pause") : t("player.play"),
          shortcut: "Space",
          value: "toggle-play"
        },
        {
          icon: context.state.muted ? "volume-2" : "volume-x",
          label: context.state.muted ? t("player.unmute") : t("player.mute"),
          shortcut: "M",
          value: "toggle-mute"
        },
        {
          icon: "copy",
          label: t("player.copyCurrentTime"),
          value: "copy-time"
        }
      ]
    },
    {
      label: t("player.contextDanmaku"),
      items: [
        {
          checked: context.state.danmakuEnabled,
          icon: "message-square-text",
          label: context.state.danmakuEnabled ? t("player.hideDanmaku") : t("player.showDanmaku"),
          shortcut: "D",
          value: "toggle-danmaku"
        },
        {
          icon: "sliders-horizontal",
          label: t("player.danmakuSettings"),
          value: "danmaku-settings"
        },
        {
          checked: panelOpen.value,
          icon: "panel-right-open",
          label: panelOpen.value ? t("player.hidePanel") : t("player.showPanel"),
          value: "toggle-panel"
        }
      ]
    },
    {
      label: t("player.contextMedia"),
      items: [
        {
          children: context.sources.length ? context.sources.map((source) => ({
            checked: context.selectedSource?.id === source.id,
            icon: sourceIcon(source.kind),
            label: sourceDisplayLabel(source),
            value: `source:${source.id}`
          })) : [{
            disabled: true,
            icon: "video-off",
            label: t("player.sourceUnavailable"),
            value: "source:none"
          }],
          icon: "sliders-horizontal",
          label: t("player.source"),
          value: "source"
        },
        {
          children: playerSettings.playbackRates.map((rate) => ({
            checked: Number(context.state.playbackRate) === rate,
            icon: "gauge",
            label: `${rate}x`,
            value: `rate:${rate}`
          })),
          icon: "gauge",
          label: t("player.rate"),
          value: "rate"
        },
        {
          children: [{
            disabled: true,
            icon: "captions-off",
            label: t("player.subtitleUnavailable"),
            value: "subtitle:none"
          }],
          icon: "captions",
          label: t("player.subtitle"),
          value: "subtitle"
        }
      ]
    },
    {
      label: t("player.contextDisplay"),
      items: [
        {
          checked: context.state.theaterMode,
          icon: "panel-top",
          label: t("player.theater"),
          shortcut: "T",
          value: "toggle-theater"
        },
        {
          checked: context.state.isWebFullscreen,
          icon: context.state.isWebFullscreen ? "minimize-2" : "monitor",
          label: context.state.isWebFullscreen ? t("player.exitWebFullscreen") : t("player.webFullscreen"),
          shortcut: "W",
          value: "toggle-web-fullscreen"
        },
        {
          checked: context.state.isFullscreen,
          icon: context.state.isFullscreen ? "minimize" : "maximize",
          label: context.state.isFullscreen ? t("player.exitFullscreen") : t("player.fullscreen"),
          shortcut: "F",
          value: "toggle-fullscreen"
        }
      ]
    },
    {
      label: t("player.contextHelp"),
      items: [
        {
          children: [
            { disabled: true, label: t("player.shortcutPlayPause"), shortcut: "Space", value: "shortcut:play" },
            { disabled: true, label: t("player.shortcutSeek"), shortcut: "←/→", value: "shortcut:seek" },
            { disabled: true, label: t("player.shortcutDanmaku"), shortcut: "D", value: "shortcut:danmaku" },
            { disabled: true, label: t("player.shortcutCompose"), shortcut: "Enter", value: "shortcut:compose" },
            { disabled: true, label: t("player.shortcutFullscreen"), shortcut: "F", value: "shortcut:fullscreen" },
            { disabled: true, label: t("player.shortcutWebFullscreen"), shortcut: "W", value: "shortcut:web-fullscreen" }
          ],
          icon: "keyboard",
          label: t("player.keyboardShortcuts"),
          value: "keyboard-shortcuts"
        }
      ]
    }
  ]
})
const danmakuMapper: AoiDanmakuMapper<VideoDanmakuItem> = (item) => ({
  id: item.id,
  body: item.body,
  timeSeconds: item.timeSeconds,
  mode: item.mode,
  color: item.color,
  authorName: item.authorName,
  createdAt: item.createdAt
})

watch([video, () => library.hydrated], ([current, hydrated]) => {
  if (import.meta.client && hydrated && current && !settings.disableWatchHistory) {
    library.recordView(current)
  }
}, { immediate: true })

watch(video, (current) => {
  selectedSourceId.value = current ? defaultSourceId(current.sources, current.sourceUrl) : ""
  localDanmakuEnabled.value = true
  panelOpen.value = false
}, { immediate: true })

function defaultSourceId(sources: VideoSourceOption[] | undefined, fallbackSrc: string) {
  const explicitSources = (sources || []).filter((source) => Boolean(source.src))

  if (explicitSources.length) {
    const defaultIndex = explicitSources.findIndex((source) => source.isDefault)
    const index = defaultIndex >= 0 ? defaultIndex : 0
    const source = explicitSources[index]

    return source?.id || `source-${index + 1}`
  }

  return fallbackSrc ? "primary" : ""
}

function sourceIcon(kind: VideoSourceKind) {
  if (kind === "hls") {
    return "radio-tower"
  }

  if (kind === "dash") {
    return "network"
  }

  return "film"
}

function sourceDisplayLabel(source: VideoSourceOption | null) {
  if (!source) {
    return t("player.sourceUnavailable")
  }

  const primary = source.qualityLabel || (source.label === "Auto" ? t("player.sourceDefault") : source.label)
  const bits = [
    primary,
    source.bitrateKbps ? `${source.bitrateKbps} kbps` : ""
  ].filter(Boolean)

  return bits.join(" / ")
}

function playerErrorText(code: string | null | undefined) {
  const map: Record<string, string> = {
    dash: "player.errors.dash",
    hls: "player.errors.hls",
    load: "player.errors.load",
    noSource: "player.errors.noSource",
    play: "player.errors.load",
    sourceInit: "player.errors.sourceInit",
    unsupportedFormat: "player.errors.unsupportedFormat",
    unsupportedHls: "player.errors.unsupportedHls"
  }

  return t(map[code || ""] || "player.errors.load")
}

function setPlayerPlaybackRate(value: number) {
  playerSettings.setPlaybackRate(value as PlayerPlaybackRate)
}

function selectPlaybackRate(value: string) {
  setPlayerPlaybackRate(Number(value))
  rateMenuOpen.value = false
}

function setPlayerHoverMenuOpen(menu: PlayerHoverMenu, value: boolean) {
  if (menu === "rate") {
    rateMenuOpen.value = value
  } else if (menu === "subtitle") {
    subtitleMenuOpen.value = value
  } else {
    settingsMenuOpen.value = value
  }
}

function isPlayerHoverMenuOpen(menu: PlayerHoverMenu) {
  if (menu === "rate") {
    return rateMenuOpen.value
  }

  if (menu === "subtitle") {
    return subtitleMenuOpen.value
  }

  return settingsMenuOpen.value
}

function clearPlayerHoverMenuTimer(menu: PlayerHoverMenu) {
  const timer = hoverMenuCloseTimers.get(menu)

  if (timer) {
    clearTimeout(timer)
    hoverMenuCloseTimers.delete(menu)
  }
}

function openPlayerHoverMenu(menu: PlayerHoverMenu) {
  clearPlayerHoverMenuTimer(menu)
  setPlayerHoverMenuOpen(menu, true)
}

function scheduleClosePlayerHoverMenu(menu: PlayerHoverMenu) {
  clearPlayerHoverMenuTimer(menu)

  if (!isFineHoverPointer.value) {
    return
  }

  hoverMenuCloseTimers.set(menu, setTimeout(() => {
    setPlayerHoverMenuOpen(menu, false)
    hoverMenuCloseTimers.delete(menu)
  }, 180))
}

function togglePlayerHoverMenu(menu: PlayerHoverMenu) {
  if (isFineHoverPointer.value) {
    openPlayerHoverMenu(menu)
    return
  }

  setPlayerHoverMenuOpen(menu, !isPlayerHoverMenuOpen(menu))
}

function closePlayerHoverMenus() {
  const menus: PlayerHoverMenu[] = ["rate", "subtitle", "settings"]

  for (const menu of menus) {
    clearPlayerHoverMenuTimer(menu)
    setPlayerHoverMenuOpen(menu, false)
  }
}

function updateFineHoverPointer() {
  isFineHoverPointer.value = Boolean(hoverPointerQuery?.matches)
}

function setVolumePercent(value: number) {
  playerSettings.setVolume(value / 100)
}

function setVolumeFromInput(event: Event) {
  const target = event.target

  if (!(target instanceof HTMLInputElement)) {
    return
  }

  const value = Number(target.value)

  if (Number.isFinite(value)) {
    setVolumePercent(value)
  }
}

function updateLocalDanmakuEnabled(value: boolean) {
  if (danmakuAvailable.value) {
    localDanmakuEnabled.value = value
  }
}

function focusDanmakuComposer() {
  composerRef.value?.focus()
}

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
  mode: AoiDanmakuMode
  timeSeconds: number
}) {
  if (video.value) {
    danmaku.submitDanmaku(video.value.id, payload, comments.authorName)
  }
}

function formatPlayerClock(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor(safeSeconds % 3600 / 60)
  const rest = safeSeconds % 60
  const padded = `${minutes}:${String(rest).padStart(2, "0")}`

  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}` : padded
}

async function writeTextToClipboard(value: string) {
  if (!import.meta.client) {
    return
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "true")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.append(textarea)
  textarea.select()
  document.execCommand("copy")
  textarea.remove()
}

async function copyCurrentPlayerTime(seconds: number) {
  await writeTextToClipboard(formatPlayerClock(seconds))
}

function openPlayerContextMenu(event: MouseEvent, context: PlayerContextMenuContext) {
  closePlayerHoverMenus()
  playerContextMenuContext.value = context
  playerContextMenuX.value = event.clientX
  playerContextMenuY.value = event.clientY
  playerContextMenuOpen.value = true
}

function selectPlayerContextMenuAction(value: string) {
  const context = playerContextMenuContext.value

  if (!context) {
    return
  }

  if (value.startsWith("source:")) {
    const sourceId = value.slice("source:".length)

    if (sourceId !== "none") {
      context.controls.selectSource(sourceId)
    }
    return
  }

  if (value.startsWith("rate:")) {
    setPlayerPlaybackRate(Number(value.slice("rate:".length)))
    return
  }

  if (value === "toggle-play") {
    void context.controls.togglePlay()
  } else if (value === "toggle-mute") {
    context.controls.setMuted(!context.state.muted)
  } else if (value === "copy-time") {
    void copyCurrentPlayerTime(context.state.currentTime)
  } else if (value === "toggle-danmaku") {
    context.controls.setDanmakuEnabled(!context.state.danmakuEnabled)
  } else if (value === "danmaku-settings") {
    composerRef.value?.toggleSettings()
  } else if (value === "toggle-panel") {
    panelOpen.value = !panelOpen.value
  } else if (value === "toggle-theater") {
    context.controls.setTheaterMode(!context.state.theaterMode)
  } else if (value === "toggle-web-fullscreen") {
    void context.controls.toggleWebFullscreen()
  } else if (value === "toggle-fullscreen") {
    void context.controls.toggleFullscreen()
  }
}

function onPlayerPageKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape") {
    return
  }

  if (playerContextMenuOpen.value) {
    playerContextMenuOpen.value = false
  }

  closePlayerHoverMenus()
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

onMounted(() => {
  hoverPointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)")
  updateFineHoverPointer()
  hoverPointerQuery.addEventListener("change", updateFineHoverPointer)
  document.addEventListener("keydown", onPlayerPageKeydown, true)
})

onBeforeUnmount(() => {
  hoverPointerQuery?.removeEventListener("change", updateFineHoverPointer)
  document.removeEventListener("keydown", onPlayerPageKeydown, true)
  closePlayerHoverMenus()
})

useHead(() => ({
  title: video.value ? `${video.value.title} - Aoi` : "Video - Aoi"
}))
</script>

<template>
  <div class="aoi-page video-watch-page">
    <PageState
      v-if="!pending && error"
      icon="video-off"
      :title="t('player.notFoundTitle')"
      :description="t('player.notFoundDescription', { id: route.params.id })"
      action-icon="home"
      :action-label="t('player.backHome')"
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
            :aria-label="isLiked ? t('player.unlike') : t('player.like')"
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
          <AoiDanmakuVideoPlayer
            :src="video.sourceUrl"
            :sources="video.sources"
            :title="video.title"
            :duration-seconds="video.durationSeconds"
            :initial-time-seconds="initialProgressSeconds"
            :selected-source-id="selectedSourceId"
            :muted="playerSettings.muted"
            :volume="playerSettings.volume"
            :playback-rate="playerSettings.playbackRate"
            :theater-mode="playerSettings.theaterMode"
            :danmaku-items="mergedDanmakuItems"
            :danmaku-mapper="danmakuMapper"
            :danmaku-enabled="playerDanmakuEnabled"
            :danmaku-settings="danmakuRuntimeSettings"
            @compose-request="focusDanmakuComposer"
            @context-menu="openPlayerContextMenu"
            @ended="onPlayerEnded"
            @progress="onPlayerProgress"
            @send-danmaku="submitDanmaku"
            @update:danmaku-enabled="updateLocalDanmakuEnabled"
            @update:muted="playerSettings.setMuted"
            @update:playback-rate="setPlayerPlaybackRate"
            @update:selected-source-id="selectedSourceId = $event"
            @update:theater-mode="playerSettings.setTheaterMode"
            @update:volume="playerSettings.setVolume"
          >
            <template #overlay="{ state, selectedSource, controls }">
              <div v-if="(state.isLoading || state.engineAttaching) && !state.hasError" class="aoi-danmaku-video-player__overlay" @click.stop>
                <AoiProgress indeterminate />
                <span>{{ t("player.loading") }}</span>
              </div>

              <div v-else-if="state.hasError || !selectedSource" class="aoi-danmaku-video-player__overlay" @click.stop>
                <AoiIcon name="video-off" :size="32" decorative />
                <span>{{ playerErrorText(state.errorCode) }}</span>
                <AoiButton variant="tonal" size="sm" icon="refresh-cw" @click="controls.reload">
                  {{ t("player.retry") }}
                </AoiButton>
              </div>

              <AoiMediaOverlayButton
                v-else-if="!state.isPlaying"
                :icon="state.isPlaying ? 'pause' : 'play'"
                :label="state.isPlaying ? t('player.pause') : t('player.play')"
                @click.stop="controls.togglePlay"
                @dblclick.stop="controls.toggleFullscreen"
              />
            </template>

            <template #controls="{ state, controls }">
              <AoiVideoTimeline
                class="aoi-danmaku-video-player__timeline"
                :current-time="state.currentTime"
                :duration="state.duration"
                :aria-label="t('player.controls')"
                @seek="controls.seekTo"
              />

              <div class="aoi-danmaku-video-player__control-bar" role="toolbar" :aria-label="t('player.controls')">
                <div class="aoi-danmaku-video-player__control-group aoi-danmaku-video-player__control-group--left">
                  <AoiIconButton
                    class="aoi-danmaku-video-player__control--play"
                    :icon="state.isPlaying ? 'pause' : 'play'"
                    :label="state.isPlaying ? t('player.pause') : t('player.play')"
                    size="sm"
                    @click="controls.togglePlay"
                  />

                  <div class="aoi-danmaku-video-player__volume-control">
                    <AoiIconButton
                      :class="[
                        'aoi-danmaku-video-player__control--mute',
                        { 'aoi-danmaku-video-player__control--state-on': state.muted }
                      ]"
                      :icon="state.muted || Math.round(state.volume * 100) === 0 ? 'volume-x' : 'volume-2'"
                      :label="state.muted ? t('player.unmute') : t('player.mute')"
                      size="sm"
                      @click="controls.setMuted(!state.muted)"
                    />

                    <div
                      class="aoi-danmaku-video-player__volume-popover"
                      :style="{ '--aoi-player-volume-percent': `${Math.round(state.volume * 100)}%` }"
                    >
                      <div class="aoi-danmaku-video-player__volume-track" aria-hidden="true">
                        <span class="aoi-danmaku-video-player__volume-fill">
                          <span class="aoi-danmaku-video-player__volume-value">
                            {{ Math.round(state.volume * 100) }}%
                          </span>
                        </span>
                      </div>
                      <input
                        class="aoi-danmaku-video-player__volume-range"
                        type="range"
                        :aria-label="t('player.volume')"
                        :value="Math.round(state.volume * 100)"
                        min="0"
                        max="100"
                        step="1"
                        @input="setVolumeFromInput"
                      >
                    </div>
                  </div>
                </div>

                <AoiDanmakuComposer
                  ref="composerRef"
                  class="aoi-danmaku-video-player__composer"
                  :count="mergedDanmakuItems.length"
                  :disabled="!danmakuAvailable"
                  :enabled="state.danmakuEnabled"
                  overlay
                  :playing="state.isPlaying"
                  @submit="controls.sendDanmaku"
                  @toggle-enabled="controls.setDanmakuEnabled(!state.danmakuEnabled)"
                />

                <div class="aoi-danmaku-video-player__control-group aoi-danmaku-video-player__control-group--right">
                  <span
                    :id="rateMenuAnchor"
                    class="aoi-danmaku-video-player__anchor aoi-danmaku-video-player__anchor--rate"
                    @focusin="openPlayerHoverMenu('rate')"
                    @focusout="scheduleClosePlayerHoverMenu('rate')"
                    @mouseenter="openPlayerHoverMenu('rate')"
                    @mouseleave="scheduleClosePlayerHoverMenu('rate')"
                    @click.stop="togglePlayerHoverMenu('rate')"
                  >
                    <AoiButton
                      class="aoi-danmaku-video-player__menu-button aoi-danmaku-video-player__rate-button"
                      variant="tonal"
                      size="sm"
                      icon="gauge"
                      :aria-label="t('player.rate')"
                    >
                      {{ state.playbackRate }}x
                    </AoiButton>
                  </span>

                  <span
                    :id="subtitleMenuAnchor"
                    class="aoi-danmaku-video-player__anchor aoi-danmaku-video-player__control--subtitle"
                    @focusin="openPlayerHoverMenu('subtitle')"
                    @focusout="scheduleClosePlayerHoverMenu('subtitle')"
                    @mouseenter="openPlayerHoverMenu('subtitle')"
                    @mouseleave="scheduleClosePlayerHoverMenu('subtitle')"
                    @click.stop="togglePlayerHoverMenu('subtitle')"
                  >
                    <AoiButton
                      class="aoi-danmaku-video-player__menu-button aoi-danmaku-video-player__subtitle-button"
                      variant="tonal"
                      size="sm"
                      icon="captions"
                      :aria-label="t('player.subtitle')"
                    >
                      {{ t("player.subtitle") }}
                    </AoiButton>
                  </span>

                  <span
                    :id="settingsMenuAnchor"
                    class="aoi-danmaku-video-player__anchor aoi-danmaku-video-player__control--settings"
                    @focusin="openPlayerHoverMenu('settings')"
                    @focusout="scheduleClosePlayerHoverMenu('settings')"
                    @mouseenter="openPlayerHoverMenu('settings')"
                    @mouseleave="scheduleClosePlayerHoverMenu('settings')"
                    @click.stop="togglePlayerHoverMenu('settings')"
                  >
                    <AoiIconButton
                      icon="settings"
                      :label="t('player.playerSettings')"
                      size="sm"
                    />
                  </span>

                  <AoiIconButton
                    :class="[
                      'aoi-danmaku-video-player__control--panel',
                      { 'aoi-danmaku-video-player__control--state-on': panelOpen }
                    ]"
                    :icon="panelOpen ? 'panel-right-close' : 'panel-right-open'"
                    :label="panelOpen ? t('player.hidePanel') : t('player.showPanel')"
                    size="sm"
                    @click="panelOpen = !panelOpen"
                  />

                  <AoiIconButton
                    :class="[
                      'aoi-danmaku-video-player__control--theater',
                      { 'aoi-danmaku-video-player__control--state-on': state.theaterMode }
                    ]"
                    icon="panel-top"
                    :label="t('player.theater')"
                    size="sm"
                    @click="controls.setTheaterMode(!state.theaterMode)"
                  />

                  <AoiIconButton
                    :class="{ 'aoi-danmaku-video-player__control--state-on': state.isWebFullscreen }"
                    :icon="state.isWebFullscreen ? 'minimize-2' : 'monitor'"
                    :label="state.isWebFullscreen ? t('player.exitWebFullscreen') : t('player.webFullscreen')"
                    size="sm"
                    @click="controls.toggleWebFullscreen"
                  />

                  <AoiIconButton
                    :icon="state.isFullscreen ? 'minimize' : 'maximize'"
                    :label="state.isFullscreen ? t('player.exitFullscreen') : t('player.fullscreen')"
                    size="sm"
                    @click="controls.toggleFullscreen"
                  />
                </div>
              </div>

              <AoiMenu
                v-model:open="rateMenuOpen"
                class="aoi-danmaku-video-player__floating-menu"
                :anchor="rateMenuAnchor"
                :items="rateMenuItems"
                positioning="popover"
                @focusin="openPlayerHoverMenu('rate')"
                @focusout="scheduleClosePlayerHoverMenu('rate')"
                @mouseenter="openPlayerHoverMenu('rate')"
                @mouseleave="scheduleClosePlayerHoverMenu('rate')"
                @select="selectPlaybackRate"
              />

              <AoiMenu
                v-model:open="subtitleMenuOpen"
                class="aoi-danmaku-video-player__floating-menu"
                :anchor="subtitleMenuAnchor"
                :items="subtitleMenuItems"
                positioning="popover"
                @focusin="openPlayerHoverMenu('subtitle')"
                @focusout="scheduleClosePlayerHoverMenu('subtitle')"
                @mouseenter="openPlayerHoverMenu('subtitle')"
                @mouseleave="scheduleClosePlayerHoverMenu('subtitle')"
              />

              <AoiMenu
                v-model:open="settingsMenuOpen"
                class="aoi-danmaku-video-player__floating-menu"
                :anchor="settingsMenuAnchor"
                :items="playerSettingsMenuItems"
                positioning="popover"
                @focusin="openPlayerHoverMenu('settings')"
                @focusout="scheduleClosePlayerHoverMenu('settings')"
                @mouseenter="openPlayerHoverMenu('settings')"
                @mouseleave="scheduleClosePlayerHoverMenu('settings')"
              />
            </template>

            <template #panel="{ state, controls, danmakuItems }">
              <AoiDanmakuPanel
                v-if="panelOpen"
                class="aoi-danmaku-video-player__panel"
                :current-time="state.currentTime"
                :items="danmakuItems"
                :settings="danmakuRuntimeSettings"
                @seek="controls.seekTo"
              />
            </template>
          </AoiDanmakuVideoPlayer>

          <AoiPlayerContextMenu
            v-model:open="playerContextMenuOpen"
            :x="playerContextMenuX"
            :y="playerContextMenuY"
            :groups="playerContextMenuGroups"
            @select="selectPlayerContextMenuAction"
          />
        </template>

        <template #side>
          <CreatorCard
            v-if="creator"
            :creator="creator"
          />
          <AoiVideoQueueList
            v-if="primaryQueue.length && !settings.noRelatedVideos"
            :title="t('player.upNext')"
            :current-video-id="video.id"
            :videos="primaryQueue"
            compact
          />
          <AoiVideoQueueList
            v-if="relatedQueue.length && !settings.noRelatedVideos"
            :title="t('player.relatedVideos')"
            :current-video-id="video.id"
            :videos="relatedQueue"
            compact
          />
        </template>

        <template #below>
          <section class="video-watch__below">
            <div class="video-watch__meta">
              <VideoMeta :video="video" link-uploader />
            </div>

            <div v-aoi-reveal="'rise'" class="video-watch__actions" :aria-label="t('player.localActions')">
              <AoiButton
                :variant="isFavorite ? 'tonal' : 'outlined'"
                icon="star"
                :aria-label="isFavorite ? t('player.unfavorite') : t('player.favorite')"
                :disabled="!library.hydrated"
                @click="library.toggleFavorite(video)"
              >
                {{ isFavorite ? t("player.favorited") : t("player.favorite") }}
              </AoiButton>
              <AoiButton
                :variant="isWatchLater ? 'tonal' : 'outlined'"
                icon="clock-3"
                :aria-label="isWatchLater ? t('player.removeWatchLater') : t('player.watchLater')"
                :disabled="!library.hydrated"
                @click="library.toggleWatchLater(video)"
              >
                {{ isWatchLater ? t("player.watchLaterAdded") : t("player.watchLater") }}
              </AoiButton>
              <AoiButton variant="outlined" icon="flag">
                {{ t("player.report") }}
              </AoiButton>
            </div>

            <section v-if="video.description" v-aoi-reveal="'fade'" class="video-watch__description">
              <h2>{{ t("player.descriptionTitle") }}</h2>
              <p>{{ video.description }}</p>
            </section>

            <div v-aoi-reveal="'fade'" class="video-watch__tags" :aria-label="t('player.tags')">
              <AoiLink
                v-for="tag in video.tags"
                :key="tag"
                class="video-watch__tag"
                :to="`/search?q=${encodeURIComponent(tag)}`"
              >
                # {{ tag }}
              </AoiLink>
            </div>

            <section v-aoi-reveal="'rise'" class="video-watch__comments" :aria-label="t('player.localComments')">
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
      :title="t('player.loadInterruptedTitle')"
      :description="t('player.loadInterruptedDescription')"
      action-icon="refresh-cw"
      :action-label="t('player.retry')"
      @action="refresh()"
    />
  </div>
</template>

<style scoped>
.video-watch-page {
  position: relative;
  background: var(--aoi-player-page-bg);
  isolation: isolate;
}

.video-watch-page::before {
  position: fixed;
  inset: 0;
  z-index: -1;
  content: "";
  background: var(--aoi-player-page-bg);
  pointer-events: none;
}

.video-watch {
  display: grid;
  gap: 12px;
}

.video-watch :deep(.video-watch__header) {
  align-items: center;
  margin-bottom: 2px;
}

.video-watch :deep(.page-header__eyebrow) {
  margin-bottom: 2px;
  color: var(--aoi-player-accent);
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.video-watch :deep(.page-header__title) {
  color: var(--aoi-player-text);
  font-size: clamp(20px, 1.7vw, 26px);
  line-height: 1.24;
}

.video-watch :deep(.page-header__description) {
  max-width: 860px;
  margin-top: 4px;
  color: var(--aoi-player-text-muted);
  font-size: 13px;
  line-height: 1.55;
}

.video-watch :deep(.page-header__actions) {
  gap: 6px;
}

.video-watch :deep(.page-header__actions .aoi-button) {
  --md-outlined-button-outline-color: var(--aoi-player-border);
  --md-outlined-button-label-text-color: var(--aoi-player-text-muted);
  --md-outlined-button-icon-color: var(--aoi-player-text-muted);
  --md-outlined-button-hover-label-text-color: var(--aoi-player-accent);
  --md-outlined-button-hover-icon-color: var(--aoi-player-accent);
  --md-filled-tonal-button-container-color: var(--aoi-player-accent-soft);
  --md-filled-tonal-button-label-text-color: var(--aoi-player-accent);
  --md-filled-tonal-button-icon-color: var(--aoi-player-accent);
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
  border-color: var(--aoi-player-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-player-surface);
  box-shadow: none;
  padding: 9px;
}

.video-watch :deep(.creator-card:hover) {
  box-shadow: none;
  transform: none;
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
  --md-outlined-button-outline-color: var(--aoi-player-accent);
  --md-outlined-button-label-text-color: var(--aoi-player-accent);
  --md-outlined-button-icon-color: var(--aoi-player-accent);
}

.video-watch__below {
  display: grid;
  gap: 14px;
  max-width: min(920px, 100%);
  padding-top: 2px;
}

.video-watch__meta {
  border: 1px solid var(--aoi-player-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-player-surface);
  padding: 10px 12px;
}

.video-watch__actions,
.video-watch__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.video-watch__actions :deep(.aoi-button) {
  --md-outlined-button-outline-color: var(--aoi-player-border);
  --md-outlined-button-label-text-color: var(--aoi-player-text-muted);
  --md-outlined-button-icon-color: var(--aoi-player-text-muted);
  --md-outlined-button-hover-label-text-color: var(--aoi-player-accent);
  --md-outlined-button-hover-icon-color: var(--aoi-player-accent);
  --md-filled-tonal-button-container-color: var(--aoi-player-accent-soft);
  --md-filled-tonal-button-label-text-color: var(--aoi-player-accent);
  --md-filled-tonal-button-icon-color: var(--aoi-player-accent);
}

.video-watch__description {
  display: grid;
  gap: 8px;
  border: 1px solid var(--aoi-player-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-player-surface);
  padding: 14px;
}

.video-watch__description h2,
.video-watch__description p {
  margin: 0;
}

.video-watch__description h2 {
  color: var(--aoi-player-text);
  font-size: 15px;
}

.video-watch__description p {
  color: var(--aoi-player-text-muted);
  line-height: 1.75;
}

.video-watch__tag {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  border: 1px solid var(--aoi-player-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-player-surface);
  color: var(--aoi-player-accent);
  font-size: 12px;
  font-weight: 800;
  padding: 5px 9px;
}

.video-watch__tag:hover {
  background: var(--aoi-player-accent-soft);
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

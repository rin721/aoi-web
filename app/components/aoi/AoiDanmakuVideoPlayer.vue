<script setup lang="ts">
import { useId } from "vue"
import type { VideoDanmakuItem, VideoDanmakuMode, VideoSourceKind, VideoSourceOption } from "~/types/api"
import type { PlayerPlaybackRate } from "~/types/player"
import type { AoiVideoSourceEngineError } from "~/composables/useAoiVideoSourceEngine"
import { inferAoiVideoSourceKind } from "~/composables/useAoiVideoSourceEngine"

interface AoiDanmakuVideoPlayerError extends Omit<AoiVideoSourceEngineError, "source"> {
  source?: VideoSourceOption
}

const props = withDefaults(defineProps<{
  danmakuEnabled?: boolean
  danmakuItems?: VideoDanmakuItem[]
  durationSeconds: number
  initialProgressSeconds?: number
  panelDefaultOpen?: boolean
  poster?: string
  showDanmakuPanel?: boolean
  sources?: VideoSourceOption[]
  src?: string
  title: string
}>(), {
  danmakuEnabled: true,
  danmakuItems: () => [],
  initialProgressSeconds: 0,
  panelDefaultOpen: true,
  poster: undefined,
  showDanmakuPanel: true,
  sources: () => [],
  src: undefined
})

const emit = defineEmits<{
  ended: []
  error: [error: AoiDanmakuVideoPlayerError]
  progress: [seconds: number]
  "play-state-change": [playing: boolean]
  "send-danmaku": [payload: { body: string, color: string, mode: VideoDanmakuMode, timeSeconds: number }]
  "source-change": [source: VideoSourceOption]
  "time-change": [seconds: number]
}>()

const { t } = useI18n()
const appSettings = useAppSettingsStore()
const playerSettings = usePlayerSettingsStore()
const rootRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)
const duration = ref(props.durationSeconds)
const errorKey = ref("")
const hasError = ref(false)
const hasLoadedMetadata = ref(false)
const hasViewportFallback = ref(false)
const isFullscreen = ref(false)
const isLoading = ref(false)
const isPlaying = ref(false)
const localDanmakuEnabled = ref(true)
const panelOpen = ref(props.panelDefaultOpen)
const pendingResumeTime = ref(0)
const rateMenuOpen = ref(false)
const selectedSourceId = ref("")
const sourceMenuOpen = ref(false)
const attachedSourceId = ref("")
let lastProgressEmit = -1

const sourceMenuAnchor = `${useId()}-source`
const rateMenuAnchor = `${useId()}-rate`
const viewport = useAoiInViewport(rootRef, {
  once: true,
  rootMargin: "200px 0px",
  threshold: 0
})
const sourceEngine = useAoiVideoSourceEngine(videoRef)
const engineAttaching = sourceEngine.attaching

const normalizedSources = computed(() => {
  const explicitSources = props.sources
    .filter((source) => Boolean(source.src))
    .map((source, index) => normalizeSource(source, index))

  if (explicitSources.length) {
    return explicitSources
  }

  if (!props.src) {
    return []
  }

  return [normalizeSource({
    id: "primary",
    kind: inferAoiVideoSourceKind(props.src),
    label: t("player.sourceDefault"),
    src: props.src,
    isDefault: true
  }, 0)]
})
const sourceSignature = computed(() => normalizedSources.value
  .map((source) => `${source.id}:${source.kind}:${source.src}`)
  .join("|"))
const selectedSource = computed(() => {
  return normalizedSources.value.find((source) => source.id === selectedSourceId.value)
    || normalizedSources.value.find((source) => source.isDefault)
    || normalizedSources.value[0]
    || null
})
const shouldLoadMedia = computed(() => (viewport.hasIntersected.value || hasViewportFallback.value) && Boolean(selectedSource.value))
const canPlay = computed(() => Boolean(shouldLoadMedia.value && selectedSource.value && !hasError.value))
const volumePercent = computed(() => Math.round(playerSettings.volume * 100))
const effectiveDanmakuEnabled = computed(() => {
  return props.danmakuEnabled && localDanmakuEnabled.value && appSettings.danmakuEnabled
})
const sourceMenuItems = computed(() => normalizedSources.value.map((source) => ({
  icon: selectedSource.value?.id === source.id ? "check" : sourceIcon(source.kind),
  label: sourceLabel(source),
  value: source.id
})))
const rateMenuItems = computed(() => playerSettings.playbackRates.map((rate) => ({
  icon: rate === playerSettings.playbackRate ? "check" : "gauge",
  label: `${rate}x`,
  value: String(rate)
})))
const selectedSourceLabel = computed(() => selectedSource.value ? sourceLabel(selectedSource.value) : t("player.sourceUnavailable"))
const visibleErrorText = computed(() => errorKey.value ? t(errorKey.value) : t("player.errors.load"))

function normalizeSource(source: VideoSourceOption, index: number): VideoSourceOption {
  const kind = (source.kind || inferAoiVideoSourceKind(source.src, source.mimeType)) as VideoSourceKind

  return {
    ...source,
    id: source.id || `source-${index + 1}`,
    kind,
    label: source.label || source.qualityLabel || t("player.sourceDefault")
  }
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

function sourceLabel(source: VideoSourceOption) {
  const bits = [
    source.qualityLabel || source.label,
    source.bitrateKbps ? `${source.bitrateKbps} kbps` : ""
  ].filter(Boolean)

  return bits.join(" · ")
}

function engineErrorKey(error: AoiVideoSourceEngineError) {
  const map: Record<string, string> = {
    AOI_VIDEO_DASH_ERROR: "player.errors.dash",
    AOI_VIDEO_HLS_ERROR: "player.errors.hls",
    AOI_VIDEO_SOURCE_INIT_ERROR: "player.errors.sourceInit",
    AOI_VIDEO_UNSUPPORTED_FORMAT: "player.errors.unsupportedFormat",
    AOI_VIDEO_UNSUPPORTED_HLS: "player.errors.unsupportedHls"
  }

  return map[error.message] || "player.errors.load"
}

function emitProgress(force = false) {
  const seconds = Math.floor(currentTime.value)

  if (force || Math.abs(seconds - lastProgressEmit) >= 3) {
    lastProgressEmit = seconds
    emit("progress", seconds)
  }
}

function applyMediaSettings() {
  const video = videoRef.value

  if (!video) {
    return
  }

  video.muted = playerSettings.muted
  video.playbackRate = playerSettings.playbackRate
  video.volume = playerSettings.volume
}

function resetPlaybackState() {
  currentTime.value = 0
  duration.value = props.durationSeconds
  hasLoadedMetadata.value = false
  lastProgressEmit = -1
  pendingResumeTime.value = Math.max(0, props.initialProgressSeconds)
}

function refreshViewportFallback() {
  if (!import.meta.client || viewport.hasIntersected.value) {
    return
  }

  const root = rootRef.value

  if (!root) {
    return
  }

  const preloadMargin = 200
  const rect = root.getBoundingClientRect()

  if (rect.bottom >= -preloadMargin && rect.top <= window.innerHeight + preloadMargin) {
    hasViewportFallback.value = true
  }
}

function onEngineError(error: AoiVideoSourceEngineError) {
  hasError.value = true
  isLoading.value = false
  errorKey.value = engineErrorKey(error)
  emit("error", error)
}

async function attachSelectedSource(options: { autoplay?: boolean, keepTime?: boolean } = {}) {
  const source = selectedSource.value

  if (!source || !shouldLoadMedia.value) {
    hasError.value = !source
    errorKey.value = source ? "" : "player.errors.noSource"
    return false
  }

  const resumeAt = options.keepTime ? currentTime.value : props.initialProgressSeconds

  hasError.value = false
  hasLoadedMetadata.value = false
  isLoading.value = true
  errorKey.value = ""
  pendingResumeTime.value = Math.max(0, resumeAt)

  const attached = await sourceEngine.attachSource(source, {
    autoplay: options.autoplay,
    currentTime: pendingResumeTime.value,
    onError: onEngineError
  })

  if (!attached) {
    hasError.value = true
    isLoading.value = false
    return false
  }

  attachedSourceId.value = source.id
  applyMediaSettings()
  emit("source-change", source)

  return true
}

async function play() {
  const video = videoRef.value

  if (!video || !selectedSource.value) {
    return
  }

  if (attachedSourceId.value !== selectedSource.value.id) {
    await attachSelectedSource({ autoplay: true, keepTime: true })
    return
  }

  if (!canPlay.value) {
    return
  }

  try {
    await video.play()
  } catch (cause) {
    if (video.error) {
      hasError.value = true
      errorKey.value = "player.errors.load"
      emit("error", {
        cause,
        fatal: true,
        message: "AOI_VIDEO_PLAY_ERROR",
        source: selectedSource.value
      })
    }
  }
}

function pause() {
  videoRef.value?.pause()
}

async function togglePlay() {
  const video = videoRef.value

  if (!video || video.paused) {
    await play()
    return
  }

  pause()
}

function onLoadedMetadata() {
  const video = videoRef.value

  if (!video) {
    return
  }

  duration.value = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : props.durationSeconds
  applyMediaSettings()

  const resumeAt = Math.min(pendingResumeTime.value, Math.max(0, duration.value - 0.5))

  if (resumeAt > 0) {
    video.currentTime = resumeAt
    currentTime.value = resumeAt
    emit("time-change", resumeAt)
  }

  pendingResumeTime.value = 0
  hasLoadedMetadata.value = true
  isLoading.value = false
}

function onTimeUpdate() {
  const video = videoRef.value

  if (!video) {
    return
  }

  currentTime.value = video.currentTime
  emit("time-change", video.currentTime)
  emitProgress()
}

function onPlay() {
  isPlaying.value = true
  isLoading.value = false
  emit("play-state-change", true)
}

function onPause() {
  isPlaying.value = false
  emitProgress(true)
  emit("play-state-change", false)
}

function onEnded() {
  isPlaying.value = false
  currentTime.value = duration.value
  emit("time-change", duration.value)
  emit("progress", props.durationSeconds)
  emit("ended")
  emit("play-state-change", false)
}

function onError() {
  hasError.value = true
  isLoading.value = false
  errorKey.value = "player.errors.load"
  emit("error", {
    cause: videoRef.value?.error,
    fatal: true,
    message: "AOI_VIDEO_LOAD_ERROR",
    source: selectedSource.value || undefined
  })
}

function onWaiting() {
  if (!hasLoadedMetadata.value) {
    isLoading.value = true
  }
}

function onCanPlay() {
  isLoading.value = false
  applyMediaSettings()
}

function retryLoad() {
  void attachSelectedSource({ keepTime: true })
}

function seekTo(value: number) {
  const video = videoRef.value

  if (!video || duration.value <= 0) {
    return
  }

  const nextTime = Math.min(duration.value, Math.max(0, value))
  video.currentTime = nextTime
  currentTime.value = nextTime
  emit("time-change", nextTime)
  emitProgress(true)
}

function seekBy(delta: number) {
  seekTo(currentTime.value + delta)
}

function setVolumePercent(value: number) {
  playerSettings.setVolume(value / 100)
}

function selectPlaybackRate(value: string) {
  playerSettings.setPlaybackRate(Number(value) as PlayerPlaybackRate)
  rateMenuOpen.value = false
}

function toggleMuted() {
  playerSettings.setMuted(!playerSettings.muted)
}

function toggleTheaterMode() {
  playerSettings.setTheaterMode(!playerSettings.theaterMode)
}

function toggleDanmaku() {
  localDanmakuEnabled.value = !localDanmakuEnabled.value
}

function togglePanel() {
  panelOpen.value = !panelOpen.value
}

async function requestFullscreen() {
  const root = rootRef.value

  if (!root || !import.meta.client) {
    return
  }

  await root.requestFullscreen?.()
}

async function toggleFullscreen() {
  if (!import.meta.client) {
    return
  }

  if (document.fullscreenElement) {
    await document.exitFullscreen()
    return
  }

  await requestFullscreen()
}

function selectSource(id: string) {
  if (selectedSourceId.value === id) {
    sourceMenuOpen.value = false
    return
  }

  const wasPlaying = isPlaying.value
  selectedSourceId.value = id
  sourceMenuOpen.value = false
  void nextTick(() => attachSelectedSource({ autoplay: wasPlaying, keepTime: true }))
}

function sendDanmaku(payload: { body: string, color: string, mode: VideoDanmakuMode }) {
  emit("send-danmaku", {
    ...payload,
    timeSeconds: currentTime.value
  })
}

function onFullscreenChange() {
  isFullscreen.value = Boolean(document.fullscreenElement && rootRef.value?.contains(document.fullscreenElement))
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target

  if (target instanceof HTMLElement && target.closest(".aoi-danmaku-composer")) {
    return
  }

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return
  }

  const key = event.key.toLowerCase()

  if (key === " ") {
    event.preventDefault()
    void togglePlay()
  } else if (key === "arrowright") {
    event.preventDefault()
    seekBy(5)
  } else if (key === "arrowleft") {
    event.preventDefault()
    seekBy(-5)
  } else if (key === "arrowup") {
    event.preventDefault()
    playerSettings.setVolume(playerSettings.volume + 0.05)
  } else if (key === "arrowdown") {
    event.preventDefault()
    playerSettings.setVolume(playerSettings.volume - 0.05)
  } else if (key === "m") {
    event.preventDefault()
    toggleMuted()
  } else if (key === "f") {
    event.preventDefault()
    void toggleFullscreen()
  } else if (key === "d") {
    event.preventDefault()
    toggleDanmaku()
  } else if (key === "t") {
    event.preventDefault()
    toggleTheaterMode()
  }
}

watch([
  () => playerSettings.muted,
  () => playerSettings.playbackRate,
  () => playerSettings.volume
], applyMediaSettings)

watch(sourceSignature, () => {
  const nextSource = normalizedSources.value.find((source) => source.isDefault) || normalizedSources.value[0]

  selectedSourceId.value = nextSource?.id || ""
  attachedSourceId.value = ""
  sourceEngine.destroy()
  resetPlaybackState()

  if (shouldLoadMedia.value) {
    void nextTick(() => attachSelectedSource())
  }
}, {
  immediate: true
})

watch(shouldLoadMedia, (ready) => {
  if (ready && selectedSource.value && attachedSourceId.value !== selectedSource.value.id) {
    void nextTick(() => attachSelectedSource())
  }
}, {
  immediate: true
})

watch(() => props.durationSeconds, (value) => {
  duration.value = value
})

onMounted(() => {
  document.addEventListener("fullscreenchange", onFullscreenChange)
  void nextTick(() => {
    refreshViewportFallback()
    requestAnimationFrame(refreshViewportFallback)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener("fullscreenchange", onFullscreenChange)
})

defineExpose({
  pause,
  play,
  requestFullscreen,
  seekBy,
  seekTo,
  selectSource,
  togglePlay
})
</script>

<template>
  <section
    ref="rootRef"
    class="aoi-danmaku-video-player"
    :class="{ 'aoi-danmaku-video-player--theater': playerSettings.theaterMode }"
    :aria-label="t('player.ariaLabel', { title })"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div class="aoi-danmaku-video-player__screen" @click="togglePlay">
      <video
        ref="videoRef"
        class="aoi-danmaku-video-player__video"
        :poster="poster"
        preload="metadata"
        playsinline
        @canplay="onCanPlay"
        @ended="onEnded"
        @error="onError"
        @loadedmetadata="onLoadedMetadata"
        @pause="onPause"
        @play="onPlay"
        @playing="onCanPlay"
        @timeupdate="onTimeUpdate"
        @waiting="onWaiting"
      />

      <AoiDanmakuLayer
        v-if="effectiveDanmakuEnabled"
        :current-time="currentTime"
        :duration-seconds="duration"
        :items="danmakuItems"
        :playing="isPlaying"
      />

      <div v-if="(isLoading || engineAttaching) && !hasError" class="aoi-danmaku-video-player__overlay" @click.stop>
        <AoiProgress indeterminate />
        <span>{{ t("player.loading") }}</span>
      </div>

      <div v-else-if="hasError || !selectedSource" class="aoi-danmaku-video-player__overlay" @click.stop>
        <AoiIcon name="video-off" :size="32" decorative />
        <span>{{ visibleErrorText }}</span>
        <AoiButton variant="tonal" size="sm" icon="refresh-cw" @click="retryLoad">
          {{ t("player.retry") }}
        </AoiButton>
      </div>

      <AoiMediaOverlayButton
        v-else
        :icon="isPlaying ? 'pause' : 'play'"
        :label="isPlaying ? t('player.pause') : t('player.play')"
      />

      <div class="aoi-danmaku-video-player__controls" :class="{ 'aoi-danmaku-video-player__controls--visible': !isPlaying }" @click.stop>
        <AoiVideoTimeline
          :current-time="currentTime"
          :duration="duration"
          @seek="seekTo"
        />

        <div class="aoi-danmaku-video-player__toolbar" :aria-label="t('player.controls')">
          <AoiIconButton
            :icon="isPlaying ? 'pause' : 'play'"
            :label="isPlaying ? t('player.pause') : t('player.play')"
            size="sm"
            variant="tonal"
            @click="togglePlay"
          />

          <AoiIconButton
            :active="playerSettings.muted"
            :icon="playerSettings.muted || volumePercent === 0 ? 'volume-x' : 'volume-2'"
            :label="playerSettings.muted ? t('player.unmute') : t('player.mute')"
            size="sm"
            @click="toggleMuted"
          />

          <div class="aoi-danmaku-video-player__volume">
            <AoiSlider
              :model-value="volumePercent"
              :aria-label="t('player.volume')"
              tone="inverse"
              compact
              :min="0"
              :max="100"
              :step="1"
              @update:model-value="setVolumePercent"
            />
          </div>

          <span class="aoi-danmaku-video-player__spacer" aria-hidden="true" />

          <span :id="sourceMenuAnchor" class="aoi-danmaku-video-player__anchor">
            <AoiButton
              class="aoi-danmaku-video-player__menu-button"
              variant="tonal"
              size="sm"
              icon="sliders-horizontal"
              :aria-label="t('player.source')"
              :disabled="normalizedSources.length <= 1"
              @click="sourceMenuOpen = true"
            >
              {{ selectedSourceLabel }}
            </AoiButton>
          </span>

          <span :id="rateMenuAnchor" class="aoi-danmaku-video-player__anchor">
            <AoiButton
              class="aoi-danmaku-video-player__menu-button aoi-danmaku-video-player__rate-button"
              variant="tonal"
              size="sm"
              icon="gauge"
              :aria-label="t('player.rate')"
              @click="rateMenuOpen = true"
            >
              {{ playerSettings.playbackRate }}x
            </AoiButton>
          </span>

          <AoiIconButton
            icon="message-square-text"
            :label="effectiveDanmakuEnabled ? t('player.hideDanmaku') : t('player.showDanmaku')"
            :active="effectiveDanmakuEnabled"
            :variant="effectiveDanmakuEnabled ? 'tonal' : 'standard'"
            size="sm"
            @click="toggleDanmaku"
          />

          <AoiIconButton
            v-if="showDanmakuPanel"
            :icon="panelOpen ? 'panel-right-close' : 'panel-right-open'"
            :label="panelOpen ? t('player.hidePanel') : t('player.showPanel')"
            :active="panelOpen"
            :variant="panelOpen ? 'tonal' : 'standard'"
            size="sm"
            @click="togglePanel"
          />

          <AoiIconButton
            icon="panel-top"
            :label="t('player.theater')"
            :active="playerSettings.theaterMode"
            :variant="playerSettings.theaterMode ? 'tonal' : 'standard'"
            size="sm"
            @click="toggleTheaterMode"
          />

          <AoiIconButton
            :icon="isFullscreen ? 'minimize' : 'maximize'"
            :label="isFullscreen ? t('player.exitFullscreen') : t('player.fullscreen')"
            size="sm"
            @click="toggleFullscreen"
          />
        </div>
      </div>
    </div>

    <AoiDanmakuComposer
      class="aoi-danmaku-video-player__composer"
      :disabled="!effectiveDanmakuEnabled"
      @submit="sendDanmaku"
    />

    <AoiDanmakuPanel
      v-if="showDanmakuPanel && panelOpen"
      class="aoi-danmaku-video-player__panel"
      :current-time="currentTime"
      :items="danmakuItems"
      @seek="seekTo"
    />

    <AoiMenu
      v-model:open="sourceMenuOpen"
      :anchor="sourceMenuAnchor"
      :items="sourceMenuItems"
      positioning="popover"
      @select="selectSource"
    />

    <AoiMenu
      v-model:open="rateMenuOpen"
      :anchor="rateMenuAnchor"
      :items="rateMenuItems"
      positioning="popover"
      @select="selectPlaybackRate"
    />
  </section>
</template>

<style scoped>
.aoi-danmaku-video-player {
  container-type: inline-size;
  display: grid;
  overflow: clip;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .08), transparent 18%),
    #07090c;
  box-shadow:
    0 22px 70px rgba(11, 20, 24, .28),
    0 2px 0 rgba(255, 255, 255, .08) inset;
  color: #fff;
  isolation: isolate;
}

.aoi-danmaku-video-player:focus-visible {
  outline: var(--aoi-focus-ring-width) solid var(--aoi-focus);
  outline-offset: var(--aoi-focus-ring-offset);
}

.aoi-danmaku-video-player--theater {
  box-shadow:
    0 30px 90px rgba(11, 20, 24, .36),
    0 2px 0 rgba(255, 255, 255, .08) inset;
}

.aoi-danmaku-video-player__screen {
  position: relative;
  display: grid;
  aspect-ratio: 16 / 9;
  min-height: 304px;
  place-items: center;
  background:
    linear-gradient(180deg, rgba(255, 180, 155, .12), transparent 26%),
    linear-gradient(135deg, #080b10, #11171c 52%, #07191e);
  overflow: hidden;
}

.aoi-danmaku-video-player--theater .aoi-danmaku-video-player__screen {
  min-height: min(70vh, 760px);
}

.aoi-danmaku-video-player__video {
  width: 100%;
  height: 100%;
  background: #050608;
  object-fit: contain;
}

.aoi-danmaku-video-player__screen :deep(.aoi-media-overlay-button) {
  z-index: 4;
}

.aoi-danmaku-video-player__overlay {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: grid;
  place-items: center;
  gap: 12px;
  align-content: center;
  background:
    linear-gradient(180deg, rgba(5, 6, 8, .44), rgba(5, 6, 8, .74)),
    rgba(5, 6, 8, .52);
  color: rgba(255, 255, 255, .9);
  text-align: center;
  backdrop-filter: blur(10px);
}

.aoi-danmaku-video-player__controls {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 5;
  display: grid;
  gap: 6px;
  background:
    linear-gradient(180deg, transparent, rgba(0, 0, 0, .68) 28%, rgba(0, 0, 0, .9)),
    linear-gradient(90deg, rgba(255, 148, 113, .16), transparent 36%, rgba(247, 112, 156, .12));
  opacity: .84;
  padding: 30px 14px 10px;
  pointer-events: auto;
  transform: translate3d(0, 6px, 0);
  transition:
    opacity var(--aoi-motion-base) var(--aoi-ease-out),
    transform var(--aoi-motion-base) var(--aoi-ease-out);
}

.aoi-danmaku-video-player:hover .aoi-danmaku-video-player__controls,
.aoi-danmaku-video-player:focus-within .aoi-danmaku-video-player__controls,
.aoi-danmaku-video-player__controls--visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.aoi-danmaku-video-player__toolbar {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.aoi-danmaku-video-player__toolbar :deep(.aoi-icon-button) {
  --md-icon-button-icon-color: rgba(255, 255, 255, .9);
  --md-icon-button-hover-icon-color: #fff;
  --md-icon-button-pressed-icon-color: var(--aoi-accent-40);
  --md-filled-tonal-icon-button-container-color: rgba(255, 148, 113, .22);
  --md-filled-tonal-icon-button-icon-color: #fff;
}

.aoi-danmaku-video-player__volume {
  width: 110px;
}

.aoi-danmaku-video-player__volume :deep(.aoi-slider) {
  --md-slider-active-track-color: rgba(255, 255, 255, .92);
  --md-slider-handle-color: #fff;
  --md-slider-inactive-track-color: rgba(255, 255, 255, .24);
}

.aoi-danmaku-video-player__spacer {
  flex: 1 1 auto;
  min-width: 8px;
}

.aoi-danmaku-video-player__anchor {
  display: inline-flex;
  min-width: 0;
}

.aoi-danmaku-video-player__menu-button {
  max-width: 150px;
  --md-filled-tonal-button-container-color: rgba(255, 255, 255, .12);
  --md-filled-tonal-button-label-text-color: #fff;
  --md-filled-tonal-button-icon-color: #fff;
}

.aoi-danmaku-video-player__menu-button :deep(.aoi-button) {
  max-width: 100%;
}

.aoi-danmaku-video-player__rate-button {
  min-width: 74px;
}

.aoi-danmaku-video-player__panel {
  border-radius: 0;
  border-inline: 0;
  border-bottom: 0;
  box-shadow: none;
}

.aoi-danmaku-video-player:fullscreen {
  display: grid;
  width: 100vw;
  height: 100vh;
  grid-template-rows: minmax(0, 1fr) auto auto;
  background: #050608;
}

.aoi-danmaku-video-player:fullscreen .aoi-danmaku-video-player__screen {
  aspect-ratio: auto;
  min-height: 0;
}

.aoi-danmaku-video-player:fullscreen .aoi-danmaku-video-player__controls {
  position: absolute;
}

.aoi-danmaku-video-player:fullscreen .aoi-danmaku-video-player__panel {
  max-height: 34vh;
  overflow: auto;
}

@container (max-width: 760px) {
  .aoi-danmaku-video-player__toolbar {
    gap: 4px;
  }

  .aoi-danmaku-video-player__volume {
    display: none;
  }

  .aoi-danmaku-video-player__menu-button {
    max-width: 96px;
  }
}

@media (max-width: 639px) {
  .aoi-danmaku-video-player__screen {
    min-height: 0;
  }

  .aoi-danmaku-video-player__controls {
    gap: 5px;
    opacity: 1;
    padding: 24px 8px 8px;
    transform: none;
  }

  .aoi-danmaku-video-player__toolbar {
    overflow: hidden;
  }

  .aoi-danmaku-video-player__spacer {
    min-width: 0;
  }

  .aoi-danmaku-video-player__anchor:first-of-type {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .aoi-danmaku-video-player__controls {
    transition: none;
    transform: none;
  }
}
</style>

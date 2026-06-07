<script setup lang="ts" generic="T">
import type { AoiDanmakuItem, AoiDanmakuMapper, AoiDanmakuMode } from "~/types/danmaku"
import type { PlayerPlaybackRate } from "~/types/player"
import type { VideoSourceKind, VideoSourceOption } from "~/types/api"
import type { AoiVideoSourceEngineError } from "~/composables/useAoiVideoSourceEngine"
import type { AoiDanmakuRuntimeSettings } from "~/utils/aoiDanmaku"
import { inferAoiVideoSourceKind } from "~/composables/useAoiVideoSourceEngine"
import { normalizeAoiDanmakuItems } from "~/utils/aoiDanmaku"

type AoiDanmakuVideoPlayerErrorCode =
  | "dash"
  | "hls"
  | "load"
  | "noSource"
  | "play"
  | "sourceInit"
  | "unsupportedFormat"
  | "unsupportedHls"

interface AoiDanmakuVideoPlayerError extends Omit<AoiVideoSourceEngineError, "source"> {
  code: AoiDanmakuVideoPlayerErrorCode
  source?: VideoSourceOption
}

interface AoiDanmakuVideoPlayerState {
  currentTime: number
  duration: number
  engineAttaching: boolean
  error: AoiDanmakuVideoPlayerError | null
  errorCode: AoiDanmakuVideoPlayerErrorCode | null
  hasError: boolean
  hasLoadedMetadata: boolean
  isFullscreen: boolean
  isLoading: boolean
  isPlaying: boolean
  canPlay: boolean
  danmakuEnabled: boolean
  muted: boolean
  playbackRate: number
  theaterMode: boolean
  volume: number
}

interface AoiDanmakuVideoPlayerControls {
  exitFullscreen: () => Promise<void> | void
  pause: () => void
  play: () => Promise<void> | void
  reload: () => Promise<boolean> | void
  requestFullscreen: () => Promise<void> | void
  seekBy: (delta: number) => void
  seekTo: (seconds: number) => void
  selectSource: (id: string) => void
  sendDanmaku: (payload: { body: string, color: string, mode: AoiDanmakuMode }) => void
  setDanmakuEnabled: (value: boolean) => void
  setMuted: (value: boolean) => void
  setPlaybackRate: (value: number) => void
  setTheaterMode: (value: boolean) => void
  setVolume: (value: number) => void
  toggleFullscreen: () => Promise<void> | void
  togglePlay: () => Promise<void> | void
}

interface AoiDanmakuVideoPlayerSlotContext<TItem> {
  controls: AoiDanmakuVideoPlayerControls
  danmakuItems: AoiDanmakuItem[]
  rawDanmakuItems: TItem[]
  renderDanmakuItems: AoiDanmakuItem[]
  selectedSource: VideoSourceOption | null
  sources: VideoSourceOption[]
  state: AoiDanmakuVideoPlayerState
}

const props = withDefaults(defineProps<{
  ariaLabel?: string
  danmakuEnabled?: boolean
  danmakuItems?: T[]
  danmakuMapper?: AoiDanmakuMapper<T>
  danmakuSettings?: Partial<AoiDanmakuRuntimeSettings>
  durationSeconds?: number
  initialProgressSeconds?: number
  initialTimeSeconds?: number
  keyboardShortcuts?: boolean
  muted?: boolean
  playbackRate?: PlayerPlaybackRate | number
  poster?: string
  preloadMargin?: string
  selectedSourceId?: string
  sources?: VideoSourceOption[]
  src?: string
  theaterMode?: boolean
  title?: string
  volume?: number
}>(), {
  ariaLabel: undefined,
  danmakuEnabled: true,
  danmakuItems: () => [],
  danmakuMapper: undefined,
  danmakuSettings: () => ({}),
  durationSeconds: 0,
  initialProgressSeconds: undefined,
  initialTimeSeconds: 0,
  keyboardShortcuts: true,
  muted: false,
  playbackRate: 1,
  poster: undefined,
  preloadMargin: "200px 0px",
  selectedSourceId: "",
  sources: () => [],
  src: undefined,
  theaterMode: false,
  title: undefined,
  volume: 0.8
})

const emit = defineEmits<{
  ended: []
  error: [error: AoiDanmakuVideoPlayerError]
  "compose-request": []
  "duration-change": [seconds: number]
  progress: [seconds: number]
  "play-state-change": [playing: boolean]
  "send-danmaku": [payload: { body: string, color: string, mode: AoiDanmakuMode, timeSeconds: number }]
  "source-change": [source: VideoSourceOption]
  "time-change": [seconds: number]
  "update:danmakuEnabled": [value: boolean]
  "update:muted": [value: boolean]
  "update:playbackRate": [value: number]
  "update:selectedSourceId": [value: string]
  "update:theaterMode": [value: boolean]
  "update:volume": [value: number]
}>()

defineSlots<{
  default?: (props: AoiDanmakuVideoPlayerSlotContext<T>) => unknown
  composer?: (props: AoiDanmakuVideoPlayerSlotContext<T>) => unknown
  controls?: (props: AoiDanmakuVideoPlayerSlotContext<T>) => unknown
  overlay?: (props: AoiDanmakuVideoPlayerSlotContext<T>) => unknown
  panel?: (props: AoiDanmakuVideoPlayerSlotContext<T>) => unknown
}>()

const rootRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)
const duration = ref(props.durationSeconds)
const errorState = shallowRef<AoiDanmakuVideoPlayerError | null>(null)
const hasLoadedMetadata = ref(false)
const hasViewportFallback = ref(false)
const isFullscreen = ref(false)
const isLoading = ref(false)
const isPlaying = ref(false)
const pendingResumeTime = ref(0)
const attachedSourceId = ref("")
let lastProgressEmit = -1

const viewport = useAoiInViewport(rootRef, {
  once: true,
  rootMargin: props.preloadMargin,
  threshold: 0
})
const sourceEngine = useAoiVideoSourceEngine(videoRef)
const engineAttaching = sourceEngine.attaching
const initialTime = computed(() => Math.max(0, props.initialProgressSeconds ?? props.initialTimeSeconds ?? 0))
const safeVolume = computed(() => clampNumber(props.volume, 0, 1, 0.8))
const safePlaybackRate = computed(() => clampNumber(props.playbackRate, 0.25, 4, 1))
const resolvedAriaLabel = computed(() => props.ariaLabel || (props.title ? `${props.title} player` : "Video player"))
const normalizedDanmakuItems = computed(() => normalizeAoiDanmakuItems(props.danmakuItems, props.danmakuMapper))
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
    label: "Auto",
    src: props.src,
    isDefault: true
  }, 0)]
})
const sourceSignature = computed(() => normalizedSources.value
  .map((source) => `${source.id}:${source.kind}:${source.src}`)
  .join("|"))
const selectedSource = computed(() => {
  return normalizedSources.value.find((source) => source.id === props.selectedSourceId)
    || normalizedSources.value.find((source) => source.isDefault)
    || normalizedSources.value[0]
    || null
})
const shouldLoadMedia = computed(() => (viewport.hasIntersected.value || hasViewportFallback.value) && Boolean(selectedSource.value))
const hasError = computed(() => Boolean(errorState.value))
const canPlay = computed(() => Boolean(shouldLoadMedia.value && selectedSource.value && !hasError.value))
const state = computed<AoiDanmakuVideoPlayerState>(() => ({
  currentTime: currentTime.value,
  duration: duration.value,
  engineAttaching: engineAttaching.value,
  error: errorState.value,
  errorCode: errorState.value?.code || null,
  hasError: hasError.value,
  hasLoadedMetadata: hasLoadedMetadata.value,
  isFullscreen: isFullscreen.value,
  isLoading: isLoading.value,
  isPlaying: isPlaying.value,
  canPlay: canPlay.value,
  danmakuEnabled: props.danmakuEnabled,
  muted: props.muted,
  playbackRate: safePlaybackRate.value,
  theaterMode: props.theaterMode,
  volume: safeVolume.value
}))
const controls: AoiDanmakuVideoPlayerControls = {
  exitFullscreen,
  pause,
  play,
  reload,
  requestFullscreen,
  seekBy,
  seekTo,
  selectSource,
  sendDanmaku,
  setDanmakuEnabled,
  setMuted,
  setPlaybackRate,
  setTheaterMode,
  setVolume,
  toggleFullscreen,
  togglePlay
}
const slotContext = computed<AoiDanmakuVideoPlayerSlotContext<T>>(() => ({
  controls,
  danmakuItems: normalizedDanmakuItems.value,
  rawDanmakuItems: props.danmakuItems,
  renderDanmakuItems: normalizedDanmakuItems.value,
  selectedSource: selectedSource.value,
  sources: normalizedSources.value,
  state: state.value
}))

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return fallback
  }

  return Math.min(max, Math.max(min, numberValue))
}

function normalizeSource(source: VideoSourceOption, index: number): VideoSourceOption {
  const kind = (source.kind || inferAoiVideoSourceKind(source.src, source.mimeType)) as VideoSourceKind

  return {
    ...source,
    id: source.id || `source-${index + 1}`,
    kind,
    label: source.label || source.qualityLabel || "Auto"
  }
}

function engineErrorCode(error: AoiVideoSourceEngineError): AoiDanmakuVideoPlayerErrorCode {
  const map: Record<string, AoiDanmakuVideoPlayerErrorCode> = {
    AOI_VIDEO_DASH_ERROR: "dash",
    AOI_VIDEO_HLS_ERROR: "hls",
    AOI_VIDEO_SOURCE_INIT_ERROR: "sourceInit",
    AOI_VIDEO_UNSUPPORTED_FORMAT: "unsupportedFormat",
    AOI_VIDEO_UNSUPPORTED_HLS: "unsupportedHls"
  }

  return map[error.message] || "load"
}

function setError(error: AoiDanmakuVideoPlayerError) {
  errorState.value = error
  emit("error", error)
}

function clearError() {
  errorState.value = null
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

  video.muted = props.muted
  video.playbackRate = safePlaybackRate.value
  video.volume = safeVolume.value
}

function resetPlaybackState() {
  currentTime.value = 0
  duration.value = props.durationSeconds
  hasLoadedMetadata.value = false
  isLoading.value = false
  isPlaying.value = false
  lastProgressEmit = -1
  pendingResumeTime.value = initialTime.value
  clearError()
}

function refreshViewportFallback() {
  if (!import.meta.client || viewport.hasIntersected.value) {
    return
  }

  const root = rootRef.value

  if (!root) {
    return
  }

  const preloadMargin = Number.parseFloat(props.preloadMargin) || 200
  const rect = root.getBoundingClientRect()

  if (rect.bottom >= -preloadMargin && rect.top <= window.innerHeight + preloadMargin) {
    hasViewportFallback.value = true
  }
}

function onEngineError(error: AoiVideoSourceEngineError) {
  isLoading.value = false
  setError({
    ...error,
    code: engineErrorCode(error)
  })
}

async function attachSelectedSource(options: { autoplay?: boolean, keepTime?: boolean } = {}) {
  const source = selectedSource.value

  if (!source || !shouldLoadMedia.value) {
    if (!source) {
      setError({
        code: "noSource",
        fatal: true,
        message: "AOI_VIDEO_NO_SOURCE"
      })
    }

    return false
  }

  const resumeAt = options.keepTime ? currentTime.value : initialTime.value

  clearError()
  hasLoadedMetadata.value = false
  isLoading.value = true
  pendingResumeTime.value = Math.max(0, resumeAt)

  const attached = await sourceEngine.attachSource(source, {
    autoplay: options.autoplay,
    currentTime: pendingResumeTime.value,
    onError: onEngineError
  })

  if (!attached) {
    isLoading.value = false
    return false
  }

  attachedSourceId.value = source.id
  applyMediaSettings()
  emit("source-change", source)

  return true
}

async function reload() {
  return attachSelectedSource({ keepTime: true })
}

async function play() {
  const video = videoRef.value
  const source = selectedSource.value

  if (!video || !source) {
    return
  }

  if (attachedSourceId.value !== source.id) {
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
      setError({
        cause,
        code: "play",
        fatal: true,
        message: "AOI_VIDEO_PLAY_ERROR",
        source
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
  emit("duration-change", duration.value)
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
  emit("progress", Math.floor(duration.value))
  emit("ended")
  emit("play-state-change", false)
}

function onError() {
  isLoading.value = false
  setError({
    cause: videoRef.value?.error,
    code: "load",
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

function setVolume(value: number) {
  emit("update:volume", clampNumber(value, 0, 1, safeVolume.value))
}

function setPlaybackRate(value: number) {
  emit("update:playbackRate", clampNumber(value, 0.25, 4, safePlaybackRate.value))
}

function setMuted(value: boolean) {
  emit("update:muted", value)
}

function setTheaterMode(value: boolean) {
  emit("update:theaterMode", value)
}

function setDanmakuEnabled(value: boolean) {
  emit("update:danmakuEnabled", value)
}

async function requestFullscreen() {
  const root = rootRef.value

  if (!root || !import.meta.client) {
    return
  }

  await root.requestFullscreen?.()
}

async function exitFullscreen() {
  if (import.meta.client && document.fullscreenElement) {
    await document.exitFullscreen()
  }
}

async function toggleFullscreen() {
  if (!import.meta.client) {
    return
  }

  if (document.fullscreenElement) {
    await exitFullscreen()
    return
  }

  await requestFullscreen()
}

function selectSource(id: string) {
  if (selectedSource.value?.id === id) {
    return
  }

  const wasPlaying = isPlaying.value
  emit("update:selectedSourceId", id)
  void nextTick(() => attachSelectedSource({ autoplay: wasPlaying, keepTime: true }))
}

function sendDanmaku(payload: { body: string, color: string, mode: AoiDanmakuMode }) {
  emit("send-danmaku", {
    ...payload,
    timeSeconds: currentTime.value
  })
}

function onFullscreenChange() {
  isFullscreen.value = Boolean(document.fullscreenElement && rootRef.value?.contains(document.fullscreenElement))
}

function onKeydown(event: KeyboardEvent) {
  if (!props.keyboardShortcuts) {
    return
  }

  const target = event.target

  if (target instanceof HTMLElement && target.closest(".aoi-danmaku-composer")) {
    return
  }

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return
  }

  const key = event.key.toLowerCase()

  if (key === "enter") {
    event.preventDefault()
    emit("compose-request")
  } else if (key === " ") {
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
    setVolume(safeVolume.value + 0.05)
  } else if (key === "arrowdown") {
    event.preventDefault()
    setVolume(safeVolume.value - 0.05)
  } else if (key === "m") {
    event.preventDefault()
    setMuted(!props.muted)
  } else if (key === "f") {
    event.preventDefault()
    void toggleFullscreen()
  } else if (key === "d") {
    event.preventDefault()
    setDanmakuEnabled(!props.danmakuEnabled)
  } else if (key === "t") {
    event.preventDefault()
    setTheaterMode(!props.theaterMode)
  }
}

watch([
  () => props.muted,
  safePlaybackRate,
  safeVolume
], applyMediaSettings)

watch(sourceSignature, () => {
  const nextSource = selectedSource.value

  attachedSourceId.value = ""
  sourceEngine.destroy()
  resetPlaybackState()

  if (nextSource && props.selectedSourceId !== nextSource.id) {
    emit("update:selectedSourceId", nextSource.id)
  }
}, {
  immediate: true
})

watch([
  shouldLoadMedia,
  () => selectedSource.value?.id || ""
], ([ready, id], [, oldId]) => {
  if (ready && id && attachedSourceId.value !== id) {
    void nextTick(() => attachSelectedSource({
      autoplay: isPlaying.value && Boolean(oldId),
      keepTime: Boolean(oldId)
    }))
  } else if (ready && !id) {
    setError({
      code: "noSource",
      fatal: true,
      message: "AOI_VIDEO_NO_SOURCE"
    })
  }
}, {
  immediate: true
})

watch(() => props.durationSeconds, (value) => {
  duration.value = value
  emit("duration-change", value)
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
  exitFullscreen,
  pause,
  play,
  reload,
  requestFullscreen,
  seekBy,
  seekTo,
  selectSource,
  toggleFullscreen,
  togglePlay
})
</script>

<template>
  <section
    ref="rootRef"
    class="aoi-danmaku-video-player"
    :class="{ 'aoi-danmaku-video-player--theater': theaterMode }"
    :aria-label="resolvedAriaLabel"
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
        v-if="danmakuEnabled"
        :current-time="currentTime"
        :duration-seconds="duration"
        :items="normalizedDanmakuItems"
        :playing="isPlaying"
        :settings="danmakuSettings"
      />

      <slot v-bind="slotContext" />
      <slot name="overlay" v-bind="slotContext" />

      <div
        v-if="$slots.controls"
        class="aoi-danmaku-video-player__controls"
        :class="{ 'aoi-danmaku-video-player__controls--visible': !isPlaying }"
        @click.stop
      >
        <slot name="controls" v-bind="slotContext" />
      </div>
    </div>

    <slot name="composer" v-bind="slotContext" />
    <slot name="panel" v-bind="slotContext" />
  </section>
</template>

<style scoped>
.aoi-danmaku-video-player {
  container-type: inline-size;
  --aoi-player-accent: #00aeec;
  --aoi-player-accent-soft: #e3f6ff;
  display: grid;
  overflow: clip;
  border: 1px solid #e3e5e7;
  border-radius: 0;
  background: #fff;
  box-shadow: none;
  color: #fff;
  isolation: isolate;
}

.aoi-danmaku-video-player:focus-visible {
  outline: var(--aoi-focus-ring-width) solid var(--aoi-focus);
  outline-offset: var(--aoi-focus-ring-offset);
}

.aoi-danmaku-video-player--theater {
  border-color: #d7dce0;
  box-shadow: 0 8px 28px rgba(0, 0, 0, .08);
}

.aoi-danmaku-video-player__screen {
  position: relative;
  display: grid;
  aspect-ratio: 16 / 9;
  min-height: 304px;
  place-items: center;
  background: #000;
  overflow: hidden;
}

.aoi-danmaku-video-player--theater .aoi-danmaku-video-player__screen {
  min-height: min(70vh, 760px);
}

.aoi-danmaku-video-player__video {
  width: 100%;
  height: 100%;
  background: #000;
  object-fit: contain;
}

.aoi-danmaku-video-player__screen :deep(.aoi-media-overlay-button) {
  z-index: 4;
}

.aoi-danmaku-video-player__screen :deep(.aoi-media-overlay-button__control) {
  width: 62px;
  height: 62px;
  border-color: rgba(255, 255, 255, .48);
  background: rgba(0, 0, 0, .42);
  backdrop-filter: blur(8px);
}

.aoi-danmaku-video-player__screen :deep(.aoi-danmaku-video-player__overlay) {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: grid;
  place-items: center;
  gap: 12px;
  align-content: center;
  background: rgba(0, 0, 0, .72);
  color: rgba(255, 255, 255, .9);
  text-align: center;
  backdrop-filter: blur(6px);
}

.aoi-danmaku-video-player__controls {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 5;
  display: grid;
  gap: 5px;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, .66) 34%, rgba(0, 0, 0, .88));
  opacity: 0;
  padding: 34px 12px 8px;
  pointer-events: none;
  transform: translate3d(0, 8px, 0);
  transition:
    opacity var(--aoi-motion-base) var(--aoi-ease-out),
    transform var(--aoi-motion-base) var(--aoi-ease-out);
}

.aoi-danmaku-video-player:hover .aoi-danmaku-video-player__controls,
.aoi-danmaku-video-player:focus-within .aoi-danmaku-video-player__controls,
.aoi-danmaku-video-player__controls--visible {
  opacity: 1;
  pointer-events: auto;
  transform: translate3d(0, 0, 0);
}

.aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__toolbar) {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
}

.aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__toolbar .aoi-icon-button) {
  --md-icon-button-icon-color: rgba(255, 255, 255, .92);
  --md-icon-button-hover-icon-color: #fff;
  --md-icon-button-pressed-icon-color: var(--aoi-player-accent);
  --md-filled-tonal-icon-button-container-color: rgba(0, 174, 236, .2);
  --md-filled-tonal-icon-button-icon-color: #fff;
}

.aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__volume) {
  width: 96px;
}

.aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__volume .aoi-slider) {
  --md-slider-active-track-color: var(--aoi-player-accent);
  --md-slider-handle-color: #fff;
  --md-slider-inactive-track-color: rgba(255, 255, 255, .24);
}

.aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__spacer) {
  flex: 1 1 auto;
  min-width: 8px;
}

.aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__anchor) {
  display: inline-flex;
  min-width: 0;
}

.aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__menu-button) {
  max-width: 132px;
  --md-filled-tonal-button-container-color: rgba(255, 255, 255, .14);
  --md-filled-tonal-button-hover-state-layer-color: #fff;
  --md-filled-tonal-button-label-text-color: #fff;
  --md-filled-tonal-button-icon-color: #fff;
}

.aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__menu-button .aoi-button) {
  max-width: 100%;
}

.aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__rate-button) {
  min-width: 64px;
}

.aoi-danmaku-video-player :deep(.aoi-danmaku-video-player__panel) {
  border-radius: 0;
  border-inline: 0;
  border-bottom: 0;
  box-shadow: none;
}

.aoi-danmaku-video-player :deep(.aoi-danmaku-video-player__composer) {
  color: #18191c;
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

.aoi-danmaku-video-player:fullscreen :deep(.aoi-danmaku-video-player__panel) {
  max-height: 34vh;
  overflow: auto;
}

@container (max-width: 760px) {
  .aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__toolbar) {
    gap: 4px;
  }

  .aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__volume) {
    display: none;
  }

  .aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__menu-button) {
    max-width: 96px;
  }

  .aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__anchor--source) {
    display: none;
  }
}

@media (max-width: 639px) {
  .aoi-danmaku-video-player__screen {
    min-height: 0;
  }

  .aoi-danmaku-video-player__controls {
    gap: 5px;
    opacity: 1;
    padding: 26px 6px 8px;
    pointer-events: auto;
    transform: none;
  }

  .aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__toolbar) {
    gap: 2px;
    overflow: hidden;
  }

  .aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__toolbar .aoi-icon-button) {
    --aoi-icon-button-size: 36px;
    width: 36px;
    height: 36px;
  }

  .aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__spacer) {
    display: none;
  }

  .aoi-danmaku-video-player__controls :deep(.aoi-danmaku-video-player__rate-button) {
    min-width: 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .aoi-danmaku-video-player__controls {
    transition: none;
    transform: none;
  }
}
</style>

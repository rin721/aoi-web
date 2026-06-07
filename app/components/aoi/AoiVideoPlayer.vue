<script setup lang="ts">
import type { VideoDanmakuItem, VideoDanmakuMode } from "~/types/api"
import type { PlayerPlaybackRate } from "~/types/player"

const props = withDefaults(defineProps<{
  danmakuEnabled?: boolean
  danmakuItems?: VideoDanmakuItem[]
  durationSeconds: number
  initialProgressSeconds?: number
  src: string
  title: string
}>(), {
  danmakuEnabled: true,
  danmakuItems: () => [],
  initialProgressSeconds: 0
})

const emit = defineEmits<{
  ended: []
  progress: [seconds: number]
  "play-state-change": [playing: boolean]
  "send-danmaku": [payload: { body: string, color: string, mode: VideoDanmakuMode, timeSeconds: number }]
  "time-change": [seconds: number]
}>()

const playerSettings = usePlayerSettingsStore()
const appSettings = useAppSettingsStore()
const rootRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)
const duration = ref(props.durationSeconds)
const hasError = ref(false)
const isFullscreen = ref(false)
const isLoading = ref(false)
const isPlaying = ref(false)
const localDanmakuEnabled = ref(true)
let lastProgressEmit = -1
const viewport = useAoiInViewport(rootRef, {
  once: true,
  rootMargin: "200px 0px",
  threshold: 0
})

const shouldLoadMedia = computed(() => viewport.hasIntersected.value && Boolean(props.src))
const mediaSource = computed(() => shouldLoadMedia.value ? props.src : undefined)
const canPlay = computed(() => Boolean(shouldLoadMedia.value && !hasError.value))
const volumePercent = computed(() => Math.round(playerSettings.volume * 100))
const effectiveDanmakuEnabled = computed(() => {
  return props.danmakuEnabled && localDanmakuEnabled.value && appSettings.danmakuEnabled
})

function applyMediaSettings() {
  const video = videoRef.value

  if (!video || !shouldLoadMedia.value) {
    return
  }

  video.muted = playerSettings.muted
  video.playbackRate = playerSettings.playbackRate
  video.volume = playerSettings.volume
}

function loadMedia() {
  const video = videoRef.value

  if (!video) {
    return
  }

  hasError.value = !props.src
  isLoading.value = Boolean(props.src)
  applyMediaSettings()

  if (props.src) {
    video.load()
  }
}

function emitProgress(force = false) {
  const seconds = Math.floor(currentTime.value)

  if (force || Math.abs(seconds - lastProgressEmit) >= 3) {
    lastProgressEmit = seconds
    emit("progress", seconds)
  }
}

function onLoadedMetadata() {
  const video = videoRef.value

  if (!video) {
    return
  }

  duration.value = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : props.durationSeconds
  applyMediaSettings()

  const resumeAt = Math.min(props.initialProgressSeconds, Math.max(0, duration.value - 0.5))

  if (resumeAt > 0) {
    video.currentTime = resumeAt
    currentTime.value = resumeAt
    emit("time-change", resumeAt)
  }

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

async function togglePlay() {
  const video = videoRef.value

  if (!video || !canPlay.value) {
    return
  }

  if (video.paused) {
    try {
      await video.play()
    } catch {
      hasError.value = Boolean(video.error)
      isLoading.value = false
    }
    return
  }

  video.pause()
}

function onPlay() {
  isPlaying.value = true
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
}

function retryLoad() {
  const video = videoRef.value

  if (!video) {
    return
  }

  hasError.value = false
  isLoading.value = true
  video.load()
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

function setPlaybackRate(value: PlayerPlaybackRate) {
  playerSettings.setPlaybackRate(value)
}

function toggleMuted() {
  playerSettings.setMuted(!playerSettings.muted)
}

function toggleTheaterMode() {
  playerSettings.setTheaterMode(!playerSettings.theaterMode)
}

async function toggleFullscreen() {
  const root = rootRef.value

  if (!root || !import.meta.client) {
    return
  }

  if (document.fullscreenElement) {
    await document.exitFullscreen()
    return
  }

  await root.requestFullscreen?.()
}

function toggleDanmaku() {
  localDanmakuEnabled.value = !localDanmakuEnabled.value
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

watch(() => props.src, () => {
  hasError.value = false
  isLoading.value = false
  currentTime.value = 0
  duration.value = props.durationSeconds
  lastProgressEmit = -1

  if (shouldLoadMedia.value) {
    void nextTick(loadMedia)
  }
})

watch(shouldLoadMedia, (ready) => {
  if (ready) {
    isLoading.value = Boolean(props.src)
    void nextTick(loadMedia)
  }
}, {
  immediate: true
})

onMounted(() => {
  document.addEventListener("fullscreenchange", onFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener("fullscreenchange", onFullscreenChange)
})

defineExpose({
  seekTo
})
</script>

<template>
  <section
    ref="rootRef"
    class="aoi-video-player"
    :class="{ 'aoi-video-player--theater': playerSettings.theaterMode }"
    :aria-label="title"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div class="aoi-video-player__screen">
      <video
        ref="videoRef"
        class="aoi-video-player__video"
        :src="mediaSource"
        preload="metadata"
        playsinline
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
        @error="onError"
      />

      <AoiDanmakuLayer
        v-if="effectiveDanmakuEnabled"
        :items="danmakuItems"
        :current-time="currentTime"
        :duration-seconds="duration"
        :playing="isPlaying"
      />

      <div v-if="isLoading && !hasError" class="aoi-video-player__overlay">
        <AoiProgress indeterminate />
        <span>正在加载视频</span>
      </div>

      <div v-else-if="hasError || !src" class="aoi-video-player__overlay">
        <AoiIcon name="video-off" :size="32" decorative />
        <span>视频加载失败</span>
        <AoiButton variant="tonal" size="sm" icon="refresh-cw" @click="retryLoad">
          重试
        </AoiButton>
      </div>

      <AoiMediaOverlayButton
        v-else
        :icon="isPlaying ? 'pause' : 'play'"
        :label="isPlaying ? '暂停视频' : '播放视频'"
        @click="togglePlay"
      />

      <AoiVideoControls
        class="aoi-video-player__controls"
        :current-time="currentTime"
        :danmaku-enabled="effectiveDanmakuEnabled"
        :duration="duration"
        :fullscreen="isFullscreen"
        :is-playing="isPlaying"
        :muted="playerSettings.muted"
        :playback-rate="playerSettings.playbackRate"
        :playback-rates="playerSettings.playbackRates"
        :theater-mode="playerSettings.theaterMode"
        :volume-percent="volumePercent"
        @seek="seekTo"
        @toggle-danmaku="toggleDanmaku"
        @toggle-fullscreen="toggleFullscreen"
        @toggle-muted="toggleMuted"
        @toggle-play="togglePlay"
        @toggle-theater="toggleTheaterMode"
        @update:playback-rate="setPlaybackRate"
        @update:volume-percent="setVolumePercent"
      />
    </div>

    <AoiDanmakuComposer
      :disabled="!effectiveDanmakuEnabled"
      @submit="sendDanmaku"
    />
  </section>
</template>

<style scoped>
.aoi-video-player {
  display: grid;
  overflow: clip;
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .06), transparent 22%),
    #07090c;
  box-shadow:
    0 22px 70px rgba(11, 20, 24, .28),
    0 2px 0 rgba(255, 255, 255, .08) inset;
  color: #fff;
  isolation: isolate;
}

.aoi-video-player:focus-visible {
  outline: var(--aoi-focus-ring-width) solid var(--aoi-focus);
  outline-offset: var(--aoi-focus-ring-offset);
}

.aoi-video-player--theater {
  box-shadow:
    0 30px 90px rgba(11, 20, 24, .36),
    0 2px 0 rgba(255, 255, 255, .08) inset;
}

.aoi-video-player__screen {
  position: relative;
  display: grid;
  aspect-ratio: 16 / 9;
  min-height: 304px;
  place-items: center;
  background:
    linear-gradient(180deg, rgba(255, 180, 155, .12), transparent 22%),
    radial-gradient(circle at 72% 18%, rgba(247, 112, 156, .16), transparent 28%),
    linear-gradient(135deg, #080b10, #11171c 48%, #07191e);
  overflow: hidden;
}

.aoi-video-player--theater .aoi-video-player__screen {
  min-height: min(70vh, 760px);
}

.aoi-video-player__video {
  width: 100%;
  height: 100%;
  background: #050608;
  object-fit: contain;
}

.aoi-video-player__overlay {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: grid;
  place-items: center;
  gap: 12px;
  align-content: center;
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 148, 113, .2), transparent 28%),
    rgba(5, 6, 8, .68);
  color: rgba(255, 255, 255, .88);
  backdrop-filter: blur(10px);
}

.aoi-video-player__controls {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 5;
  opacity: .84;
  transform: translate3d(0, 6px, 0);
  transition:
    opacity var(--aoi-motion-base) var(--aoi-ease-out),
    transform var(--aoi-motion-base) var(--aoi-ease-out);
}

.aoi-video-player:hover .aoi-video-player__controls,
.aoi-video-player:focus-within .aoi-video-player__controls {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

@media (max-width: 639px) {
  .aoi-video-player__screen {
    min-height: 0;
  }

  .aoi-video-player__controls {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .aoi-video-player__controls {
    transition: none;
    transform: none;
  }
}
</style>

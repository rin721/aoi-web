<script setup lang="ts">
import type { VideoDetail } from "~/types/api"
import type { PlayerPlaybackRate } from "~/types/player"

const props = withDefaults(defineProps<{
  initialProgressSeconds?: number
  video: VideoDetail
}>(), {
  initialProgressSeconds: 0
})

const emit = defineEmits<{
  ended: []
  progress: [seconds: number]
  "play-state-change": [playing: boolean]
}>()

const playerSettings = usePlayerSettingsStore()
const rootRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)
const duration = ref(props.video.durationSeconds)
const hasError = ref(false)
const isLoading = ref(true)
const isPlaying = ref(false)
let lastProgressEmit = -1

const playbackRateOptions = computed(() => playerSettings.playbackRates.map((rate) => ({
  label: `${rate}x`,
  value: String(rate)
})))

const playbackRateModel = computed({
  get: () => String(playerSettings.playbackRate),
  set: (value: string) => playerSettings.setPlaybackRate(Number(value) as PlayerPlaybackRate)
})

const progressPercent = computed(() => {
  if (duration.value <= 0) {
    return 0
  }

  return Math.min(100, Math.max(0, currentTime.value / duration.value * 100))
})

const volumePercent = computed(() => Math.round(playerSettings.volume * 100))
const canPlay = computed(() => Boolean(props.video.sourceUrl && !hasError.value))

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const rest = String(safeSeconds % 60).padStart(2, "0")

  return `${minutes}:${rest}`
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

function loadMedia() {
  const video = videoRef.value

  if (!video) {
    return
  }

  hasError.value = !props.video.sourceUrl
  isLoading.value = Boolean(props.video.sourceUrl)
  applyMediaSettings()

  if (props.video.sourceUrl) {
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

  duration.value = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : props.video.durationSeconds
  applyMediaSettings()

  const resumeAt = Math.min(props.initialProgressSeconds, Math.max(0, duration.value - 0.5))

  if (resumeAt > 0) {
    video.currentTime = resumeAt
    currentTime.value = resumeAt
  }

  isLoading.value = false
}

function onTimeUpdate() {
  const video = videoRef.value

  if (!video) {
    return
  }

  currentTime.value = video.currentTime
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
      hasError.value = true
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
  emit("progress", props.video.durationSeconds)
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
  emitProgress(true)
}

function seekBy(delta: number) {
  seekTo(currentTime.value + delta)
}

function onSeekInput(event: Event) {
  seekTo(Number((event.target as HTMLInputElement).value))
}

function onVolumeInput(event: Event) {
  playerSettings.setVolume(Number((event.target as HTMLInputElement).value) / 100)
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

function onKeydown(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
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

watch(() => props.video.sourceUrl, () => {
  hasError.value = false
  isLoading.value = true
  currentTime.value = 0
  duration.value = props.video.durationSeconds
  lastProgressEmit = -1
  void nextTick(loadMedia)
})

onMounted(() => {
  requestAnimationFrame(loadMedia)
})
</script>

<template>
  <section
    ref="rootRef"
    class="video-player-shell"
    :class="{ 'video-player-shell--theater': playerSettings.theaterMode }"
    aria-label="视频播放器"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div class="video-player-shell__screen">
      <video
        ref="videoRef"
        class="video-player-shell__video"
        :src="video.sourceUrl"
        preload="metadata"
        playsinline
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
        @error="onError"
      />

      <div v-if="isLoading && !hasError" class="video-player-shell__overlay">
        <AoiProgress indeterminate />
        <span>加载本地示例视频</span>
      </div>

      <div v-else-if="hasError || !video.sourceUrl" class="video-player-shell__overlay">
        <AoiIcon name="video-off" :size="32" decorative />
        <span>本地示例视频加载失败</span>
        <AoiButton variant="tonal" size="sm" icon="refresh-cw" @click="retryLoad">
          重试
        </AoiButton>
      </div>

      <button
        v-else
        class="video-player-shell__play-surface"
        type="button"
        :aria-label="isPlaying ? '暂停视频' : '播放视频'"
        @click="togglePlay"
      >
        <span class="video-player-shell__play">
          <AoiIcon :name="isPlaying ? 'pause' : 'play'" :size="32" decorative />
        </span>
      </button>
    </div>

    <div class="video-player-shell__controls" aria-label="播放器控制">
      <div class="video-player-shell__timeline">
        <span>{{ formatTime(currentTime) }}</span>
        <input
          class="video-player-shell__range"
          type="range"
          min="0"
          :max="duration"
          step="0.1"
          :value="currentTime"
          aria-label="播放进度"
          :style="{ '--aoi-range-progress': `${progressPercent}%` }"
          @input="onSeekInput"
        >
        <span>{{ formatTime(duration) }}</span>
      </div>

      <div class="video-player-shell__actions">
        <AoiIconButton
          :icon="isPlaying ? 'pause' : 'play'"
          :label="isPlaying ? '暂停视频' : '播放视频'"
          variant="tonal"
          @click="togglePlay"
        />

        <AoiIconButton
          :icon="playerSettings.muted || playerSettings.volume === 0 ? 'volume-x' : 'volume-2'"
          :label="playerSettings.muted ? '取消静音' : '静音'"
          :active="playerSettings.muted"
          @click="toggleMuted"
        />

        <label class="video-player-shell__volume">
          <span class="video-player-shell__volume-label">音量</span>
          <input
            class="video-player-shell__range"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="volumePercent"
            aria-label="音量"
            :style="{ '--aoi-range-progress': `${volumePercent}%` }"
            @input="onVolumeInput"
          >
        </label>

        <AoiSelect
          v-model="playbackRateModel"
          class="video-player-shell__rate"
          label="倍速"
          variant="outlined"
          :options="playbackRateOptions"
        />

        <AoiIconButton
          icon="panel-top"
          label="剧场模式"
          :active="playerSettings.theaterMode"
          :variant="playerSettings.theaterMode ? 'tonal' : 'standard'"
          @click="toggleTheaterMode"
        />

        <AoiIconButton
          icon="maximize"
          label="全屏"
          @click="toggleFullscreen"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.video-player-shell {
  display: grid;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-md);
  background: #07181d;
  box-shadow: var(--aoi-shadow-sm);
  color: #fff;
  overflow: hidden;
}

.video-player-shell:focus-visible {
  outline: 3px solid var(--aoi-focus);
  outline-offset: 3px;
}

.video-player-shell--theater {
  margin-inline: clamp(-18px, -2vw, -10px);
  box-shadow: 0 24px 70px rgba(7, 24, 29, .28);
}

.video-player-shell__screen {
  position: relative;
  display: grid;
  aspect-ratio: 16 / 9;
  min-height: 260px;
  place-items: center;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, .14), transparent 45%),
    linear-gradient(135deg, #17262b, #216d7d 48%, #f2709c);
}

.video-player-shell--theater .video-player-shell__screen {
  min-height: min(70vh, 720px);
}

.video-player-shell__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-player-shell__overlay,
.video-player-shell__play-surface {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.video-player-shell__overlay {
  gap: 12px;
  align-content: center;
  background: rgba(7, 24, 29, .62);
  color: rgba(255, 255, 255, .86);
}

.video-player-shell__play-surface {
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.video-player-shell__play {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, .58);
  border-radius: 50%;
  background: rgba(255, 255, 255, .18);
  backdrop-filter: blur(12px);
  transition: transform var(--aoi-motion-fast) var(--aoi-ease-out);
}

.video-player-shell__play-surface:hover .video-player-shell__play {
  transform: scale(1.06);
}

.video-player-shell__controls {
  display: grid;
  gap: 10px;
  background: rgba(7, 24, 29, .94);
  padding: 12px;
}

.video-player-shell__timeline {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, .82);
  font-size: 12px;
  font-weight: 700;
}

.video-player-shell__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.video-player-shell__volume {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, .78);
  font-size: 12px;
  font-weight: 700;
}

.video-player-shell__volume input {
  width: 112px;
}

.video-player-shell__rate {
  width: 118px;
}

.video-player-shell__range {
  --aoi-range-progress: 0%;
  width: 100%;
  accent-color: var(--aoi-accent-50);
}

.video-player-shell__range:focus-visible {
  outline: 3px solid var(--aoi-focus);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .video-player-shell__play {
    transition: none;
  }
}

@media (max-width: 639px) {
  .video-player-shell__screen {
    min-height: 190px;
  }

  .video-player-shell__controls {
    gap: 8px;
    padding: 10px;
  }

  .video-player-shell--theater {
    margin-inline: 0;
  }

  .video-player-shell__timeline {
    grid-template-columns: 38px minmax(0, 1fr) 38px;
    gap: 7px;
  }

  .video-player-shell__actions {
    display: grid;
    grid-template-columns: 44px 44px minmax(0, 1fr) 88px 44px 44px;
    gap: 6px;
  }

  .video-player-shell__volume {
    min-width: 0;
    min-height: 44px;
    width: 100%;
  }

  .video-player-shell__volume-label {
    display: none;
  }

  .video-player-shell__volume input {
    min-width: 0;
    width: 100%;
  }

  .video-player-shell__rate {
    min-width: 0;
    width: 88px;
  }
}
</style>

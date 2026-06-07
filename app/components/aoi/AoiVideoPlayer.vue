<script setup lang="ts" generic="T">
import type { AoiDanmakuMapper, AoiDanmakuMode } from "~/types/danmaku"
import type { PlayerPlaybackRate } from "~/types/player"
import type { VideoSourceOption } from "~/types/api"
import type { AoiDanmakuRuntimeSettings } from "~/utils/aoiDanmaku"

type AoiDanmakuVideoPlayerExpose = {
  exitFullscreen: () => Promise<void> | void
  pause: () => void
  play: () => Promise<void> | void
  reload: () => Promise<boolean> | void
  requestFullscreen: () => Promise<void> | void
  seekBy: (delta: number) => void
  seekTo: (seconds: number) => void
  setWebFullscreen: (value: boolean) => Promise<void> | void
  selectSource: (id: string) => void
  toggleFullscreen: () => Promise<void> | void
  togglePlay: () => Promise<void> | void
  toggleWebFullscreen: () => Promise<void> | void
}

defineOptions({
  inheritAttrs: false
})

withDefaults(defineProps<{
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
  error: [error: unknown]
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

const playerRef = ref<AoiDanmakuVideoPlayerExpose | null>(null)

defineExpose({
  exitFullscreen: () => playerRef.value?.exitFullscreen(),
  pause: () => playerRef.value?.pause(),
  play: () => playerRef.value?.play(),
  reload: () => playerRef.value?.reload(),
  requestFullscreen: () => playerRef.value?.requestFullscreen(),
  seekBy: (delta: number) => playerRef.value?.seekBy(delta),
  seekTo: (seconds: number) => playerRef.value?.seekTo(seconds),
  setWebFullscreen: (value: boolean) => playerRef.value?.setWebFullscreen(value),
  selectSource: (id: string) => playerRef.value?.selectSource(id),
  toggleFullscreen: () => playerRef.value?.toggleFullscreen(),
  togglePlay: () => playerRef.value?.togglePlay(),
  toggleWebFullscreen: () => playerRef.value?.toggleWebFullscreen()
})
</script>

<template>
  <AoiDanmakuVideoPlayer
    ref="playerRef"
    v-bind="$attrs"
    :aria-label="ariaLabel"
    :src="src"
    :sources="sources"
    :poster="poster"
    :title="title"
    :duration-seconds="durationSeconds"
    :initial-progress-seconds="initialProgressSeconds"
    :initial-time-seconds="initialTimeSeconds"
    :selected-source-id="selectedSourceId"
    :preload-margin="preloadMargin"
    :muted="muted"
    :volume="volume"
    :playback-rate="playbackRate"
    :theater-mode="theaterMode"
    :danmaku-items="danmakuItems"
    :danmaku-mapper="danmakuMapper"
    :danmaku-enabled="danmakuEnabled"
    :danmaku-settings="danmakuSettings"
    :keyboard-shortcuts="keyboardShortcuts"
    @compose-request="emit('compose-request')"
    @duration-change="emit('duration-change', $event)"
    @ended="emit('ended')"
    @error="emit('error', $event)"
    @progress="emit('progress', $event)"
    @play-state-change="emit('play-state-change', $event)"
    @send-danmaku="emit('send-danmaku', $event)"
    @source-change="emit('source-change', $event)"
    @time-change="emit('time-change', $event)"
    @update:danmaku-enabled="emit('update:danmakuEnabled', $event)"
    @update:muted="emit('update:muted', $event)"
    @update:playback-rate="emit('update:playbackRate', $event)"
    @update:selected-source-id="emit('update:selectedSourceId', $event)"
    @update:theater-mode="emit('update:theaterMode', $event)"
    @update:volume="emit('update:volume', $event)"
  >
    <template v-if="$slots.default" #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
    <template v-if="$slots.overlay" #overlay="slotProps">
      <slot name="overlay" v-bind="slotProps" />
    </template>
    <template v-if="$slots.controls" #controls="slotProps">
      <slot name="controls" v-bind="slotProps" />
    </template>
    <template v-if="$slots.composer" #composer="slotProps">
      <slot name="composer" v-bind="slotProps" />
    </template>
    <template v-if="$slots.panel" #panel="slotProps">
      <slot name="panel" v-bind="slotProps" />
    </template>
  </AoiDanmakuVideoPlayer>
</template>

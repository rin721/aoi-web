<script setup lang="ts">
import type { VideoDanmakuItem, VideoDanmakuMode } from "~/types/api"

type AoiDanmakuVideoPlayerExpose = {
  pause: () => void
  play: () => Promise<void> | void
  requestFullscreen: () => Promise<void> | void
  seekBy: (delta: number) => void
  seekTo: (seconds: number) => void
  togglePlay: () => Promise<void> | void
}

withDefaults(defineProps<{
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

const playerRef = ref<AoiDanmakuVideoPlayerExpose | null>(null)

defineExpose({
  pause: () => playerRef.value?.pause(),
  play: () => playerRef.value?.play(),
  requestFullscreen: () => playerRef.value?.requestFullscreen(),
  seekBy: (delta: number) => playerRef.value?.seekBy(delta),
  seekTo: (seconds: number) => playerRef.value?.seekTo(seconds),
  togglePlay: () => playerRef.value?.togglePlay()
})
</script>

<template>
  <AoiDanmakuVideoPlayer
    ref="playerRef"
    :src="src"
    :title="title"
    :duration-seconds="durationSeconds"
    :initial-progress-seconds="initialProgressSeconds"
    :danmaku-items="danmakuItems"
    :danmaku-enabled="danmakuEnabled"
    :show-danmaku-panel="false"
    @ended="emit('ended')"
    @progress="emit('progress', $event)"
    @play-state-change="emit('play-state-change', $event)"
    @send-danmaku="emit('send-danmaku', $event)"
    @time-change="emit('time-change', $event)"
  />
</template>

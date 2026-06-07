<script setup lang="ts">
import type { PlayerPlaybackRate } from "~/types/player"

const props = withDefaults(defineProps<{
  danmakuEnabled?: boolean
  fullscreen?: boolean
  isPlaying?: boolean
  muted?: boolean
  playbackRate?: PlayerPlaybackRate
  playbackRates?: PlayerPlaybackRate[]
  theaterMode?: boolean
  volumePercent?: number
}>(), {
  danmakuEnabled: true,
  fullscreen: false,
  isPlaying: false,
  muted: false,
  playbackRate: 1,
  playbackRates: () => [0.75, 1, 1.25, 1.5, 2],
  theaterMode: false,
  volumePercent: 80
})

const emit = defineEmits<{
  "toggle-play": []
  "toggle-muted": []
  "toggle-theater": []
  "toggle-fullscreen": []
  "toggle-danmaku": []
  "update:playbackRate": [value: PlayerPlaybackRate]
  "update:volumePercent": [value: number]
}>()

const playbackRateOptions = computed(() => props.playbackRates.map((rate) => ({
  label: `${rate}x`,
  value: String(rate)
})))
const playbackRateModel = computed({
  get: () => String(props.playbackRate),
  set: (value: string) => emit("update:playbackRate", Number(value) as PlayerPlaybackRate)
})
</script>

<template>
  <div class="aoi-video-toolbar" aria-label="播放器控制">
    <AoiIconButton
      :icon="isPlaying ? 'pause' : 'play'"
      :label="isPlaying ? '暂停视频' : '播放视频'"
      size="sm"
      variant="tonal"
      @click="emit('toggle-play')"
    />

    <AoiIconButton
      :icon="muted || volumePercent === 0 ? 'volume-x' : 'volume-2'"
      :label="muted ? '取消静音' : '静音'"
      :active="muted"
      size="sm"
      @click="emit('toggle-muted')"
    />

    <div class="aoi-video-toolbar__volume">
      <span class="aoi-video-toolbar__volume-label">音量</span>
      <AoiSlider
        class="aoi-video-toolbar__volume-slider"
        :model-value="volumePercent"
        aria-label="音量"
        tone="inverse"
        compact
        :min="0"
        :max="100"
        :step="1"
        @update:model-value="emit('update:volumePercent', $event)"
      />
    </div>

    <span class="aoi-video-toolbar__spacer" aria-hidden="true" />

    <label class="aoi-video-toolbar__rate">
      <span>倍速</span>
      <select v-model="playbackRateModel" aria-label="倍速">
        <option
          v-for="option in playbackRateOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </label>

    <AoiIconButton
      icon="message-square-text"
      label="显示弹幕"
      :active="danmakuEnabled"
      :variant="danmakuEnabled ? 'tonal' : 'standard'"
      size="sm"
      @click="emit('toggle-danmaku')"
    />

    <AoiIconButton
      icon="panel-top"
      label="剧场模式"
      :active="theaterMode"
      :variant="theaterMode ? 'tonal' : 'standard'"
      size="sm"
      @click="emit('toggle-theater')"
    />

    <AoiIconButton
      :icon="fullscreen ? 'minimize' : 'maximize'"
      :label="fullscreen ? '退出全屏' : '全屏'"
      size="sm"
      @click="emit('toggle-fullscreen')"
    />
  </div>
</template>

<style scoped>
.aoi-video-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.aoi-video-toolbar :deep(.aoi-icon-button) {
  --md-icon-button-icon-color: rgba(255, 255, 255, .9);
  --md-icon-button-hover-icon-color: #fff;
  --md-icon-button-pressed-icon-color: var(--aoi-accent-40);
  --md-filled-tonal-icon-button-container-color: rgba(255, 148, 113, .22);
  --md-filled-tonal-icon-button-icon-color: #fff;
}

.aoi-video-toolbar__spacer {
  flex: 1 1 auto;
  min-width: 12px;
}

.aoi-video-toolbar__volume {
  display: flex;
  min-height: 34px;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, .78);
  font-size: 12px;
  font-weight: 800;
}

.aoi-video-toolbar__volume-label {
  display: none;
}

.aoi-video-toolbar__volume-slider {
  width: 104px;
  --md-slider-active-track-color: rgba(255, 255, 255, .92);
  --md-slider-handle-color: #fff;
  --md-slider-inactive-track-color: rgba(255, 255, 255, .24);
}

.aoi-video-toolbar__rate {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: var(--aoi-radius-field);
  background: rgba(255, 255, 255, .1);
  color: rgba(255, 255, 255, .82);
  font-size: 12px;
  font-weight: 800;
  padding: 0 7px;
  backdrop-filter: blur(10px);
}

.aoi-video-toolbar__rate select {
  width: 54px;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font: inherit;
  outline: 0;
}

.aoi-video-toolbar__rate option {
  color: var(--aoi-text);
  background: var(--aoi-surface-solid);
}

@media (max-width: 639px) {
  .aoi-video-toolbar {
    display: flex;
    gap: 4px;
  }

  .aoi-video-toolbar__volume {
    display: none;
  }

  .aoi-video-toolbar__rate {
    min-height: 30px;
    padding-inline: 5px;
  }

  .aoi-video-toolbar__volume-slider {
    display: none;
  }

  .aoi-video-toolbar__rate span {
    display: none;
  }

  .aoi-video-toolbar__spacer {
    min-width: 0;
  }
}
</style>

<script setup lang="ts">
import type { VideoDanmakuMode } from "~/types/api"
import { AOI_DANMAKU_COLORS } from "~/utils/aoiDanmaku"

const props = withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false
})

const emit = defineEmits<{
  submit: [payload: { body: string, color: string, mode: VideoDanmakuMode }]
}>()

const body = ref("")
const color = ref(AOI_DANMAKU_COLORS[0]!)
const mode = ref<VideoDanmakuMode>("scroll")
const modeModel = computed({
  get: () => mode.value,
  set: (value: string) => {
    mode.value = value === "top" || value === "bottom" ? value : "scroll"
  }
})

const modeItems = [
  { value: "scroll", label: "滚动", icon: "move-right" },
  { value: "top", label: "顶部", icon: "align-vertical-space-around" },
  { value: "bottom", label: "底部", icon: "align-vertical-space-between" }
]

watch(body, (value) => {
  if (value.length > 80) {
    body.value = value.slice(0, 80)
  }
})

function submit() {
  const safeBody = body.value.trim().slice(0, 80)

  if (!safeBody || props.disabled) {
    return
  }

  emit("submit", {
    body: safeBody,
    color: color.value,
    mode: mode.value
  })
  body.value = ""
}
</script>

<template>
  <form class="aoi-danmaku-composer" @submit.prevent="submit">
    <span
      class="aoi-danmaku-composer__status"
      :class="{ 'aoi-danmaku-composer__status--disabled': disabled }"
      aria-live="polite"
    >
      <AoiIcon :name="disabled ? 'message-square-off' : 'message-square-text'" :size="15" decorative />
      {{ disabled ? "弹幕关闭" : "弹幕" }}
    </span>

    <AoiSegmentedControl
      v-model="modeModel"
      class="aoi-danmaku-composer__mode"
      aria-label="弹幕模式"
      :columns="3"
      :items="modeItems"
    />

    <div class="aoi-danmaku-composer__colors" aria-label="弹幕颜色">
      <button
        v-for="item in AOI_DANMAKU_COLORS"
        :key="item"
        class="aoi-danmaku-composer__color"
        :class="{ 'aoi-danmaku-composer__color--active': item === color }"
        type="button"
        :aria-label="`选择颜色 ${item}`"
        :aria-pressed="item === color"
        :style="{ backgroundColor: item }"
        :disabled="disabled || undefined"
        @click="color = item"
      />
    </div>

    <AoiTextField
      v-model="body"
      class="aoi-danmaku-composer__field"
      icon="send"
      label="发送弹幕"
      placeholder="发个友善的弹幕见证当下"
      :disabled="disabled"
      @enter="submit"
    />

    <button
      class="aoi-danmaku-composer__hint"
      type="button"
      :disabled="disabled || undefined"
      title="弹幕礼仪"
    >
      <AoiIcon name="sparkles" :size="15" decorative />
      <span>礼仪</span>
    </button>

    <AoiButton
      class="aoi-danmaku-composer__submit"
      type="submit"
      icon="send"
      :disabled="disabled || !body.trim()"
    >
      发送
    </AoiButton>
  </form>
</template>

<style scoped>
.aoi-danmaku-composer {
  container-type: inline-size;
  display: grid;
  grid-template-columns: auto 150px auto minmax(0, 1fr) auto auto;
  gap: 7px;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, .1);
  background:
    linear-gradient(90deg, rgba(255, 148, 113, .18), transparent 26%, rgba(247, 112, 156, .14)),
    #101418;
  padding: 7px 10px;
  color: rgba(255, 255, 255, .88);
}

.aoi-danmaku-composer__status,
.aoi-danmaku-composer__hint {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: var(--aoi-radius-field);
  background: rgba(255, 255, 255, .08);
  color: rgba(255, 255, 255, .84);
  font-size: 12px;
  font-weight: 820;
  padding: 0 9px;
}

.aoi-danmaku-composer__status {
  box-shadow: 0 0 0 1px rgba(255, 148, 113, .1) inset;
}

.aoi-danmaku-composer__status--disabled {
  color: rgba(255, 255, 255, .48);
}

.aoi-danmaku-composer__hint {
  cursor: default;
  font: inherit;
}

.aoi-danmaku-composer__hint:disabled {
  opacity: .48;
}

.aoi-danmaku-composer__mode {
  --aoi-text: rgba(255, 255, 255, .88);
  --aoi-text-muted: rgba(255, 255, 255, .62);
  --aoi-surface-solid: rgba(255, 255, 255, .08);
  --aoi-state-hover: rgba(255, 255, 255, .1);
  --aoi-state-active: rgba(255, 255, 255, .16);
}

.aoi-danmaku-composer__mode :deep(.aoi-segmented__item) {
  min-height: 32px;
  border-color: rgba(255, 255, 255, .1);
  padding: 5px 7px;
}

.aoi-danmaku-composer__mode :deep(.aoi-segmented__item small) {
  display: none;
}

.aoi-danmaku-composer__colors {
  display: flex;
  gap: 4px;
}

.aoi-danmaku-composer__color {
  width: 19px;
  height: 19px;
  border: 2px solid rgba(255, 255, 255, .35);
  border-radius: var(--aoi-radius-round);
  cursor: pointer;
  padding: 0;
}

.aoi-danmaku-composer__color--active {
  border-color: #fff;
  box-shadow:
    0 0 0 2px rgba(255, 148, 113, .6),
    0 0 12px rgba(255, 148, 113, .28);
}

.aoi-danmaku-composer__field {
  min-width: 0;
  width: 100%;
  --md-filled-text-field-container-color: rgba(255, 255, 255, .92);
  --md-filled-text-field-container-height: 34px;
  --md-filled-text-field-focus-active-indicator-color: var(--aoi-accent-60);
  --md-filled-text-field-input-text-color: #1d2529;
  --md-filled-text-field-label-text-color: rgba(23, 38, 43, .68);
  --md-filled-text-field-hover-active-indicator-color: var(--aoi-sakura-50);
  --md-filled-text-field-supporting-text-color: rgba(255, 255, 255, .68);
}

.aoi-danmaku-composer__submit {
  --md-filled-button-container-color: var(--aoi-sakura-50);
  --md-filled-button-label-text-color: #fff;
  --md-filled-button-icon-color: #fff;
}

@container (max-width: 760px) {
  .aoi-danmaku-composer {
    grid-template-columns: auto 138px minmax(0, 1fr) auto;
  }

  .aoi-danmaku-composer__colors,
  .aoi-danmaku-composer__hint {
    display: none;
  }
}

@media (max-width: 900px) {
  .aoi-danmaku-composer {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .aoi-danmaku-composer__mode,
  .aoi-danmaku-composer__colors,
  .aoi-danmaku-composer__hint {
    display: none;
  }
}

@media (max-width: 520px) {
  .aoi-danmaku-composer {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px;
    padding: 7px;
  }

  .aoi-danmaku-composer__status {
    display: none;
  }
}
</style>

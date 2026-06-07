<script setup lang="ts">
import type { AoiDanmakuMode } from "~/types/danmaku"
import { AOI_DANMAKU_COLORS } from "~/utils/aoiDanmaku"

const props = withDefaults(defineProps<{
  count?: number
  disabled?: boolean
  enabled?: boolean
  playing?: boolean
}>(), {
  count: 0,
  disabled: false,
  enabled: true,
  playing: false
})

const emit = defineEmits<{
  submit: [payload: { body: string, color: string, mode: AoiDanmakuMode }]
  "toggle-enabled": []
}>()

const { t } = useI18n()
const body = ref("")
const color = ref(AOI_DANMAKU_COLORS[0]!)
const inputRef = ref<HTMLInputElement | null>(null)
const mode = ref<AoiDanmakuMode>("scroll")
const settingsOpen = ref(false)
const modeModel = computed({
  get: () => mode.value,
  set: (value: string) => {
    mode.value = value === "top" || value === "bottom" ? value : "scroll"
  }
})
const canSend = computed(() => props.enabled && !props.disabled)
const statusText = computed(() => {
  if (props.disabled) {
    return t("player.danmakuUnavailable")
  }

  return props.enabled ? t("player.danmakuOn") : t("player.danmakuOff")
})
const countText = computed(() => t("player.danmakuCount", { count: props.count }))

const modeItems = computed(() => [
  { value: "scroll", label: t("player.danmakuScroll"), icon: "move-right" },
  { value: "top", label: t("player.danmakuTop"), icon: "align-vertical-space-around" },
  { value: "bottom", label: t("player.danmakuBottom"), icon: "align-vertical-space-between" }
])

watch(body, (value) => {
  if (value.length > 80) {
    body.value = value.slice(0, 80)
  }
})

function submit() {
  const safeBody = body.value.trim().slice(0, 80)

  if (!safeBody || !canSend.value) {
    return
  }

  emit("submit", {
    body: safeBody,
    color: color.value,
    mode: mode.value
  })
  body.value = ""
}

function toggleSettings() {
  settingsOpen.value = !settingsOpen.value
}

function toggleEnabled() {
  if (!props.disabled) {
    emit("toggle-enabled")
  }
}

function selectMode(value: string) {
  modeModel.value = value
}

function focusInput() {
  inputRef.value?.focus()
}

defineExpose({
  focus: focusInput
})
</script>

<template>
  <form
    class="aoi-danmaku-composer"
    :class="{
      'aoi-danmaku-composer--disabled': disabled,
      'aoi-danmaku-composer--off': !enabled,
      'aoi-danmaku-composer--playing': playing
    }"
    @submit.prevent="submit"
  >
    <button
      class="aoi-danmaku-composer__status"
      type="button"
      :aria-label="enabled ? t('player.hideDanmaku') : t('player.showDanmaku')"
      :aria-pressed="enabled"
      :disabled="disabled || undefined"
      @click="toggleEnabled"
    >
      <AoiIcon :name="enabled && !disabled ? 'message-square-text' : 'message-square-off'" :size="15" decorative />
      <span>{{ statusText }}</span>
      <small>{{ countText }}</small>
    </button>

    <label class="aoi-danmaku-composer__field">
      <span class="aoi-danmaku-composer__field-label">{{ t("player.danmaku") }}</span>
      <input
        ref="inputRef"
        v-model="body"
        :aria-label="t('player.danmakuSend')"
        autocomplete="off"
        :disabled="!canSend || undefined"
        maxlength="80"
        :placeholder="enabled ? t('player.danmakuPlaceholder') : t('player.danmakuOff')"
        type="text"
        @keydown.enter.prevent="submit"
      />
    </label>

    <button
      class="aoi-danmaku-composer__settings-button"
      type="button"
      :aria-expanded="settingsOpen"
      :aria-label="t('player.danmakuSettings')"
      :disabled="disabled || undefined"
      @click="toggleSettings"
    >
      <AoiIcon name="sliders-horizontal" :size="16" decorative />
    </button>

    <AoiButton
      class="aoi-danmaku-composer__submit"
      type="submit"
      icon="send"
      size="sm"
      :disabled="!canSend || !body.trim()"
    >
      {{ t("player.danmakuSend") }}
    </AoiButton>

    <div
      v-if="settingsOpen"
      class="aoi-danmaku-composer__settings"
      @click.stop
    >
      <div class="aoi-danmaku-composer__settings-group">
        <span>{{ t("player.danmakuMode") }}</span>
        <div class="aoi-danmaku-composer__mode" role="radiogroup" :aria-label="t('player.danmakuMode')">
          <button
            v-for="item in modeItems"
            :key="item.value"
            class="aoi-danmaku-composer__choice"
            :class="{ 'aoi-danmaku-composer__choice--active': item.value === modeModel }"
            type="button"
            role="radio"
            :aria-checked="item.value === modeModel"
            :disabled="disabled || undefined"
            @click="selectMode(item.value)"
          >
            <AoiIcon :name="item.icon" :size="14" decorative />
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="aoi-danmaku-composer__settings-group">
        <span>{{ t("player.danmakuColor") }}</span>
        <div class="aoi-danmaku-composer__colors" :aria-label="t('player.danmakuColor')">
          <button
            v-for="item in AOI_DANMAKU_COLORS"
            :key="item"
            class="aoi-danmaku-composer__color"
            :class="{ 'aoi-danmaku-composer__color--active': item === color }"
            type="button"
            :aria-label="t('player.danmakuColorPick', { color: item })"
            :aria-pressed="item === color"
            :style="{ backgroundColor: item }"
            :disabled="disabled || undefined"
            @click="color = item"
          />
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped>
.aoi-danmaku-composer {
  container-type: inline-size;
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
  border: 1px solid #e3e5e7;
  border-top: 0;
  background: #f6f7f8;
  color: #18191c;
  padding: 8px 10px;
  --aoi-player-accent: #00aeec;
}

.aoi-danmaku-composer__status {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: var(--aoi-radius-field);
  background: transparent;
  color: var(--aoi-player-accent);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 760;
  padding: 0 6px;
}

.aoi-danmaku-composer__status small {
  color: #9499a0;
  font-size: 11px;
  font-weight: 620;
}

.aoi-danmaku-composer__status:hover {
  background: #e3f6ff;
}

.aoi-danmaku-composer--off .aoi-danmaku-composer__status,
.aoi-danmaku-composer--disabled .aoi-danmaku-composer__status {
  color: #9499a0;
}

.aoi-danmaku-composer__field {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  overflow: hidden;
  border: 1px solid #e3e5e7;
  border-radius: var(--aoi-radius-field);
  background: #fff;
  color: #61666d;
  font-size: 12px;
  transition:
    border-color var(--aoi-motion-fast) var(--aoi-ease-out),
    box-shadow var(--aoi-motion-fast) var(--aoi-ease-out);
}

.aoi-danmaku-composer__field:focus-within {
  border-color: var(--aoi-player-accent);
  box-shadow: 0 0 0 2px rgba(0, 174, 236, .12);
}

.aoi-danmaku-composer__field-label {
  padding-inline: 10px 7px;
  white-space: nowrap;
}

.aoi-danmaku-composer__field input {
  min-width: 0;
  height: 30px;
  border: 0;
  background: transparent;
  color: #18191c;
  font: inherit;
  outline: 0;
  padding: 0 10px 0 0;
}

.aoi-danmaku-composer__field input::placeholder {
  color: #9499a0;
}

.aoi-danmaku-composer__settings-button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  border-radius: var(--aoi-radius-field);
  background: transparent;
  color: #61666d;
  cursor: pointer;
  padding: 0;
}

.aoi-danmaku-composer__settings-button:hover,
.aoi-danmaku-composer__settings-button[aria-expanded="true"] {
  background: #e3f6ff;
  color: var(--aoi-player-accent);
}

.aoi-danmaku-composer__submit {
  --md-filled-button-container-color: var(--aoi-player-accent);
  --md-filled-button-label-text-color: #fff;
  --md-filled-button-icon-color: #fff;
  --md-filled-button-container-height: 32px;
}

.aoi-danmaku-composer__settings {
  position: absolute;
  right: 10px;
  bottom: calc(100% + 8px);
  z-index: var(--aoi-z-floating);
  display: grid;
  width: min(328px, calc(100vw - 28px));
  gap: 12px;
  border: 1px solid #e3e5e7;
  border-radius: var(--aoi-radius-card);
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .14);
  padding: 12px;
}

.aoi-danmaku-composer__settings-group {
  display: grid;
  gap: 8px;
}

.aoi-danmaku-composer__settings-group > span {
  color: #61666d;
  font-size: 12px;
  font-weight: 760;
}

.aoi-danmaku-composer__mode,
.aoi-danmaku-composer__colors {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.aoi-danmaku-composer__choice {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: 5px;
  border: 1px solid #e3e5e7;
  border-radius: var(--aoi-radius-field);
  background: #fff;
  color: #61666d;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 720;
  padding: 4px 8px;
}

.aoi-danmaku-composer__choice--active {
  border-color: var(--aoi-player-accent);
  background: #e3f6ff;
  color: var(--aoi-player-accent);
}

.aoi-danmaku-composer__color {
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-radius: var(--aoi-radius-round);
  box-shadow: 0 0 0 1px #c9ccd0;
  cursor: pointer;
  padding: 0;
}

.aoi-danmaku-composer__color--active {
  box-shadow:
    0 0 0 2px var(--aoi-player-accent),
    0 0 0 4px rgba(0, 174, 236, .14);
}

.aoi-danmaku-composer button:disabled,
.aoi-danmaku-composer input:disabled {
  cursor: not-allowed;
  opacity: .58;
}

@container (max-width: 760px) {
  .aoi-danmaku-composer {
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 6px;
  }

  .aoi-danmaku-composer__status {
    display: none;
  }
}

@media (max-width: 520px) {
  .aoi-danmaku-composer {
    padding: 7px;
  }

  .aoi-danmaku-composer__field-label {
    display: none;
  }

  .aoi-danmaku-composer__settings-button {
    display: none;
  }
}
</style>

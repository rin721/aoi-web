<script setup lang="ts">
import type { VideoDanmakuItem } from "~/types/api"
import { filterAoiDanmakuItems } from "~/utils/aoiDanmaku"

const props = withDefaults(defineProps<{
  currentTime?: number
  items?: VideoDanmakuItem[]
}>(), {
  currentTime: 0,
  items: () => []
})

const emit = defineEmits<{
  seek: [seconds: number]
}>()

const settings = useAppSettingsStore()
const sortMode = ref<"time" | "newest">("time")
const collapsed = ref(false)
const visibleItems = computed(() => {
  const items = filterAoiDanmakuItems(props.items, {
    blocklist: settings.danmakuBlocklist,
    bottomModeEnabled: settings.danmakuBottomModeEnabled,
    enabled: true,
    fontScale: settings.danmakuFontScale,
    opacity: settings.danmakuOpacity,
    scrollModeEnabled: settings.danmakuScrollModeEnabled,
    speed: settings.danmakuSpeed,
    topModeEnabled: settings.danmakuTopModeEnabled,
    visibleArea: settings.danmakuVisibleArea
  })

  return [...items].sort((a, b) => sortMode.value === "time"
    ? a.timeSeconds - b.timeSeconds
    : Date.parse(b.createdAt) - Date.parse(a.createdAt))
})

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = String(Math.floor(seconds % 60)).padStart(2, "0")

  return `${minutes}:${rest}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit"
  }).format(new Date(value))
}
</script>

<template>
  <section class="aoi-danmaku-panel" :class="{ 'aoi-danmaku-panel--collapsed': collapsed }">
    <header class="aoi-danmaku-panel__header">
      <div>
        <h2>弹幕列表</h2>
        <p>{{ visibleItems.length }} 条同步弹幕</p>
      </div>
      <div class="aoi-danmaku-panel__actions">
        <AoiIconButton
          icon="arrow-up-down"
          label="切换弹幕排序"
          @click="sortMode = sortMode === 'time' ? 'newest' : 'time'"
        />
        <AoiIconButton
          :icon="collapsed ? 'chevron-down' : 'chevron-up'"
          :label="collapsed ? '展开弹幕列表' : '折叠弹幕列表'"
          @click="collapsed = !collapsed"
        />
      </div>
    </header>

    <div v-if="!collapsed" class="aoi-danmaku-panel__table" role="table" aria-label="弹幕列表">
      <div class="aoi-danmaku-panel__row aoi-danmaku-panel__row--head" role="row">
        <span role="columnheader">时间</span>
        <span role="columnheader">内容</span>
        <span role="columnheader">发送日期</span>
      </div>
      <button
        v-for="item in visibleItems"
        :key="item.id"
        class="aoi-danmaku-panel__row"
        :class="{ 'aoi-danmaku-panel__row--active': Math.abs(item.timeSeconds - currentTime) < 2 }"
        type="button"
        role="row"
        @click="emit('seek', item.timeSeconds)"
      >
        <span role="cell">{{ formatTime(item.timeSeconds) }}</span>
        <strong role="cell">{{ item.body }}</strong>
        <span role="cell">{{ formatDate(item.createdAt) }}</span>
      </button>
      <p v-if="visibleItems.length === 0" class="aoi-danmaku-panel__empty">
        暂无可显示弹幕
      </p>
    </div>
  </section>
</template>

<style scoped>
.aoi-danmaku-panel {
  display: grid;
  min-height: 0;
  border: 1px solid color-mix(in srgb, var(--aoi-border) 72%, rgba(255, 148, 113, .26));
  border-radius: var(--aoi-radius-card);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .92), rgba(255, 255, 255, .78)),
    var(--aoi-panel-bg);
  box-shadow: 0 10px 32px rgba(19, 80, 96, .1);
  overflow: hidden;
}

.aoi-danmaku-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--aoi-border);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--aoi-accent-10) 72%, white), rgba(255, 255, 255, .86));
  padding: 9px 10px;
}

.aoi-danmaku-panel__header h2,
.aoi-danmaku-panel__header p {
  margin: 0;
}

.aoi-danmaku-panel__header h2 {
  color: #141f23;
  font-size: 14px;
  letter-spacing: 0;
}

.aoi-danmaku-panel__header p {
  color: var(--aoi-text-muted);
  font-size: 11px;
  font-weight: 720;
}

.aoi-danmaku-panel__actions {
  display: flex;
  gap: 2px;
}

.aoi-danmaku-panel__actions :deep(.aoi-icon-button) {
  --md-icon-button-icon-color: var(--aoi-text-muted);
  --md-icon-button-hover-icon-color: var(--aoi-accent-60);
}

.aoi-danmaku-panel__table {
  display: grid;
  max-height: 338px;
  overflow: auto;
  scrollbar-width: thin;
}

.aoi-danmaku-panel__row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 76px;
  align-items: center;
  gap: 7px;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--aoi-border) 72%, transparent);
  background: transparent;
  color: var(--aoi-text-muted);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  padding: 7px 10px;
  text-align: left;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out);
}

.aoi-danmaku-panel__row strong {
  min-width: 0;
  overflow: hidden;
  color: var(--aoi-text);
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aoi-danmaku-panel__row:hover {
  background: color-mix(in srgb, var(--aoi-accent-10) 62%, transparent);
}

.aoi-danmaku-panel__row--head {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(255, 255, 255, .94);
  cursor: default;
  font-weight: 800;
  color: color-mix(in srgb, var(--aoi-text-muted) 84%, var(--aoi-accent-60));
}

.aoi-danmaku-panel__row--active {
  background: color-mix(in srgb, var(--aoi-sakura-20) 52%, transparent);
  color: var(--aoi-accent-60);
}

.aoi-danmaku-panel__empty {
  margin: 0;
  color: var(--aoi-text-muted);
  padding: 14px 12px;
}

@media (max-width: 1100px) {
  .aoi-danmaku-panel__table {
    max-height: 260px;
  }
}
</style>

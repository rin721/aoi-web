<script setup lang="ts">
import type { HistoryEntry } from "~/types/library"

const library = useLibraryStore()

const entries = computed(() => library.history)
const hasHistory = computed(() => library.hydrated && entries.value.length > 0)

function formatViewedAt(entry: HistoryEntry) {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit"
  }).format(new Date(entry.lastViewedAt))
}

function progressPercent(entry: HistoryEntry) {
  if (entry.video.durationSeconds <= 0) {
    return 0
  }

  return Math.min(100, Math.round(entry.progressSeconds / entry.video.durationSeconds * 100))
}

function formatProgress(entry: HistoryEntry) {
  const percent = progressPercent(entry)

  if (percent >= 95) {
    return "已看完"
  }

  if (entry.progressSeconds <= 0) {
    return "刚刚打开"
  }

  const minutes = Math.floor(entry.progressSeconds / 60)
  const seconds = String(entry.progressSeconds % 60).padStart(2, "0")

  return `继续观看 ${minutes}:${seconds}`
}

useHead({
  title: "History - Aoi"
})
</script>

<template>
  <div class="aoi-page">
    <PageHeader
      icon="history"
      title="历史"
      description="这里记录你在当前浏览器里打开和观看过的视频，包含本地播放进度。"
    >
      <template #actions>
        <AoiButton
          variant="outlined"
          icon="trash-2"
          :disabled="!hasHistory"
          @click="library.clearHistory()"
        >
          清空历史
        </AoiButton>
      </template>
    </PageHeader>

    <div v-if="!library.hydrated" class="history-state">
      <AoiProgress indeterminate />
    </div>

    <section v-else-if="hasHistory" class="history-grid" aria-label="最近观看">
      <article
        v-for="(entry, index) in entries"
        :key="entry.video.id"
        class="history-entry"
      >
        <div class="history-entry__meta">
          <span class="history-entry__time">
            <AoiIcon name="clock-3" :size="14" decorative />
            {{ formatViewedAt(entry) }}
          </span>
          <span class="history-entry__progress-label">{{ formatProgress(entry) }}</span>
        </div>
        <div class="history-entry__progress" aria-hidden="true">
          <span :style="{ width: `${progressPercent(entry)}%` }" />
        </div>
        <VideoCard :video="entry.video" :index="index" />
      </article>
    </section>

    <PageState
      v-else
      icon="clock"
      title="暂无历史记录"
      description="打开任意视频详情页后，这里会记录最近观看和播放进度。"
      action-icon="home"
      action-label="返回首页"
      @action="navigateTo('/')"
    />
  </div>
</template>

<style scoped>
.history-state {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  padding: 16px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(224px, 1fr));
  gap: 18px 16px;
}

.history-entry {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.history-entry__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.history-entry__time,
.history-entry__progress-label {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 700;
  padding: 5px 8px;
}

.history-entry__progress-label {
  color: var(--aoi-accent-60);
}

.history-entry__progress {
  overflow: hidden;
  height: 5px;
  border-radius: 999px;
  background: var(--aoi-border);
}

.history-entry__progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--aoi-accent-50), var(--aoi-accent-60));
}

@media (max-width: 639px) {
  .history-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 10px;
  }
}
</style>

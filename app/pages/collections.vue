<script setup lang="ts">
const library = useLibraryStore()
const activeTab = ref("favorites")

const tabItems = [
  { icon: "star", label: "收藏", value: "favorites" },
  { icon: "clock-3", label: "稍后看", value: "watchLater" }
]

const activeVideos = computed(() => activeTab.value === "favorites"
  ? library.favoriteList
  : library.watchLaterList)

const hasVideos = computed(() => library.hydrated && activeVideos.value.length > 0)
const clearLabel = computed(() => activeTab.value === "favorites" ? "清空收藏" : "清空稍后看")
const emptyTitle = computed(() => activeTab.value === "favorites" ? "还没有收藏" : "稍后看为空")
const emptyDescription = computed(() => activeTab.value === "favorites"
  ? "在视频卡片或详情页点击收藏后会出现在这里。"
  : "把暂时没时间看的视频加入稍后看，就能在这里继续找回。")

function clearActiveList() {
  if (activeTab.value === "favorites") {
    library.clearFavorites()
    return
  }

  library.clearWatchLater()
}

useHead({
  title: "Collections - Aoi"
})
</script>

<template>
  <div class="aoi-page">
    <PageHeader
      icon="star"
      title="收藏"
      description="收藏和稍后看当前只保存在本地，未来可同步到 Go 后端用户资料库。"
    >
      <template #actions>
        <AoiButton
          variant="outlined"
          icon="trash-2"
          :disabled="!hasVideos"
          @click="clearActiveList"
        >
          {{ clearLabel }}
        </AoiButton>
      </template>
    </PageHeader>

    <AoiTabs
      v-model="activeTab"
      :items="tabItems"
      aria-label="收藏分类"
    />

    <div v-if="!library.hydrated" class="collections-state">
      <AoiProgress indeterminate />
    </div>

    <VideoGrid v-else-if="hasVideos" :videos="activeVideos" />

    <PageState
      v-else
      icon="star"
      :title="emptyTitle"
      :description="emptyDescription"
      action-icon="search"
      action-label="去搜索"
      @action="navigateTo('/search')"
    />
  </div>
</template>

<style scoped>
.collections-state {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  padding: 16px;
}
</style>

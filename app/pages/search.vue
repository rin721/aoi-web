<script setup lang="ts">
import type { SearchPayload } from "~/types/api"

type SearchTab = "all" | "videos" | "creators" | "categories"

const api = useAoiApi()
const route = useRoute()
const router = useRouter()

const query = ref(typeof route.query.q === "string" ? route.query.q : "")
const submittedQuery = computed(() => typeof route.query.q === "string" ? route.query.q.trim() : "")
const hasQuery = computed(() => submittedQuery.value.length > 0)
const activeTab = computed<SearchTab>({
  get: () => {
    const value = typeof route.query.type === "string" ? route.query.type : "all"

    return isSearchTab(value) ? value : "all"
  },
  set: (value) => {
    router.replace({
      path: "/search",
      query: {
        ...(submittedQuery.value ? { q: submittedQuery.value } : {}),
        ...(value === "all" ? {} : { type: value })
      }
    })
  }
})

const emptyResult: SearchPayload = {
  categories: {
    items: [],
    nextCursor: null
  },
  creators: {
    items: [],
    nextCursor: null
  },
  query: "",
  totalCount: 0,
  videos: {
    items: [],
    nextCursor: null
  }
}

const { data, error, pending, refresh } = useAsyncData("search-results", () => {
  if (!hasQuery.value) {
    return Promise.resolve(emptyResult)
  }

  return api.search({
    limit: 24,
    q: submittedQuery.value
  })
}, {
  default: () => emptyResult,
  watch: [submittedQuery]
})

const videos = computed(() => data.value.videos.items)
const creators = computed(() => data.value.creators.items)
const categories = computed(() => data.value.categories.items)
const totalCount = computed(() => data.value.totalCount)
const tabItems = computed(() => [
  { icon: "sparkles", label: `全部 ${totalCount.value}`, value: "all" },
  { icon: "play-square", label: `视频 ${videos.value.length}`, value: "videos" },
  { icon: "users", label: `创作者 ${creators.value.length}`, value: "creators" },
  { icon: "layout-grid", label: `分区 ${categories.value.length}`, value: "categories" }
])
const showVideos = computed(() => activeTab.value === "all" || activeTab.value === "videos")
const showCreators = computed(() => activeTab.value === "all" || activeTab.value === "creators")
const showCategories = computed(() => activeTab.value === "all" || activeTab.value === "categories")

watch(() => route.query.q, (value) => {
  query.value = typeof value === "string" ? value : ""
})

function submitSearch() {
  const nextQuery = query.value.trim()

  router.replace({
    path: "/search",
    query: nextQuery
      ? {
          q: nextQuery,
          ...(activeTab.value === "all" ? {} : { type: activeTab.value })
        }
      : {}
  })
}

function isSearchTab(value: string): value is SearchTab {
  return value === "all" || value === "videos" || value === "creators" || value === "categories"
}

useHead(() => ({
  title: submittedQuery.value ? `${submittedQuery.value} - Aoi Search` : "Search - Aoi"
}))
</script>

<template>
  <div class="aoi-page">
    <PageHeader
      icon="search"
      title="搜索"
      description="搜索视频、创作者、标签或分类。当前结果来自 Nuxt mock API。"
    />

    <div v-aoi-reveal="'rise'" class="search-toolbar">
      <AoiTextField
        v-model="query"
        label="搜索关键词"
        placeholder="例如：Aoi、设计、Go API"
        variant="outlined"
        @enter="submitSearch"
      />
      <AoiButton icon="search" @click="submitSearch">搜索</AoiButton>
    </div>

    <PageState
      v-if="!hasQuery"
      icon="sparkles"
      title="输入一个关键词开始探索"
      description="试试搜索 Aoi、设计、移动端或 Go API。"
    />

    <PageState
      v-else-if="error"
      icon="circle-alert"
      title="搜索失败"
      description="Mock API 返回异常，请重试。"
      action-icon="refresh-cw"
      action-label="重试"
      @action="refresh()"
    />

    <div v-else-if="pending" v-aoi-reveal class="search-state">
      <AoiProgress indeterminate />
    </div>

    <PageState
      v-else-if="totalCount === 0"
      icon="scan-search"
      title="没有找到结果"
      :description="`没有匹配「${submittedQuery}」的内容。`"
    />

    <section v-else v-aoi-reveal="'rise'" class="search-results" aria-labelledby="search-results-title">
      <div class="search-results__header">
        <h2 id="search-results-title" class="result-title">
          搜索结果
          <span>{{ totalCount }}</span>
        </h2>
        <AoiTabs
          v-model="activeTab"
          :items="tabItems"
          aria-label="搜索结果类型"
        />
      </div>

      <section
        v-if="showVideos && videos.length"
        class="result-section"
        aria-labelledby="search-videos-title"
      >
        <div class="result-section__title">
          <h3 id="search-videos-title">视频</h3>
          <span>{{ videos.length }}</span>
        </div>
        <VideoGrid :videos="videos" />
      </section>

      <section
        v-if="showCreators && creators.length"
        class="result-section"
        aria-labelledby="search-creators-title"
      >
        <div class="result-section__title">
          <h3 id="search-creators-title">创作者</h3>
          <span>{{ creators.length }}</span>
        </div>
        <div class="creator-grid">
          <AoiReveal
            v-for="(creator, index) in creators"
            :key="creator.id"
            class="result-card-reveal"
            :index="index"
          >
            <CreatorCard :creator="creator" />
          </AoiReveal>
        </div>
      </section>

      <section
        v-if="showCategories && categories.length"
        class="result-section"
        aria-labelledby="search-categories-title"
      >
        <div class="result-section__title">
          <h3 id="search-categories-title">分区</h3>
          <span>{{ categories.length }}</span>
        </div>
        <div class="category-grid">
          <AoiReveal
            v-for="(category, index) in categories"
            :key="category.id"
            class="result-card-reveal"
            :index="index"
          >
            <CategoryCard :category="category" />
          </AoiReveal>
        </div>
      </section>
    </section>
  </div>
</template>

<style scoped>
.search-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: end;
  margin: 0 0 18px;
}

.search-state {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  padding: 16px;
}

.search-results,
.result-section {
  display: grid;
  min-width: 0;
  gap: 14px;
}

.search-results__header {
  display: grid;
  gap: 10px;
  margin-bottom: 2px;
}

.result-title,
.result-section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--aoi-accent-60);
}

.result-title {
  font-size: 16px;
}

.result-section__title h3 {
  margin: 0;
  color: var(--aoi-text);
  font-size: 18px;
}

.result-title span,
.result-section__title span {
  display: inline-flex;
  min-width: 28px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-accent-60);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.creator-grid,
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.result-card-reveal {
  min-width: 0;
}

.search-results__header :deep(.aoi-tabs) {
  max-width: 100%;
  overflow-x: auto;
}

@media (max-width: 639px) {
  .search-toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .creator-grid,
  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>

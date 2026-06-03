<script setup lang="ts">
const api = useAoiApi()

const { data, pending, error, refresh } = useAsyncData("category-index", async () => {
  const [categories, videos] = await Promise.all([
    api.listCategories(),
    api.listVideos({ category: "home" })
  ])

  return { categories, videos: videos.items }
}, {
  default: () => ({ categories: [], videos: [] })
})

function countFor(slug: string) {
  if (slug === "home") {
    return data.value.videos.length
  }

  return data.value.videos.filter((video) => video.categories.some((category) => category.slug === slug)).length
}

useHead({
  title: "Categories - Aoi"
})
</script>

<template>
  <div class="aoi-page">
    <PageHeader
      icon="layout-grid"
      title="分类"
      description="按内容类型浏览 Aoi 社区的 mock feed。"
    />

    <PageState
      v-if="error"
      icon="circle-alert"
      title="分类加载失败"
      description="Mock API 返回异常，请重试。"
      action-icon="refresh-cw"
      action-label="重试"
      @action="refresh()"
    />

    <div v-else-if="pending" class="category-loading">
      <AoiProgress indeterminate />
    </div>

    <div v-else class="category-grid">
      <CategoryCard
        v-for="category in data.categories"
        :key="category.id"
        :category="category"
        :count="countFor(category.slug)"
      />
    </div>
  </div>
</template>

<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.category-loading {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  padding: 16px;
}
</style>

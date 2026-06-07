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
      v-if="!pending && error"
      icon="circle-alert"
      title="分类加载失败"
      description="Mock API 返回异常，请重试。"
      action-icon="refresh-cw"
      action-label="重试"
      @action="refresh()"
    />

    <div v-else-if="!pending" class="category-grid">
      <AoiReveal
        v-for="(category, index) in data.categories"
        :key="category.id"
        class="category-card-reveal"
        :index="index"
      >
        <CategoryCard
          :category="category"
          :count="countFor(category.slug)"
        />
      </AoiReveal>
    </div>
  </div>
</template>

<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.category-card-reveal {
  min-width: 0;
}
</style>

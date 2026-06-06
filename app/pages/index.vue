<script setup lang="ts">
const { t } = useI18n()
const {
  announcement,
  categories,
  error,
  pending,
  refresh,
  selectCategory,
  selectedCategory,
  videos
} = useHomeFeed()

useHead({
  title: "Aoi"
})
</script>

<template>
  <div>
    <BrandBand />

    <div class="aoi-page">
      <CategoryTabs
        v-model="selectedCategory"
        :categories="categories"
        @change="selectCategory"
      />

      <AnnouncementStrip :announcement="announcement" />

      <section v-aoi-reveal="'rise'" aria-labelledby="latest-title">
        <div class="home-section-head">
          <h2 id="latest-title" class="home-section-title">
            {{ t("home.latest") }}
            <span class="home-section-count">{{ videos.length }}</span>
          </h2>
          <div class="home-view-toggle" aria-label="视图模式">
            <AoiIconButton icon="grid-3x3" :label="t('home.gridView')" active variant="tonal" size="sm" />
            <AoiIconButton icon="list" :label="t('home.listView')" size="sm" />
          </div>
        </div>

        <div v-if="pending" v-aoi-reveal class="home-state">
          <AoiProgress type="linear" indeterminate />
        </div>

        <div v-else-if="error" v-aoi-reveal class="home-state home-state--error">
          <p>内容加载失败。</p>
          <AoiButton variant="tonal" icon="refresh-cw" @click="refresh()">重试</AoiButton>
        </div>

        <div v-else-if="videos.length === 0" v-aoi-reveal class="home-state">
          <p>该分类暂时没有内容。</p>
          <AoiButton variant="tonal" icon="rotate-ccw" @click="selectCategory('home')">返回首页</AoiButton>
        </div>

        <VideoGrid v-else :videos="videos" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 12px;
}

.home-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--aoi-accent-60);
  font-size: 16px;
  font-weight: 800;
}

.home-section-count {
  display: inline-flex;
  min-width: 28px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-accent-60);
  color: #fff;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding: 0 7px;
}

.home-view-toggle {
  display: inline-flex;
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  padding: 3px;
}

.home-state {
  display: grid;
  gap: 12px;
  align-items: center;
  justify-items: start;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  color: var(--aoi-text-muted);
  padding: 16px;
}

.home-state p {
  margin: 0;
}

.home-state--error {
  color: #9b1c1c;
}

@media (max-width: 639px) {
  .home-view-toggle {
    display: none;
  }
}
</style>

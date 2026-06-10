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

const demoButtonMode = ref("crop")
const demoButtonFeatures = ref<string[]>(["webp", "paste"])
const demoDate = ref("2026-06-10")
const demoTime = ref("09:30")
const demoStatus = ref("朴素按钮待触发")

const demoModeItems = [
  { label: "裁剪", value: "crop", icon: "crop" },
  { label: "压缩", value: "compress", icon: "archive" },
  { label: "发布", value: "publish", icon: "send" }
]

const demoFeatureItems = [
  { label: "WebP", value: "webp", icon: "file-type-2" },
  { label: "粘贴", value: "paste", icon: "clipboard" },
  { label: "键盘", value: "keyboard", icon: "keyboard" }
]

useHead({
  title: "Aoi"
})

function triggerPlainDemo() {
  demoStatus.value = `朴素按钮已触发：${demoDate.value} ${demoTime.value}`
}
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

      <AoiSection title="Aoi md 组件示例" description="按钮盒子、朴素按钮、日期时间与图片裁剪压缩都在这个首页容器里预览。" title-id="aoi-md-demo-title">
        <AoiSurface class="home-aoi-demo" surface="panel" padding="lg">
          <div class="home-aoi-demo__controls">
            <div class="home-aoi-demo__group">
              <span class="home-aoi-demo__label">单选按钮盒子</span>
              <AoiButtonBox v-model="demoButtonMode" :items="demoModeItems" aria-label="首页示例模式" />
              <span class="home-aoi-demo__value">当前：{{ demoButtonMode }}</span>
            </div>

            <div class="home-aoi-demo__group">
              <span class="home-aoi-demo__label">多选按钮盒子</span>
              <AoiButtonBox v-model="demoButtonFeatures" :items="demoFeatureItems" aria-label="首页示例能力" multiselect />
              <span class="home-aoi-demo__value">已选：{{ demoButtonFeatures.join("、") || "无" }}</span>
            </div>

            <div class="home-aoi-demo__group home-aoi-demo__group--inline">
              <AoiButton appearance="plain" intent="secondary" icon="sparkles" @click="triggerPlainDemo">朴素按钮</AoiButton>
              <span class="home-aoi-demo__value">{{ demoStatus }}</span>
            </div>

            <div class="home-aoi-demo__fields">
              <AoiDateField v-model="demoDate" label="日期" appearance="outlined" min="2026-01-01" max="2026-12-31" />
              <AoiTimeField v-model="demoTime" label="时间" appearance="outlined" step="300" />
            </div>
          </div>

          <div class="home-aoi-demo__image">
            <AoiImageClipboard
              label="图片裁剪压缩"
              aria-label="首页图片裁剪压缩示例"
              aspect-ratio="16:9"
              mode="dialog"
              :max-output-width="1280"
              :max-output-height="720"
              output-file-name="aoi-home-demo.webp"
            />
          </div>
        </AoiSurface>
      </AoiSection>

      <AoiSection :title="t('home.latest')" :count="videos.length" title-id="latest-title">
        <template #actions>
          <AoiActionBar class="home-view-toggle" surface size="sm" label="视图模式">
            <AoiIconButton icon="grid-3x3" :label="t('home.gridView')" active appearance="soft" size="sm" />
            <AoiIconButton icon="list" :label="t('home.listView')" size="sm" />
          </AoiActionBar>
        </template>

        <VideoGridSkeleton v-if="pending" />

        <PageState
          v-else-if="!pending && error"
          icon="circle-alert"
          title="内容加载失败"
          action-icon="refresh-cw"
          action-label="重试"
          @action="refresh()"
        />

        <PageState
          v-else-if="!pending && videos.length === 0"
          icon="inbox"
          title="该分类暂时没有内容"
          action-icon="rotate-ccw"
          action-label="返回首页"
          @action="selectCategory('home')"
        />

        <VideoGrid v-else-if="videos.length > 0" :videos="videos" />
      </AoiSection>
    </div>
  </div>
</template>

<style scoped>
.home-aoi-demo {
  display: grid;
  gap: 18px;
}

.home-aoi-demo__controls {
  display: grid;
  gap: 14px;
}

.home-aoi-demo__group {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.home-aoi-demo__group--inline {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
}

.home-aoi-demo__label,
.home-aoi-demo__value {
  color: var(--aoi-text-muted);
  font-size: .82rem;
  font-weight: 720;
}

.home-aoi-demo__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-aoi-demo__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.home-aoi-demo__image {
  display: grid;
  min-width: 0;
  gap: 12px;
}

@media (max-width: 639px) {
  .home-view-toggle {
    display: none;
  }

  .home-aoi-demo__group--inline,
  .home-aoi-demo__fields {
    grid-template-columns: 1fr;
  }
}
</style>

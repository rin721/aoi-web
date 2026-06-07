<script setup lang="ts">
const api = useAoiApi()
const following = useFollowingStore()

const { data: feed, error, pending, refresh } = useAsyncData("following-feed", () => api.getFollowingFeed())
const recommendedCreators = computed(() => feed.value?.creators.filter((creator) => !following.isFollowing(creator.id)) || [])

useHead({
  title: "Following - Aoi"
})
</script>

<template>
  <div class="aoi-page">
    <PageHeader
      icon="radio-tower"
      title="关注动态"
      description="关注流会在接入登录和 Go 后端后展示你订阅的创作者更新；当前提供 mock 预览。"
    />

    <PageState
      v-if="!pending && error"
      icon="cloud-alert"
      title="关注流加载失败"
      description="mock API 暂时没有返回关注流数据。"
      action-icon="refresh-cw"
      action-label="重试"
      @action="refresh()"
    />

    <template v-else-if="!pending && feed">
      <PageState
        v-if="!feed.authenticated && following.hydrated && following.followedCount === 0"
        icon="user-round-plus"
        title="关注流暂未登录"
        :description="feed.message || '接入认证后，这里会展示关注创作者的最新视频；现在也可以先用本地关注预览。'"
        action-icon="search"
        action-label="先去搜索"
        @action="navigateTo('/search')"
      />

      <section
        v-if="following.hydrated && following.followedList.length"
        v-aoi-reveal="'rise'"
        class="following-section"
        aria-labelledby="local-following-title"
      >
        <div class="following-section__header">
          <div>
            <h2 id="local-following-title">本地关注</h2>
            <p>保存在当前浏览器，未来可迁移到 Go 用户关系接口。</p>
          </div>
          <AoiButton variant="outlined" size="sm" icon="settings" to="/settings">管理缓存</AoiButton>
        </div>
        <div class="following-creators">
          <AoiReveal
            v-for="(creator, index) in following.followedList"
            :key="creator.id"
            class="following-card-reveal"
            :index="index"
          >
            <CreatorCard :creator="creator" />
          </AoiReveal>
        </div>
      </section>

      <section
        v-if="following.hydrated && following.latestVideos.length"
        v-aoi-reveal="'rise'"
        class="following-section"
        aria-labelledby="local-following-latest-title"
      >
        <div class="following-section__header">
          <h2 id="local-following-latest-title">本地关注更新</h2>
        </div>
        <VideoGrid :videos="following.latestVideos" />
      </section>

      <section v-if="recommendedCreators.length" v-aoi-reveal="'rise'" class="following-section" aria-labelledby="following-creators-title">
        <div class="following-section__header">
          <div>
            <h2 id="following-creators-title">推荐创作者</h2>
            <p>这些推荐来自 mock API，可直接关注到本地列表。</p>
          </div>
          <AoiButton variant="outlined" size="sm" icon="search" to="/search">探索更多</AoiButton>
        </div>
        <div class="following-creators">
          <AoiReveal
            v-for="(creator, index) in recommendedCreators"
            :key="creator.id"
            class="following-card-reveal"
            :index="index"
          >
            <CreatorCard :creator="creator" />
          </AoiReveal>
        </div>
      </section>

      <section v-if="feed.latest.items.length" v-aoi-reveal="'rise'" class="following-section" aria-labelledby="following-latest-title">
        <div class="following-section__header">
          <h2 id="following-latest-title">推荐更新</h2>
        </div>
        <VideoGrid :videos="feed.latest.items" />
      </section>
    </template>

    <PageState
      v-else-if="!pending"
      icon="user-round-plus"
      title="关注流暂无内容"
      description="没有拿到关注流预览数据。"
      action-icon="refresh-cw"
      action-label="重试"
      @action="refresh()"
    />
  </div>
</template>

<style scoped>
.following-section {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.following-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.following-section__header h2 {
  margin: 0;
  color: var(--aoi-text);
  font-size: 18px;
}

.following-section__header p {
  margin: 4px 0 0;
  color: var(--aoi-text-muted);
  line-height: 1.6;
}

.following-creators {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.following-card-reveal {
  min-width: 0;
}

@media (max-width: 639px) {
  .following-section__header {
    align-items: start;
    flex-direction: column;
  }

  .following-creators {
    grid-template-columns: 1fr;
  }
}
</style>

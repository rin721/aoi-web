<script setup lang="ts">
import type { CreatorProfile } from "~/types/api"

const props = withDefaults(defineProps<{
  creator: CreatorProfile
  showActions?: boolean
}>(), {
  showActions: true
})

const following = useFollowingStore()
const isFollowing = computed(() => following.isFollowing(props.creator.id))

function formatCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }

  return String(value)
}
</script>

<template>
  <article class="creator-card">
    <AoiLink class="creator-card__link" :to="`/u/${creator.handle}`" :aria-label="creator.displayName">
      <span class="creator-card__avatar" aria-hidden="true">
        {{ creator.displayName.slice(0, 1).toUpperCase() }}
      </span>
      <span class="creator-card__body">
        <span class="creator-card__name">{{ creator.displayName }}</span>
        <span class="creator-card__handle">@{{ creator.handle }}</span>
        <span v-if="creator.bio" class="creator-card__bio">{{ creator.bio }}</span>
        <span class="creator-card__stats">
          <span>
            <AoiIcon name="users" :size="13" decorative />
            {{ formatCount(creator.followerCount + (isFollowing ? 1 : 0)) }}
          </span>
          <span>
            <AoiIcon name="video" :size="13" decorative />
            {{ creator.videoCount }}
          </span>
        </span>
      </span>
    </AoiLink>

    <div v-if="showActions" class="creator-card__actions">
      <AoiButton
        variant="outlined"
        size="sm"
        :icon="isFollowing ? 'user-check' : 'user-plus'"
        :aria-label="isFollowing ? `取消关注 ${creator.displayName}` : `关注 ${creator.displayName}`"
        :disabled="!following.hydrated"
        @click="following.toggleCreator(creator)"
      >
        {{ isFollowing ? "已关注" : "关注" }}
      </AoiButton>
    </div>
  </article>
</template>

<style scoped>
.creator-card {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  box-shadow: var(--aoi-shadow-sm);
  padding: 14px;
  transform: translate3d(0, 0, 0);
  transition:
    transform var(--aoi-motion-base) var(--aoi-ease-out),
    box-shadow var(--aoi-motion-base) var(--aoi-ease-out);
  will-change: transform;
}

.creator-card__link {
  display: grid;
  min-width: 0;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  flex: 1;
}

.creator-card:hover {
  box-shadow: var(--aoi-shadow-md);
  transform: translate3d(0, -4px, 0);
}

.creator-card__avatar {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: var(--aoi-radius-sm);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.28), transparent),
    linear-gradient(135deg, var(--aoi-accent-40), var(--aoi-sakura-40));
  color: white;
  font-weight: 850;
}

.creator-card__body {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.creator-card__name {
  overflow: hidden;
  color: var(--aoi-text);
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.creator-card__handle,
.creator-card__bio,
.creator-card__stats {
  color: var(--aoi-text-muted);
  font-size: 12px;
}

.creator-card__bio {
  display: -webkit-box;
  overflow: hidden;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.creator-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.creator-card__stats span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.creator-card__actions {
  display: flex;
  flex: 0 0 auto;
}

@media (max-width: 639px) {
  .creator-card {
    align-items: stretch;
    flex-direction: column;
    padding: 12px;
  }

  .creator-card__link {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .creator-card__avatar {
    width: 42px;
    height: 42px;
  }

  .creator-card__actions {
    justify-content: flex-end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .creator-card {
    will-change: auto;
  }
}
</style>

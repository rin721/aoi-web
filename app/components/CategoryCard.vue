<script setup lang="ts">
import type { Category } from "~/types/api"

defineProps<{
  category: Category
  count?: number
}>()
</script>

<template>
  <AoiLink class="category-card" :to="`/category/${category.slug}`">
    <span class="category-card__swatch" :style="{ backgroundColor: category.accentColor || 'var(--aoi-accent-50)' }" />
    <span class="category-card__body">
      <span class="category-card__name">{{ category.name }}</span>
      <span v-if="category.description" class="category-card__description">{{ category.description }}</span>
    </span>
    <span v-if="typeof count === 'number'" class="category-card__count">{{ count }}</span>
  </AoiLink>
</template>

<style scoped>
.category-card {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-surface);
  box-shadow: var(--aoi-shadow-sm);
  color: var(--aoi-text);
  padding: 14px;
  transform: translate3d(0, 0, 0);
  transition:
    transform var(--aoi-motion-base) var(--aoi-ease-out),
    box-shadow var(--aoi-motion-base) var(--aoi-ease-out);
  will-change: transform;
}

.category-card:hover {
  box-shadow: var(--aoi-shadow-md);
  transform: translate3d(0, -4px, 0);
}

.category-card__swatch {
  width: 10px;
  height: 42px;
  border-radius: var(--aoi-radius-round);
}

.category-card__body {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.category-card__name {
  font-size: 16px;
  font-weight: 800;
}

.category-card__description {
  overflow: hidden;
  color: var(--aoi-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-card__count {
  display: inline-flex;
  min-width: 30px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-60);
  font-size: 12px;
  font-weight: 800;
}

@media (prefers-reduced-motion: reduce) {
  .category-card {
    will-change: auto;
  }
}
</style>

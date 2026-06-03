<script setup lang="ts">
import type { CommentSortMode, LocalComment } from "~/types/comments"

const props = withDefaults(defineProps<{
  comments: LocalComment[]
  hydrated?: boolean
  sortMode?: CommentSortMode
}>(), {
  hydrated: false,
  sortMode: "newest"
})

const emit = defineEmits<{
  delete: [commentId: string]
  edit: [commentId: string, body: string]
  "update:sortMode": [value: CommentSortMode]
}>()

const sortValue = computed({
  get: () => props.sortMode,
  set: (value) => emit("update:sortMode", value as CommentSortMode)
})

const sortOptions = [
  { label: "最新优先", value: "newest" },
  { label: "最早优先", value: "oldest" }
]
</script>

<template>
  <section class="comment-thread" aria-labelledby="comment-thread-title">
    <div class="comment-thread__header">
      <div>
        <h2 id="comment-thread-title">讨论区</h2>
        <p>{{ comments.length }} 条本地评论</p>
      </div>
      <AoiSelect
        v-model="sortValue"
        class="comment-thread__sort"
        label="排序"
        variant="outlined"
        :options="sortOptions"
        :disabled="!hydrated || comments.length < 2"
      />
    </div>

    <div v-if="!hydrated" class="comment-thread__state">
      <AoiProgress indeterminate />
    </div>

    <PageState
      v-else-if="comments.length === 0"
      icon="message-circle"
      title="还没有本地评论"
      description="写下第一条讨论，刷新页面后也会保存在当前浏览器。"
    />

    <div v-else class="comment-thread__list">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        @delete="emit('delete', $event)"
        @edit="(commentId, body) => emit('edit', commentId, body)"
      />
    </div>
  </section>
</template>

<style scoped>
.comment-thread {
  display: grid;
  gap: 12px;
}

.comment-thread__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.comment-thread__header h2 {
  margin: 0;
  color: var(--aoi-text);
  font-size: 18px;
}

.comment-thread__header p {
  margin: 4px 0 0;
  color: var(--aoi-text-muted);
  font-size: 13px;
}

.comment-thread__sort {
  width: min(180px, 100%);
}

.comment-thread__state {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  padding: 14px;
}

.comment-thread__list {
  display: grid;
  gap: 10px;
}

@media (max-width: 620px) {
  .comment-thread__header {
    align-items: stretch;
    flex-direction: column;
  }

  .comment-thread__sort {
    width: 100%;
  }
}
</style>

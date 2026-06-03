<script setup lang="ts">
import type { LocalComment } from "~/types/comments"

const props = defineProps<{
  comment: LocalComment
}>()

const emit = defineEmits<{
  delete: [commentId: string]
  edit: [commentId: string, body: string]
}>()

const editing = ref(false)
const draft = ref(props.comment.body)

const canSave = computed(() => draft.value.trim().length > 0 && draft.value.length <= 500)
const isEdited = computed(() => props.comment.updatedAt !== props.comment.createdAt)

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  })
}

function startEdit() {
  draft.value = props.comment.body
  editing.value = true
}

function cancelEdit() {
  draft.value = props.comment.body
  editing.value = false
}

function saveEdit() {
  if (!canSave.value) {
    return
  }

  emit("edit", props.comment.id, draft.value.trim())
  editing.value = false
}
</script>

<template>
  <article class="comment-item">
    <div class="comment-item__avatar" aria-hidden="true">
      {{ comment.authorName.slice(0, 1).toUpperCase() }}
    </div>

    <div class="comment-item__content">
      <header class="comment-item__header">
        <div>
          <strong>{{ comment.authorName }}</strong>
          <span>{{ formatTime(comment.createdAt) }}</span>
          <small v-if="isEdited">已编辑</small>
        </div>
        <div class="comment-item__actions">
          <AoiButton v-if="!editing" variant="text" size="sm" icon="pencil" @click="startEdit">
            编辑
          </AoiButton>
          <AoiButton variant="text" size="sm" icon="trash-2" @click="emit('delete', comment.id)">
            删除
          </AoiButton>
        </div>
      </header>

      <template v-if="editing">
        <AoiTextField
          v-model="draft"
          variant="outlined"
          label="编辑评论"
          :max-length="500"
          :supporting-text="`${draft.length}/500`"
          :error-text="draft.length > 500 ? '评论内容过长' : undefined"
          multiline
          :rows="3"
        />
        <div class="comment-item__edit-actions">
          <AoiButton variant="outlined" size="sm" @click="cancelEdit">
            取消
          </AoiButton>
          <AoiButton size="sm" icon="check" :disabled="!canSave" @click="saveEdit">
            保存
          </AoiButton>
        </div>
      </template>

      <p v-else class="comment-item__body">{{ comment.body }}</p>
    </div>
  </article>
</template>

<style scoped>
.comment-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  padding: 14px;
}

.comment-item__avatar {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-70);
  font-weight: 800;
}

.comment-item__content {
  display: grid;
  min-width: 0;
  gap: 10px;
}

.comment-item__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.comment-item__header div:first-child {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}

.comment-item__header strong {
  color: var(--aoi-text);
}

.comment-item__header span,
.comment-item__header small {
  color: var(--aoi-text-muted);
  font-size: 12px;
}

.comment-item__actions,
.comment-item__edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.comment-item__body {
  margin: 0;
  color: var(--aoi-text);
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 620px) {
  .comment-item {
    grid-template-columns: 1fr;
  }

  .comment-item__header {
    flex-direction: column;
  }

  .comment-item__actions,
  .comment-item__edit-actions {
    justify-content: flex-start;
  }
}
</style>

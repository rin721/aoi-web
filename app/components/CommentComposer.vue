<script setup lang="ts">
const props = withDefaults(defineProps<{
  authorName: string
  disabled?: boolean
  maxAuthorLength?: number
  maxBodyLength?: number
}>(), {
  disabled: false,
  maxAuthorLength: 24,
  maxBodyLength: 500
})

const emit = defineEmits<{
  submit: [body: string]
  "update:authorName": [value: string]
}>()

const body = ref("")

const localAuthorName = computed({
  get: () => props.authorName,
  set: (value) => emit("update:authorName", value)
})

const trimmedBody = computed(() => body.value.trim())
const bodyLength = computed(() => body.value.length)
const isBodyTooLong = computed(() => bodyLength.value > props.maxBodyLength)
const canSubmit = computed(() => {
  return !props.disabled
    && localAuthorName.value.trim().length > 0
    && trimmedBody.value.length > 0
    && !isBodyTooLong.value
})

function submitComment() {
  if (!canSubmit.value) {
    return
  }

  emit("submit", trimmedBody.value)
  body.value = ""
}
</script>

<template>
  <form v-aoi-reveal="'rise'" class="comment-composer" @submit.prevent="submitComment">
    <div class="comment-composer__fields">
      <AoiTextField
        v-model="localAuthorName"
        variant="outlined"
        label="显示名称"
        :disabled="disabled"
        :max-length="maxAuthorLength"
      />
      <AoiTextField
        v-model="body"
        variant="outlined"
        label="写下你的想法"
        placeholder="保持友善，也欢迎补充观看笔记。"
        :disabled="disabled"
        :max-length="maxBodyLength"
        :supporting-text="`${bodyLength}/${maxBodyLength}`"
        :error-text="isBodyTooLong ? '评论内容过长' : undefined"
        multiline
        :rows="4"
      />
    </div>

    <div class="comment-composer__actions">
      <span class="comment-composer__hint">
        本地评论只保存在当前浏览器。
      </span>
      <AoiButton
        type="submit"
        icon="send"
        :disabled="!canSubmit"
      >
        发布评论
      </AoiButton>
    </div>
  </form>
</template>

<style scoped>
.comment-composer {
  display: grid;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  box-shadow: var(--aoi-shadow-sm);
  padding: 14px;
}

.comment-composer__fields {
  display: grid;
  gap: 12px;
}

.comment-composer__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.comment-composer__hint {
  color: var(--aoi-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 620px) {
  .comment-composer__actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

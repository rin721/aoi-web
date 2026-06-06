<script setup lang="ts">
const api = useAoiApi()
const drafts = useUploadDraftStore()
const tagInput = ref("")

const { data: categories, pending: categoriesPending } = useAsyncData(
  "upload-categories",
  () => api.listCategories(),
  { default: () => [] }
)

const activeDraft = computed(() => drafts.activeDraft)
const validation = computed(() => activeDraft.value
  ? drafts.validateDraft(activeDraft.value)
  : { missing: ["创建一个草稿"], ready: false, warnings: [] })
const categoryOptions = computed(() => categories.value
  .filter((category) => category.slug !== "home")
  .map((category) => ({ label: category.name, value: category.slug })))
const visibilityOptions = [
  { label: "公开", value: "public" },
  { label: "不公开链接", value: "unlisted" },
  { label: "私密草稿", value: "private" }
]
const statusLabel = computed(() => {
  if (!activeDraft.value) {
    return "无草稿"
  }

  return activeDraft.value.status === "queued-local" ? "已本地排队" : "草稿自动保存"
})
const selectedCategoryName = computed(() => {
  const slug = activeDraft.value?.categorySlug

  return categories.value.find((category) => category.slug === slug)?.name || "未选择"
})
const lastSavedLabel = computed(() => {
  if (!activeDraft.value) {
    return "暂无"
  }

  return new Date(activeDraft.value.updatedAt).toLocaleString("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit"
  })
})

const draftTitle = computed({
  get: () => activeDraft.value?.title || "",
  set: (value: string) => drafts.updateActiveDraft({ title: value })
})
const draftDescription = computed({
  get: () => activeDraft.value?.description || "",
  set: (value: string) => drafts.updateActiveDraft({ description: value })
})
const draftCategory = computed({
  get: () => activeDraft.value?.categorySlug || "design",
  set: (value: string) => drafts.updateActiveDraft({ categorySlug: value })
})
const draftVisibility = computed({
  get: () => activeDraft.value?.visibility || "public",
  set: (value: string) => {
    if (value === "public" || value === "unlisted" || value === "private") {
      drafts.updateActiveDraft({ visibility: value })
    }
  }
})
const allowComments = computed({
  get: () => activeDraft.value?.allowComments ?? true,
  set: (value: boolean) => drafts.updateActiveDraft({ allowComments: value })
})
const sensitive = computed({
  get: () => activeDraft.value?.sensitive ?? false,
  set: (value: boolean) => drafts.updateActiveDraft({ sensitive: value })
})

watch(() => drafts.hydrated, (hydrated) => {
  if (hydrated && !drafts.activeDraft) {
    drafts.createDraft()
  }
}, { immediate: true })

function onFileSelected(files: File[]) {
  const file = files[0]

  if (!file) {
    return
  }

  drafts.setActiveSource({
    name: file.name,
    size: file.size,
    type: file.type || "video/*"
  })
}

function addTag(event?: KeyboardEvent) {
  event?.preventDefault()

  const tag = tagInput.value.trim().replace(/^#/, "")

  if (!tag || !activeDraft.value) {
    return
  }

  drafts.updateActiveDraft({
    tags: [...activeDraft.value.tags, tag]
  })
  tagInput.value = ""
}

function removeTag(tag: string) {
  if (!activeDraft.value) {
    return
  }

  drafts.updateActiveDraft({
    tags: activeDraft.value.tags.filter((item) => item !== tag)
  })
}

function deleteActiveDraft() {
  if (activeDraft.value) {
    drafts.deleteDraft(activeDraft.value.id)
  }

  if (drafts.hydrated && !drafts.activeDraft) {
    drafts.createDraft()
  }
}

function formatBytes(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function selectDraft(id: string) {
  drafts.selectDraft(id)
}

useHead({
  title: "Upload - Aoi"
})
</script>

<template>
  <div class="aoi-page">
    <PageHeader
      icon="upload"
      title="投稿工作台"
      description="当前只保存浏览器本地草稿，帮助前端先跑通创作信息流；真实上传、审核和转码留给未来 Go 后端。"
    >
      <template #actions>
        <AoiButton
          variant="tonal"
          icon="file-plus-2"
          :disabled="!drafts.hydrated"
          @click="drafts.createDraft()"
        >
          新建草稿
        </AoiButton>
      </template>
    </PageHeader>

    <div v-if="!drafts.hydrated" class="upload-state">
      <AoiProgress indeterminate />
    </div>

    <div v-else class="upload-workspace">
      <main class="upload-workspace__main">
        <PageState
          v-if="!activeDraft"
          icon="file-plus-2"
          title="还没有投稿草稿"
          description="创建一个本地草稿后，可以先整理标题、分区、标签和可见性。"
          action-icon="file-plus-2"
          action-label="新建草稿"
          @action="drafts.createDraft()"
        />

        <template v-else>
          <section class="upload-panel upload-source">
            <div class="upload-panel__title">
              <h2>视频源</h2>
              <span>{{ statusLabel }}</span>
            </div>

            <div class="upload-source__drop">
              <div class="upload-source__icon" aria-hidden="true">
                <AoiIcon name="file-video" :size="28" decorative />
              </div>
              <div class="upload-source__copy">
                <strong>{{ activeDraft.source?.name || "选择一个视频文件" }}</strong>
                <span v-if="activeDraft.source">
                  {{ formatBytes(activeDraft.source.size) }} · {{ activeDraft.source.type || "video/*" }}
                </span>
                <span v-else>这里只读取文件名、大小和 MIME 类型，不上传文件内容。</span>
              </div>
              <AoiFileInput accept="video/*" @change="onFileSelected">
                <template #default="{ open }">
                  <AoiButton variant="outlined" icon="folder-open" @click="open">
                    {{ activeDraft.source ? "替换文件" : "选择文件" }}
                  </AoiButton>
                </template>
              </AoiFileInput>
            </div>
          </section>

          <section class="upload-panel">
            <div class="upload-panel__title">
              <h2>基础信息</h2>
              <span>自动保存 · {{ lastSavedLabel }}</span>
            </div>

            <div class="upload-form-grid">
              <AoiTextField
                v-model="draftTitle"
                label="标题"
                variant="outlined"
                placeholder="输入视频标题"
                supporting-text="至少 4 个字符"
              />
              <AoiSelect
                v-model="draftCategory"
                label="分区"
                variant="outlined"
                :disabled="categoriesPending"
                :options="categoryOptions"
              />
            </div>

            <AoiTextField
              v-model="draftDescription"
              label="简介"
              variant="outlined"
              placeholder="写一点这支视频的内容、亮点和适合谁看"
              supporting-text="本阶段只保存为本地草稿"
              multiline
              :rows="5"
              :max-length="600"
            />

            <div class="upload-form-grid">
              <AoiSelect
                v-model="draftVisibility"
                label="可见性"
                variant="outlined"
                :options="visibilityOptions"
              />
              <div class="upload-checks">
                <AoiCheckbox v-model="allowComments" label="允许评论" />
                <AoiCheckbox v-model="sensitive" label="含敏感内容标记" />
              </div>
            </div>

            <div class="upload-tags">
              <div class="upload-tags__input">
                <AoiTextField
                  v-model="tagInput"
                  label="标签"
                  variant="outlined"
                  placeholder="输入后按 Enter"
                  supporting-text="最多保存 8 个标签"
                  @enter="addTag"
                />
                <AoiButton variant="outlined" icon="plus" @click="addTag()">添加</AoiButton>
              </div>
              <div v-if="activeDraft.tags.length" class="upload-tags__list" aria-label="草稿标签">
                <AoiChip
                  v-for="tag in activeDraft.tags"
                  :key="tag"
                  :label="`# ${tag}`"
                  removable
                  :remove-label="`移除标签 ${tag}`"
                  @remove="removeTag(tag)"
                />
              </div>
            </div>
          </section>

          <section class="upload-actions" aria-label="投稿草稿操作">
            <AoiButton
              variant="filled"
              icon="send"
              :disabled="!validation.ready"
              @click="drafts.queueActiveDraft()"
            >
              本地排队预览
            </AoiButton>
            <AoiButton variant="text" icon="trash-2" @click="deleteActiveDraft">
              删除当前草稿
            </AoiButton>
          </section>
        </template>
      </main>

      <aside class="upload-workspace__side">
        <section class="upload-panel">
          <div class="upload-panel__title">
            <h2>草稿</h2>
            <span>{{ drafts.draftCount }}</span>
          </div>

          <div class="draft-list" aria-label="投稿草稿列表">
            <AoiChoiceCard
              v-for="draft in drafts.draftList"
              :key="draft.id"
              :value="draft.id"
              :title="draft.title || '未命名草稿'"
              :description="`${draft.status === 'queued-local' ? '已本地排队' : '草稿'} · ${draft.tags.length} 标签`"
              variant="compact"
              :selected="draft.id === activeDraft?.id"
              @select="selectDraft"
            />
          </div>
        </section>

        <section class="upload-panel upload-preview">
          <div class="upload-panel__title">
            <h2>发布预检</h2>
            <span>{{ validation.ready ? "可排队" : "未完成" }}</span>
          </div>

          <div class="upload-preview__cover">
            <AoiIcon name="play" :size="30" decorative />
          </div>
          <h3>{{ activeDraft?.title || "未命名草稿" }}</h3>
          <p>{{ activeDraft?.description || "简介会显示在这里，帮助你检查内容卡片的第一印象。" }}</p>

          <dl class="upload-preview__meta">
            <div>
              <dt>分区</dt>
              <dd>{{ selectedCategoryName }}</dd>
            </div>
            <div>
              <dt>可见性</dt>
              <dd>{{ draftVisibility === "public" ? "公开" : draftVisibility === "unlisted" ? "不公开链接" : "私密草稿" }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{{ statusLabel }}</dd>
            </div>
          </dl>

          <div class="upload-checklist">
            <p v-if="validation.missing.length === 0" class="upload-checklist__ok">
              必填项已完成。
            </p>
            <p v-for="item in validation.missing" v-else :key="item">
              <AoiIcon name="circle-alert" :size="15" decorative />
              {{ item }}
            </p>
            <p v-for="item in validation.warnings" :key="item">
              <AoiIcon name="info" :size="15" decorative />
              {{ item }}
            </p>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.upload-state,
.upload-panel {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface);
  box-shadow: var(--aoi-shadow-sm);
}

.upload-state {
  padding: 16px;
}

.upload-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  align-items: start;
}

.upload-workspace__main,
.upload-workspace__side {
  display: grid;
  min-width: 0;
  gap: 14px;
}

.upload-panel {
  display: grid;
  min-width: 0;
  gap: 14px;
  padding: 16px;
}

.upload-panel__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.upload-panel__title h2 {
  margin: 0;
  font-size: 16px;
}

.upload-panel__title span,
.upload-source__copy span,
.upload-preview p,
.upload-preview__meta dt,
.upload-checklist p {
  color: var(--aoi-text-muted);
}

.upload-source__drop {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  border: 1px dashed rgba(34, 184, 207, 0.42);
  border-radius: var(--aoi-radius-sm);
  background: rgba(233, 251, 253, 0.58);
  padding: 14px;
}

.upload-source__icon {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-60);
}

.upload-source__copy,
.upload-preview__meta div,
.upload-checklist {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.upload-source__copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 260px);
  gap: 12px;
}

.upload-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
}

.upload-tags {
  display: grid;
  gap: 10px;
}

.upload-tags__input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.upload-tags__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.upload-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.draft-list {
  display: grid;
  gap: 8px;
}

.upload-preview__cover {
  display: grid;
  aspect-ratio: 16 / 9;
  place-items: center;
  border-radius: var(--aoi-radius-sm);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.22), transparent 45%),
    linear-gradient(135deg, #6de5e5, #5b8def 48%, #f2709c);
  color: #ffffff;
}

.upload-preview h3 {
  margin: 0;
  font-size: 18px;
  line-height: 1.35;
}

.upload-preview p {
  margin: 0;
  line-height: 1.7;
}

.upload-preview__meta {
  display: grid;
  gap: 8px;
  margin: 0;
}

.upload-preview__meta div {
  grid-template-columns: 72px minmax(0, 1fr);
  border-top: 1px solid var(--aoi-border);
  padding-top: 8px;
}

.upload-preview__meta dt,
.upload-preview__meta dd {
  margin: 0;
}

.upload-preview__meta dd {
  color: var(--aoi-text);
  font-weight: 750;
}

.upload-checklist {
  border-top: 1px solid var(--aoi-border);
  padding-top: 10px;
}

.upload-checklist p {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  line-height: 1.6;
}

.upload-checklist__ok {
  color: var(--aoi-accent-60) !important;
  font-weight: 750;
}

@media (max-width: 960px) {
  .upload-workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 639px) {
  .upload-panel {
    padding: 12px;
  }

  .upload-source__drop,
  .upload-form-grid,
  .upload-tags__input {
    grid-template-columns: 1fr;
  }

  .upload-source__drop {
    justify-items: start;
  }
}
</style>

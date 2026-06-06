<script setup lang="ts">
import type { AoiLightboxItem } from "~/types/lightbox"
import type { AoiRichTextChangePayload, AoiRichTextDocument } from "~/types/rich-text"

const { t } = useI18n()
const richTextMarkdown = ref(t("settings.experimental.richText.sample"))
const richTextDocument = ref<AoiRichTextDocument | null>(null)
const richTextPayload = ref<AoiRichTextChangePayload | null>(null)
const richTextPreviewTab = ref("markdown")

const lightboxItems = computed<AoiLightboxItem[]>(() => [
  {
    id: "aoi-sunflower",
    type: "image",
    src: "gradient:aoi-lightbox-sunflower",
    thumbnailSrc: "gradient:aoi-lightbox-sunflower-thumb",
    alt: t("settings.experimental.lightbox.items.sunflower.alt"),
    title: t("settings.experimental.lightbox.items.sunflower.title"),
    description: t("settings.experimental.lightbox.items.sunflower.description")
  },
  {
    id: "aoi-sakura",
    type: "image",
    src: "gradient:aoi-lightbox-sakura",
    thumbnailSrc: "gradient:aoi-lightbox-sakura-thumb",
    alt: t("settings.experimental.lightbox.items.sakura.alt"),
    title: t("settings.experimental.lightbox.items.sakura.title"),
    description: t("settings.experimental.lightbox.items.sakura.description")
  },
  {
    id: "aoi-sample-video",
    type: "video",
    src: "/media/aoi-sample.webm",
    posterSrc: "gradient:aoi-lightbox-video",
    thumbnailSrc: "gradient:aoi-lightbox-video-thumb",
    alt: t("settings.experimental.lightbox.items.video.alt"),
    title: t("settings.experimental.lightbox.items.video.title"),
    description: t("settings.experimental.lightbox.items.video.description")
  },
  {
    id: "aoi-night",
    type: "image",
    src: "gradient:aoi-lightbox-night",
    thumbnailSrc: "gradient:aoi-lightbox-night-thumb",
    alt: t("settings.experimental.lightbox.items.night.alt"),
    title: t("settings.experimental.lightbox.items.night.title"),
    description: t("settings.experimental.lightbox.items.night.description")
  }
])

const richTextPreviewTabs = computed(() => [
  { value: "markdown", label: t("settings.experimental.richText.preview.markdown"), icon: "file-text" },
  { value: "text", label: t("settings.experimental.richText.preview.text"), icon: "pilcrow" },
  { value: "json", label: t("settings.experimental.richText.preview.json"), icon: "braces" }
])
const richTextPlainText = computed(() => richTextPayload.value?.text || "")
const richTextDocumentPreview = computed(() => JSON.stringify(richTextDocument.value || {}, null, 2))

function updateRichTextPayload(payload: AoiRichTextChangePayload) {
  richTextPayload.value = payload
}
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      :title="t('settings.experimental.title')"
      :description="t('settings.experimental.description')"
    />

    <SettingsPanel
      icon="images"
      :title="t('settings.experimental.lightbox.title')"
      :description="t('settings.experimental.lightbox.description')"
    >
      <AoiLightboxGallery :items="lightboxItems" loop />
    </SettingsPanel>

    <SettingsPanel
      icon="file-pen-line"
      :title="t('settings.experimental.richText.title')"
      :description="t('settings.experimental.richText.description')"
    >
      <div class="rich-text-demo">
        <AoiRichTextEditor
          v-model="richTextMarkdown"
          v-model:document="richTextDocument"
          :label="t('settings.experimental.richText.editorLabel')"
          :placeholder="t('settings.experimental.richText.placeholder')"
          :supporting-text="t('settings.experimental.richText.supportingText')"
          :max-length="1800"
          @change="updateRichTextPayload"
        />

        <div class="rich-text-demo__preview">
          <div class="rich-text-demo__preview-header">
            <div>
              <h3>{{ t('settings.experimental.richText.preview.title') }}</h3>
              <p>
                {{ t('settings.experimental.richText.preview.meta', {
                  chars: richTextPayload?.characterCount || 0,
                  words: richTextPayload?.wordCount || 0
                }) }}
              </p>
            </div>
            <AoiTabs
              v-model="richTextPreviewTab"
              :items="richTextPreviewTabs"
              :aria-label="t('settings.experimental.richText.preview.ariaLabel')"
            />
          </div>

          <pre v-if="richTextPreviewTab === 'markdown'" class="rich-text-demo__output">{{ richTextMarkdown }}</pre>
          <pre v-else-if="richTextPreviewTab === 'text'" class="rich-text-demo__output">{{ richTextPlainText }}</pre>
          <pre v-else class="rich-text-demo__output">{{ richTextDocumentPreview }}</pre>
        </div>
      </div>
    </SettingsPanel>
  </div>
</template>

<style scoped>
.rich-text-demo {
  display: grid;
  min-width: 0;
  gap: 16px;
}

.rich-text-demo__preview {
  display: grid;
  min-width: 0;
  gap: 10px;
}

.rich-text-demo__preview-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.rich-text-demo__preview-header h3,
.rich-text-demo__preview-header p {
  margin: 0;
}

.rich-text-demo__preview-header h3 {
  font-size: 15px;
}

.rich-text-demo__preview-header p {
  color: var(--aoi-text-muted);
  line-height: 1.6;
}

.rich-text-demo__output {
  min-height: 180px;
  max-height: 360px;
  overflow: auto;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-surface-muted);
  color: var(--aoi-text);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 760px) {
  .rich-text-demo__preview-header {
    grid-template-columns: 1fr;
  }
}
</style>

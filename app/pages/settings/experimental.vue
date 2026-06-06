<script setup lang="ts">
import type { AoiLightboxItem } from "~/types/lightbox"

const { t } = useI18n()

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
  </div>
</template>

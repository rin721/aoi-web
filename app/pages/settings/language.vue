<script setup lang="ts">
import type { AoiLocale } from "~/stores/app-settings"

const settings = useAppSettingsStore()
const { locale, setLocale } = useI18n()

const localeOptions: Array<{
  description: string
  label: string
  nativeName: string
  value: AoiLocale
}> = [
  {
    description: "默认语言，适合当前内容和设计文案。",
    label: "简体中文",
    nativeName: "简体中文",
    value: "zh-CN"
  },
  {
    description: "English interface copy where available.",
    label: "英语",
    nativeName: "English",
    value: "en"
  },
  {
    description: "利用可能な範囲で日本語表示に切り替えます。",
    label: "日语",
    nativeName: "日本語",
    value: "ja"
  }
]

async function chooseLocale(value: AoiLocale) {
  settings.setLocalePreference(value)
  await setLocale(value)
}
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="语言"
      description="当前项目接入了三种语言。更多语言等 locale 文件完善后再开放。"
    />

    <SettingsPanel
      icon="languages"
      title="界面语言"
      description="切换后会立即应用，并保存到当前浏览器。"
    >
      <div class="settings-card-grid">
        <button
          v-for="item in localeOptions"
          :key="item.value"
          class="settings-language-card"
          :class="{ 'settings-language-card--active': locale === item.value }"
          type="button"
          @click="chooseLocale(item.value)"
        >
          <strong>{{ item.nativeName }}</strong>
          <span>{{ item.label }}</span>
          <small>{{ item.description }}</small>
        </button>
      </div>
    </SettingsPanel>
  </div>
</template>

<style scoped>
.settings-language-card {
  display: grid;
  min-height: 132px;
  gap: 6px;
  justify-items: start;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-md);
  background: var(--aoi-card-bg);
  color: var(--aoi-text);
  cursor: pointer;
  font: inherit;
  padding: 14px;
  text-align: left;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    border-color var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-press);
}

.settings-language-card:hover {
  background: var(--aoi-state-hover);
}

.settings-language-card:active {
  transform: scale(.98);
}

.settings-language-card--active {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
}

.settings-language-card strong {
  font-size: 18px;
  font-weight: 840;
}

.settings-language-card span,
.settings-language-card small {
  color: var(--aoi-text-muted);
  line-height: 1.55;
}
</style>

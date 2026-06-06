<script setup lang="ts">
import type { AoiBuildDefaultAppSettings } from "~/utils/aoiBuildDefaults"
import {
  AOI_BUILD_DEFAULT_CONFIG_PATHS,
  createAoiBuildDefaultFromAppSettings,
  createAoiOriginalBuildDefaultAppSettings,
  serializeAoiBuildDefaultConfig
} from "~/utils/aoiBuildDefaults"

interface DeveloperBuildDefaultsResponse {
  action: "restore" | "write"
  activePath: string
  bytes: number
  ok: boolean
  originalPath: string
  source: string
  updatedAt: string
}

const { t } = useI18n()
const settings = useAppSettingsStore()
const generatedSettings = ref<AoiBuildDefaultAppSettings>(createAoiBuildDefaultFromAppSettings(settings))
const busyAction = ref<"" | "copy" | "download" | "refresh" | "restore" | "write">("")
const errorMessage = ref("")
const statusMessage = ref("")
const lastUpdatedAt = ref("")
const isDevBuild = import.meta.dev
const statusStorageKey = "aoi.developerBuildDefaultsStatus"

const generatedConfig = computed(() => serializeAoiBuildDefaultConfig(generatedSettings.value))
const generatedBytes = computed(() => new TextEncoder().encode(generatedConfig.value).length)
const runtimeModeLabel = computed(() => isDevBuild ? t("settings.developer.status.development") : t("settings.developer.status.production"))
const statusItems = computed(() => [
  {
    label: t("settings.developer.status.runtimeMode"),
    value: runtimeModeLabel.value
  },
  {
    label: t("settings.developer.status.activePath"),
    value: AOI_BUILD_DEFAULT_CONFIG_PATHS.active
  },
  {
    label: t("settings.developer.status.originalPath"),
    value: AOI_BUILD_DEFAULT_CONFIG_PATHS.original
  },
  {
    label: t("settings.developer.status.generatedSize"),
    value: `${generatedBytes.value} B`
  }
])

useHead(() => ({
  title: `${t("settings.developer.title")} - Aoi`
}))

onMounted(() => {
  try {
    const raw = window.sessionStorage.getItem(statusStorageKey)

    if (!raw) {
      return
    }

    const status = JSON.parse(raw) as { message?: string, updatedAt?: string }

    if (status.message) {
      statusMessage.value = status.message
    }

    if (status.updatedAt) {
      lastUpdatedAt.value = new Date(status.updatedAt).toLocaleString()
    }
  } catch {
    // The status handoff is optional; ignore malformed session data.
  } finally {
    window.sessionStorage.removeItem(statusStorageKey)
  }
})

function setStatus(message: string) {
  statusMessage.value = message
  errorMessage.value = ""
}

function setError(message: string) {
  errorMessage.value = message
  statusMessage.value = ""
}

function rememberStatusAfterReload(message: string, updatedAt = new Date().toISOString()) {
  window.sessionStorage.setItem(statusStorageKey, JSON.stringify({ message, updatedAt }))
}

function forgetStatusAfterReload() {
  window.sessionStorage.removeItem(statusStorageKey)
}

function refreshGeneratedSettings() {
  busyAction.value = "refresh"
  generatedSettings.value = createAoiBuildDefaultFromAppSettings(settings)
  setStatus(t("settings.developer.messages.refreshed"))
  busyAction.value = ""
}

async function writeTextToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return
  } catch {
    // Fall back for local embedded browsers that do not grant Clipboard API access.
  }

  const textarea = document.createElement("textarea")

  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.inset = "0 auto auto 0"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()

  try {
    if (!document.execCommand("copy")) {
      throw new Error("copy failed")
    }
  } finally {
    document.body.removeChild(textarea)
  }
}

async function copyGeneratedConfig() {
  busyAction.value = "copy"

  try {
    await writeTextToClipboard(generatedConfig.value)
    setStatus(t("settings.developer.messages.copied"))
  } catch {
    setError(t("settings.developer.errors.copy"))
  } finally {
    busyAction.value = ""
  }
}

function downloadGeneratedConfig() {
  busyAction.value = "download"

  try {
    const blob = new Blob([generatedConfig.value], { type: "text/typescript;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "aoi-build-defaults.ts"
    link.click()
    URL.revokeObjectURL(url)
    setStatus(t("settings.developer.messages.downloaded"))
  } catch {
    setError(t("settings.developer.errors.download"))
  } finally {
    busyAction.value = ""
  }
}

async function requestBuildDefaultsWrite(action: "restore" | "write") {
  busyAction.value = action
  const successMessage = action === "restore"
    ? t("settings.developer.messages.restored")
    : t("settings.developer.messages.written")

  rememberStatusAfterReload(successMessage)

  try {
    const response = await $fetch<DeveloperBuildDefaultsResponse>("/api/developer/build-defaults", {
      method: "POST",
      body: action === "write"
        ? { action, settings: generatedSettings.value }
        : { action }
    })

    lastUpdatedAt.value = new Date(response.updatedAt).toLocaleString()

    if (action === "restore") {
      generatedSettings.value = createAoiOriginalBuildDefaultAppSettings()
      setStatus(successMessage)
    } else {
      setStatus(successMessage)
    }
  } catch {
    forgetStatusAfterReload()
    setError(action === "restore" ? t("settings.developer.errors.restore") : t("settings.developer.errors.write"))
  } finally {
    busyAction.value = ""
  }
}

function disableDeveloperMode() {
  settings.setDeveloperModeEnabled(false)
  navigateTo("/settings/about")
}
</script>

<template>
  <div class="settings-page">
    <PageState
      v-if="!settings.developerModeEnabled"
      icon="lock-keyhole"
      :title="t('settings.developer.locked.title')"
      :description="t('settings.developer.locked.description')"
      action-icon="sparkles"
      :action-label="t('settings.developer.locked.action')"
      @action="navigateTo('/settings/about')"
    />

    <template v-else>
      <SettingsPageHeader
        :title="t('settings.developer.title')"
        :description="t('settings.developer.description')"
      />

      <SettingsPanel
        icon="terminal"
        :title="t('settings.developer.status.title')"
        :description="t('settings.developer.status.description')"
      >
        <div class="settings-developer-stat-grid">
          <div
            v-for="item in statusItems"
            :key="item.label"
            class="settings-developer-stat"
          >
            <span>{{ item.label }}</span>
            <code>{{ item.value }}</code>
          </div>
        </div>

        <p v-if="lastUpdatedAt" class="settings-note">
          {{ t("settings.developer.status.updatedAt", { time: lastUpdatedAt }) }}
        </p>
      </SettingsPanel>

      <SettingsPanel
        icon="file-code-2"
        :title="t('settings.developer.generated.title')"
        :description="t('settings.developer.generated.description')"
      >
        <template #actions>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="refresh-cw"
            :disabled="Boolean(busyAction)"
            :loading="busyAction === 'refresh'"
            @click="refreshGeneratedSettings"
          >
            {{ t("settings.developer.actions.refresh") }}
          </AoiButton>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="copy"
            :disabled="Boolean(busyAction)"
            :loading="busyAction === 'copy'"
            @click="copyGeneratedConfig"
          >
            {{ t("settings.developer.actions.copy") }}
          </AoiButton>
          <AoiButton
            variant="outlined"
            size="sm"
            icon="download"
            :disabled="Boolean(busyAction)"
            :loading="busyAction === 'download'"
            @click="downloadGeneratedConfig"
          >
            {{ t("settings.developer.actions.download") }}
          </AoiButton>
        </template>

        <pre class="settings-developer-code" tabindex="0"><code>{{ generatedConfig }}</code></pre>
      </SettingsPanel>

      <SettingsPanel
        icon="wrench"
        :title="t('settings.developer.source.title')"
        :description="t('settings.developer.source.description')"
      >
        <div class="settings-developer-actions">
          <AoiButton
            icon="save"
            :disabled="!isDevBuild || Boolean(busyAction)"
            :loading="busyAction === 'write'"
            @click="requestBuildDefaultsWrite('write')"
          >
            {{ t("settings.developer.actions.write") }}
          </AoiButton>
          <AoiButton
            variant="outlined"
            icon="rotate-ccw"
            :disabled="!isDevBuild || Boolean(busyAction)"
            :loading="busyAction === 'restore'"
            @click="requestBuildDefaultsWrite('restore')"
          >
            {{ t("settings.developer.actions.restore") }}
          </AoiButton>
          <AoiButton
            variant="text"
            icon="power"
            :disabled="Boolean(busyAction)"
            @click="disableDeveloperMode"
          >
            {{ t("settings.developer.actions.disable") }}
          </AoiButton>
        </div>

        <p class="settings-note">
          {{ isDevBuild ? t("settings.developer.source.devNote") : t("settings.developer.source.productionNote") }}
        </p>
        <p v-if="statusMessage" class="settings-developer-message settings-developer-message--success">
          {{ statusMessage }}
        </p>
        <p v-if="errorMessage" class="settings-developer-message settings-developer-message--error">
          {{ errorMessage }}
        </p>
      </SettingsPanel>
    </template>
  </div>
</template>

<style scoped>
.settings-developer-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.settings-developer-stat {
  display: grid;
  min-width: 0;
  gap: 6px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-card-bg);
  padding: 12px;
}

.settings-developer-stat span {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 740;
}

.settings-developer-stat code {
  overflow-wrap: anywhere;
  color: var(--aoi-accent-60);
  font-size: 12px;
  line-height: 1.5;
}

.settings-developer-code {
  max-height: 480px;
  overflow: auto;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: color-mix(in srgb, var(--aoi-bg) 84%, black 4%);
  color: var(--aoi-text);
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  padding: 14px;
  white-space: pre;
}

.settings-developer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.settings-developer-message {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  font-weight: 760;
  margin: 0;
  padding: 10px 12px;
}

.settings-developer-message--success {
  border-color: color-mix(in srgb, var(--aoi-success) 28%, var(--aoi-border));
  background: color-mix(in srgb, var(--aoi-success) 10%, transparent);
  color: var(--aoi-success);
}

.settings-developer-message--error {
  border-color: color-mix(in srgb, var(--aoi-danger) 28%, var(--aoi-border));
  background: color-mix(in srgb, var(--aoi-danger) 10%, transparent);
  color: var(--aoi-danger);
}
</style>

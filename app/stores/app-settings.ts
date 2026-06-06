export type AoiPreferredTheme = "system" | "light" | "dark"
export type AoiAccentMode = "preset" | "custom"
export type AoiDataMode = "economy" | "standard" | "turbo"
export type AoiLocale = "zh-CN" | "en" | "ja"
export type AoiAppearanceDensity = "comfortable" | "compact"
export type AoiAppearanceSize = "small" | "default" | "large"
export type AoiAppearanceShape = "square" | "soft" | "pill"
export type AoiAppearanceContrast = "normal" | "high"

export interface AoiAccentScale {
  accent10: string
  accent20: string
  accent40: string
  accent50: string
  accent60: string
}

export interface AoiAccentPresetOption extends AoiAccentScale {
  value: string
  label: string
  subtitle: string
}

interface PersistedAppSettings {
  accentMode: AoiAccentMode
  accentPreset: string
  appearanceContrast: AoiAppearanceContrast
  appearanceDensity: AoiAppearanceDensity
  appearanceShape: AoiAppearanceShape
  appearanceSize: AoiAppearanceSize
  backgroundBlur: number
  backgroundDim: number
  backgroundFileName: string
  backgroundFileSize: number
  backgroundImageId: string | null
  backgroundOpacity: number
  colorfulNavigation: boolean
  customAccent: string
  dataMode: AoiDataMode
  disableWatchHistory: boolean
  hideRecentSearches: boolean
  locale: AoiLocale
  noRelatedVideos: boolean
  noSearchRecommendations: boolean
  openVideosInNewTab: boolean
  preferredTheme: AoiPreferredTheme
  selectedCategory: string
  useRelativeDates: boolean
}

export const AOI_BACKGROUND_DB_NAME = "aoi-settings"
export const AOI_BACKGROUND_STORE_NAME = "backgrounds"
export const AOI_BACKGROUND_CURRENT_KEY = "aoi.background.current"
export const AOI_BACKGROUND_MAX_BYTES = 8 * 1024 * 1024
export const AOI_BACKGROUND_TYPES = ["image/png", "image/jpeg", "image/webp"]

export const AOI_ACCENT_PRESETS: AoiAccentPresetOption[] = [
  {
    value: "sunflower-orange",
    label: "葵花橙",
    subtitle: "Sunflower Orange",
    accent60: "#ff7d52",
    accent50: "#ff9471",
    accent40: "#ffb49b",
    accent20: "#ffe0d5",
    accent10: "#fff2ee"
  },
  {
    value: "cocoa-pink",
    label: "心爱粉",
    subtitle: "Cocoa Rose",
    accent60: "#d94f8f",
    accent50: "#f2709c",
    accent40: "#f69bb9",
    accent20: "#ffd6e5",
    accent10: "#fff1f7"
  },
  {
    value: "chino-blue",
    label: "智乃蓝",
    subtitle: "Chino Clear",
    accent60: "#0f9fb7",
    accent50: "#22b8cf",
    accent40: "#5ed3df",
    accent20: "#c9f3f7",
    accent10: "#e9fbfd"
  },
  {
    value: "rize-purple",
    label: "理世紫",
    subtitle: "Rize Violet",
    accent60: "#6f62d9",
    accent50: "#897df1",
    accent40: "#aaa2f7",
    accent20: "#ddd9ff",
    accent10: "#f3f1ff"
  },
  {
    value: "chiya-green",
    label: "千夜绿",
    subtitle: "Chiya Matcha",
    accent60: "#3f9c75",
    accent50: "#5fc795",
    accent40: "#8eddb8",
    accent20: "#d6f3e5",
    accent10: "#effbf5"
  },
  {
    value: "syaro-yellow",
    label: "纱路黄",
    subtitle: "Syaro Honey",
    accent60: "#c98b14",
    accent50: "#f7b955",
    accent40: "#ffd47f",
    accent20: "#ffedc7",
    accent10: "#fff8e8"
  },
  {
    value: "maya-cyan",
    label: "麻耶青",
    subtitle: "Maya Aqua",
    accent60: "#0e89a6",
    accent50: "#2eb6d6",
    accent40: "#72d8ea",
    accent20: "#d2f4fb",
    accent10: "#eefcff"
  },
  {
    value: "megumi-red",
    label: "小惠红",
    subtitle: "Megu Berry",
    accent60: "#d04758",
    accent50: "#f36f7e",
    accent40: "#f89aa5",
    accent20: "#ffd8de",
    accent10: "#fff1f3"
  }
]

const STORAGE_KEY = "aoi.appSettings.v1"
const DEFAULT_ACCENT_PRESET = "sunflower-orange"
const DEFAULT_ACCENT = "#ff7d52"
const DEFAULT_ACCENT_PRESET_OPTION = AOI_ACCENT_PRESETS.find((preset) => preset.value === DEFAULT_ACCENT_PRESET) || AOI_ACCENT_PRESETS[0]!

function emptyState(): PersistedAppSettings {
  return {
    accentMode: "preset",
    accentPreset: DEFAULT_ACCENT_PRESET,
    appearanceContrast: "normal",
    appearanceDensity: "comfortable",
    appearanceShape: "soft",
    appearanceSize: "default",
    backgroundBlur: 0,
    backgroundDim: 0.18,
    backgroundFileName: "",
    backgroundFileSize: 0,
    backgroundImageId: null,
    backgroundOpacity: 0.56,
    colorfulNavigation: false,
    customAccent: DEFAULT_ACCENT,
    dataMode: "standard",
    disableWatchHistory: false,
    hideRecentSearches: false,
    locale: "zh-CN",
    noRelatedVideos: false,
    noSearchRecommendations: false,
    openVideosInNewTab: false,
    preferredTheme: "system",
    selectedCategory: "home",
    useRelativeDates: false
  }
}

function coercePersistedState(value: unknown): PersistedAppSettings {
  const fallback = emptyState()

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback
  }

  const candidate = value as Partial<PersistedAppSettings>

  return {
    accentMode: candidate.accentMode === "custom" ? "custom" : "preset",
    accentPreset: isAccentPreset(candidate.accentPreset) ? candidate.accentPreset : fallback.accentPreset,
    appearanceContrast: isAppearanceContrast(candidate.appearanceContrast) ? candidate.appearanceContrast : fallback.appearanceContrast,
    appearanceDensity: isAppearanceDensity(candidate.appearanceDensity) ? candidate.appearanceDensity : fallback.appearanceDensity,
    appearanceShape: isAppearanceShape(candidate.appearanceShape) ? candidate.appearanceShape : fallback.appearanceShape,
    appearanceSize: isAppearanceSize(candidate.appearanceSize) ? candidate.appearanceSize : fallback.appearanceSize,
    backgroundBlur: clampNumber(candidate.backgroundBlur, 0, 24, fallback.backgroundBlur),
    backgroundDim: clampNumber(candidate.backgroundDim, 0, 0.9, fallback.backgroundDim),
    backgroundFileName: typeof candidate.backgroundFileName === "string" ? candidate.backgroundFileName : "",
    backgroundFileSize: clampNumber(candidate.backgroundFileSize, 0, AOI_BACKGROUND_MAX_BYTES, 0),
    backgroundImageId: typeof candidate.backgroundImageId === "string" ? candidate.backgroundImageId : null,
    backgroundOpacity: clampNumber(candidate.backgroundOpacity, 0, 1, fallback.backgroundOpacity),
    colorfulNavigation: Boolean(candidate.colorfulNavigation),
    customAccent: normalizeHex(candidate.customAccent, fallback.customAccent),
    dataMode: isDataMode(candidate.dataMode) ? candidate.dataMode : fallback.dataMode,
    disableWatchHistory: Boolean(candidate.disableWatchHistory),
    hideRecentSearches: Boolean(candidate.hideRecentSearches),
    locale: isLocale(candidate.locale) ? candidate.locale : fallback.locale,
    noRelatedVideos: Boolean(candidate.noRelatedVideos),
    noSearchRecommendations: Boolean(candidate.noSearchRecommendations),
    openVideosInNewTab: Boolean(candidate.openVideosInNewTab),
    preferredTheme: isPreferredTheme(candidate.preferredTheme) ? candidate.preferredTheme : fallback.preferredTheme,
    selectedCategory: typeof candidate.selectedCategory === "string" && candidate.selectedCategory ? candidate.selectedCategory : fallback.selectedCategory,
    useRelativeDates: Boolean(candidate.useRelativeDates)
  }
}

function isPreferredTheme(value: unknown): value is AoiPreferredTheme {
  return value === "system" || value === "light" || value === "dark"
}

function isDataMode(value: unknown): value is AoiDataMode {
  return value === "economy" || value === "standard" || value === "turbo"
}

function isLocale(value: unknown): value is AoiLocale {
  return value === "zh-CN" || value === "en" || value === "ja"
}

function isAppearanceDensity(value: unknown): value is AoiAppearanceDensity {
  return value === "comfortable" || value === "compact"
}

function isAppearanceSize(value: unknown): value is AoiAppearanceSize {
  return value === "small" || value === "default" || value === "large"
}

function isAppearanceShape(value: unknown): value is AoiAppearanceShape {
  return value === "square" || value === "soft" || value === "pill"
}

function isAppearanceContrast(value: unknown): value is AoiAppearanceContrast {
  return value === "normal" || value === "high"
}

function isAccentPreset(value: unknown): value is string {
  return typeof value === "string" && AOI_ACCENT_PRESETS.some((preset) => preset.value === value)
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(max, Math.max(min, value))
}

function normalizeHex(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback
  }

  const normalized = value.trim()

  if (/^#[\da-f]{6}$/i.test(normalized)) {
    return normalized.toLowerCase()
  }

  if (/^#[\da-f]{3}$/i.test(normalized)) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`.toLowerCase()
  }

  return fallback
}

function hexToRgb(hex: string) {
  const safe = normalizeHex(hex, DEFAULT_ACCENT).slice(1)
  const value = Number.parseInt(safe, 16)

  return {
    b: value & 255,
    g: value >> 8 & 255,
    r: value >> 16 & 255
  }
}

function componentToHex(value: number) {
  return Math.round(value).toString(16).padStart(2, "0")
}

function mixHex(from: string, to: string, amount: number) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const weight = Math.min(1, Math.max(0, amount))

  return `#${componentToHex(a.r + (b.r - a.r) * weight)}${componentToHex(a.g + (b.g - a.g) * weight)}${componentToHex(a.b + (b.b - a.b) * weight)}`
}

function scaleFromHex(hex: string): AoiAccentScale {
  const base = normalizeHex(hex, DEFAULT_ACCENT)

  return {
    accent10: mixHex(base, "#ffffff", 0.9),
    accent20: mixHex(base, "#ffffff", 0.76),
    accent40: mixHex(base, "#ffffff", 0.42),
    accent50: mixHex(base, "#ffffff", 0.18),
    accent60: base
  }
}

function openBackgroundDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(AOI_BACKGROUND_DB_NAME, 1)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(AOI_BACKGROUND_STORE_NAME)) {
        db.createObjectStore(AOI_BACKGROUND_STORE_NAME)
      }
    }
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function runBackgroundTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
) {
  return new Promise<T>((resolve, reject) => {
    openBackgroundDb()
      .then((db) => {
        const transaction = db.transaction(AOI_BACKGROUND_STORE_NAME, mode)
        const store = transaction.objectStore(AOI_BACKGROUND_STORE_NAME)
        const request = operation(store)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
        transaction.oncomplete = () => db.close()
        transaction.onerror = () => {
          db.close()
          reject(transaction.error)
        }
      })
      .catch(reject)
  })
}

async function readBackgroundBlob() {
  if (!import.meta.client || !("indexedDB" in window)) {
    return undefined
  }

  return await runBackgroundTransaction<Blob | undefined>("readonly", (store) => store.get(AOI_BACKGROUND_CURRENT_KEY))
}

async function writeBackgroundBlob(blob: Blob) {
  if (!import.meta.client || !("indexedDB" in window)) {
    return
  }

  await runBackgroundTransaction<IDBValidKey>("readwrite", (store) => store.put(blob, AOI_BACKGROUND_CURRENT_KEY))
}

async function deleteBackgroundBlob() {
  if (!import.meta.client || !("indexedDB" in window)) {
    return
  }

  await runBackgroundTransaction<undefined>("readwrite", (store) => store.delete(AOI_BACKGROUND_CURRENT_KEY))
}

export const useAppSettingsStore = defineStore("app-settings", () => {
  const hydrated = ref(false)
  const backgroundError = ref("")
  const backgroundObjectUrl = ref("")
  const selectedCategory = ref("home")
  const preferredTheme = ref<AoiPreferredTheme>("system")
  const locale = ref<AoiLocale>("zh-CN")
  const appearanceContrast = ref<AoiAppearanceContrast>("normal")
  const appearanceDensity = ref<AoiAppearanceDensity>("comfortable")
  const appearanceShape = ref<AoiAppearanceShape>("soft")
  const appearanceSize = ref<AoiAppearanceSize>("default")
  const accentMode = ref<AoiAccentMode>("preset")
  const accentPreset = ref(DEFAULT_ACCENT_PRESET)
  const customAccent = ref(DEFAULT_ACCENT)
  const backgroundImageId = ref<string | null>(null)
  const backgroundFileName = ref("")
  const backgroundFileSize = ref(0)
  const backgroundOpacity = ref(0.56)
  const backgroundBlur = ref(0)
  const backgroundDim = ref(0.18)
  const colorfulNavigation = ref(false)
  const openVideosInNewTab = ref(false)
  const useRelativeDates = ref(false)
  const dataMode = ref<AoiDataMode>("standard")
  const hideRecentSearches = ref(false)
  const disableWatchHistory = ref(false)
  const noSearchRecommendations = ref(false)
  const noRelatedVideos = ref(false)

  const activePreset = computed(() => {
    return AOI_ACCENT_PRESETS.find((preset) => preset.value === accentPreset.value) || DEFAULT_ACCENT_PRESET_OPTION
  })
  const activeAccent = computed(() => accentMode.value === "custom" ? normalizeHex(customAccent.value, DEFAULT_ACCENT) : activePreset.value.accent60)
  const accentScale = computed<AoiAccentScale>(() => {
    if (accentMode.value === "custom") {
      return scaleFromHex(customAccent.value)
    }

    return {
      accent10: activePreset.value.accent10,
      accent20: activePreset.value.accent20,
      accent40: activePreset.value.accent40,
      accent50: activePreset.value.accent50,
      accent60: activePreset.value.accent60
    }
  })

  function currentState(): PersistedAppSettings {
    return {
      accentMode: accentMode.value,
      accentPreset: accentPreset.value,
      appearanceContrast: appearanceContrast.value,
      appearanceDensity: appearanceDensity.value,
      appearanceShape: appearanceShape.value,
      appearanceSize: appearanceSize.value,
      backgroundBlur: backgroundBlur.value,
      backgroundDim: backgroundDim.value,
      backgroundFileName: backgroundFileName.value,
      backgroundFileSize: backgroundFileSize.value,
      backgroundImageId: backgroundImageId.value,
      backgroundOpacity: backgroundOpacity.value,
      colorfulNavigation: colorfulNavigation.value,
      customAccent: customAccent.value,
      dataMode: dataMode.value,
      disableWatchHistory: disableWatchHistory.value,
      hideRecentSearches: hideRecentSearches.value,
      locale: locale.value,
      noRelatedVideos: noRelatedVideos.value,
      noSearchRecommendations: noSearchRecommendations.value,
      openVideosInNewTab: openVideosInNewTab.value,
      preferredTheme: preferredTheme.value,
      selectedCategory: selectedCategory.value,
      useRelativeDates: useRelativeDates.value
    }
  }

  function assignState(state: PersistedAppSettings) {
    accentMode.value = state.accentMode
    accentPreset.value = state.accentPreset
    appearanceContrast.value = state.appearanceContrast
    appearanceDensity.value = state.appearanceDensity
    appearanceShape.value = state.appearanceShape
    appearanceSize.value = state.appearanceSize
    backgroundBlur.value = state.backgroundBlur
    backgroundDim.value = state.backgroundDim
    backgroundFileName.value = state.backgroundFileName
    backgroundFileSize.value = state.backgroundFileSize
    backgroundImageId.value = state.backgroundImageId
    backgroundOpacity.value = state.backgroundOpacity
    colorfulNavigation.value = state.colorfulNavigation
    customAccent.value = state.customAccent
    dataMode.value = state.dataMode
    disableWatchHistory.value = state.disableWatchHistory
    hideRecentSearches.value = state.hideRecentSearches
    locale.value = state.locale
    noRelatedVideos.value = state.noRelatedVideos
    noSearchRecommendations.value = state.noSearchRecommendations
    openVideosInNewTab.value = state.openVideosInNewTab
    preferredTheme.value = state.preferredTheme
    selectedCategory.value = state.selectedCategory
    useRelativeDates.value = state.useRelativeDates
  }

  function persist() {
    if (!import.meta.client || !hydrated.value) {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState()))
    } catch {
      // Local settings are optional in this frontend prototype.
    }
  }

  function revokeBackgroundObjectUrl() {
    if (backgroundObjectUrl.value && import.meta.client) {
      URL.revokeObjectURL(backgroundObjectUrl.value)
    }

    backgroundObjectUrl.value = ""
  }

  async function restoreBackgroundObjectUrl() {
    revokeBackgroundObjectUrl()

    if (!backgroundImageId.value || !import.meta.client) {
      return
    }

    try {
      const blob = await readBackgroundBlob()

      if (!blob) {
        backgroundImageId.value = null
        backgroundFileName.value = ""
        backgroundFileSize.value = 0
        return
      }

      backgroundObjectUrl.value = URL.createObjectURL(blob)
    } catch {
      backgroundImageId.value = null
      backgroundFileName.value = ""
      backgroundFileSize.value = 0
      backgroundError.value = "背景图读取失败，已恢复为默认背景。"
    }
  }

  async function restore() {
    if (!import.meta.client) {
      return
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      assignState(raw ? coercePersistedState(JSON.parse(raw)) : emptyState())
    } catch {
      assignState(emptyState())
    }

    await restoreBackgroundObjectUrl()
    hydrated.value = true
  }

  function setSelectedCategory(slug: string) {
    selectedCategory.value = slug
    persist()
  }

  function setPreferredTheme(theme: AoiPreferredTheme) {
    preferredTheme.value = theme
    persist()
  }

  function setLocalePreference(value: AoiLocale) {
    locale.value = value
    persist()
  }

  function setAppearanceDensity(value: AoiAppearanceDensity) {
    if (!isAppearanceDensity(value)) {
      return
    }

    appearanceDensity.value = value
    persist()
  }

  function setAppearanceSize(value: AoiAppearanceSize) {
    if (!isAppearanceSize(value)) {
      return
    }

    appearanceSize.value = value
    persist()
  }

  function setAppearanceShape(value: AoiAppearanceShape) {
    if (!isAppearanceShape(value)) {
      return
    }

    appearanceShape.value = value
    persist()
  }

  function setAppearanceContrast(value: AoiAppearanceContrast) {
    if (!isAppearanceContrast(value)) {
      return
    }

    appearanceContrast.value = value
    persist()
  }

  function setAccentPreset(value: string) {
    if (!isAccentPreset(value)) {
      return
    }

    accentPreset.value = value
    accentMode.value = "preset"
    persist()
  }

  function setCustomAccent(value: string) {
    customAccent.value = normalizeHex(value, customAccent.value)
    accentMode.value = "custom"
    persist()
  }

  async function setBackgroundFile(file: File) {
    backgroundError.value = ""

    if (!AOI_BACKGROUND_TYPES.includes(file.type)) {
      backgroundError.value = "请选择 PNG、JPG 或 WebP 图片。"
      return false
    }

    if (file.size > AOI_BACKGROUND_MAX_BYTES) {
      backgroundError.value = "背景图不能超过 8MB。"
      return false
    }

    try {
      await writeBackgroundBlob(file)
      backgroundImageId.value = AOI_BACKGROUND_CURRENT_KEY
      backgroundFileName.value = file.name
      backgroundFileSize.value = file.size
      revokeBackgroundObjectUrl()
      backgroundObjectUrl.value = URL.createObjectURL(file)
      persist()
      return true
    } catch {
      backgroundError.value = "背景图保存失败，请换一张更小的图片。"
      return false
    }
  }

  async function clearBackground() {
    backgroundError.value = ""

    try {
      await deleteBackgroundBlob()
    } catch {
      backgroundError.value = "背景图清理失败，但页面已恢复默认背景。"
    }

    revokeBackgroundObjectUrl()
    backgroundImageId.value = null
    backgroundFileName.value = ""
    backgroundFileSize.value = 0
    persist()
  }

  async function resetAppearance() {
    const next = emptyState()
    preferredTheme.value = next.preferredTheme
    accentMode.value = next.accentMode
    accentPreset.value = next.accentPreset
    appearanceContrast.value = next.appearanceContrast
    appearanceDensity.value = next.appearanceDensity
    appearanceShape.value = next.appearanceShape
    appearanceSize.value = next.appearanceSize
    customAccent.value = next.customAccent
    backgroundOpacity.value = next.backgroundOpacity
    backgroundBlur.value = next.backgroundBlur
    backgroundDim.value = next.backgroundDim
    colorfulNavigation.value = next.colorfulNavigation
    await clearBackground()
    persist()
  }

  async function resetAllAppSettings() {
    assignState(emptyState())
    await clearBackground()

    if (import.meta.client) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Local settings are optional in this frontend prototype.
      }
    }

    persist()
  }

  if (import.meta.client) {
    watch([
      preferredTheme,
      locale,
      appearanceContrast,
      appearanceDensity,
      appearanceShape,
      appearanceSize,
      accentMode,
      accentPreset,
      customAccent,
      backgroundImageId,
      backgroundFileName,
      backgroundFileSize,
      backgroundOpacity,
      backgroundBlur,
      backgroundDim,
      colorfulNavigation,
      openVideosInNewTab,
      useRelativeDates,
      dataMode,
      hideRecentSearches,
      disableWatchHistory,
      noSearchRecommendations,
      noRelatedVideos,
      selectedCategory
    ], persist, { flush: "sync" })
  }

  return {
    accentMode,
    accentPreset,
    accentScale,
    activeAccent,
    activePreset,
    appearanceContrast,
    appearanceDensity,
    appearanceShape,
    appearanceSize,
    backgroundBlur,
    backgroundDim,
    backgroundError,
    backgroundFileName,
    backgroundFileSize,
    backgroundImageId,
    backgroundObjectUrl,
    backgroundOpacity,
    clearBackground,
    colorfulNavigation,
    customAccent,
    dataMode,
    disableWatchHistory,
    hideRecentSearches,
    hydrated,
    locale,
    noRelatedVideos,
    noSearchRecommendations,
    openVideosInNewTab,
    persist,
    preferredTheme,
    resetAllAppSettings,
    resetAppearance,
    restore,
    selectedCategory,
    setAccentPreset,
    setAppearanceContrast,
    setAppearanceDensity,
    setAppearanceShape,
    setAppearanceSize,
    setBackgroundFile,
    setCustomAccent,
    setLocalePreference,
    setPreferredTheme,
    setSelectedCategory,
    useRelativeDates
  }
})

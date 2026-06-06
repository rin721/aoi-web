import type {
  AoiRevealMotionEffect as AoiRevealMotionEffectValue,
  AoiRevealMotionReplay as AoiRevealMotionReplayValue
} from "~/utils/aoiReveal"
import {
  AOI_REVEAL_DEFAULTS,
  clampAoiRevealSetting,
  isAoiRevealMotionEffect,
  isAoiRevealMotionReplay
} from "~/utils/aoiReveal"
import type {
  AoiPageScrollbarStrategy,
  AoiScrollHijackMode,
  AoiScrollSnapMode
} from "~/utils/aoiScroll"
import {
  AOI_SCROLL_DEFAULTS,
  clampAoiScrollSetting,
  isAoiPageScrollbarStrategy,
  isAoiScrollHijackMode,
  isAoiScrollSnapMode
} from "~/utils/aoiScroll"
import type {
  AoiSpecUnitKey,
  AoiSpecUnitSettings
} from "~/utils/aoiSpecUnits"
import {
  AOI_SPEC_UNIT_DEFAULTS,
  clampAoiSpecUnit,
  normalizeAoiSpecUnits
} from "~/utils/aoiSpecUnits"
import type { AoiRgbaColor } from "~/utils/aoiColor"
import {
  aoiRgbaToCss,
  mixAoiRgbaColor,
  normalizeAoiRgbaColor
} from "~/utils/aoiColor"

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
  customAccent: AoiRgbaColor
  dataMode: AoiDataMode
  disableWatchHistory: boolean
  hideRecentSearches: boolean
  locale: AoiLocale
  noRelatedVideos: boolean
  noSearchRecommendations: boolean
  openVideosInNewTab: boolean
  pageScrollbarStrategy: AoiPageScrollbarStrategy
  preferredTheme: AoiPreferredTheme
  revealMotionDistancePx: number
  revealMotionDurationMs: number
  revealMotionEffect: AoiRevealMotionEffectValue
  revealMotionEnabled: boolean
  revealMotionMaxDelayMs: number
  revealMotionReplay: AoiRevealMotionReplayValue
  revealMotionStaggerMs: number
  rubberBandEnabled: boolean
  rubberBandMaxOffsetPx: number
  rubberBandStrength: number
  scrollHijackEnabled: boolean
  scrollHijackMode: AoiScrollHijackMode
  scrollHijackThresholdPx: number
  scrollSnapEnabled: boolean
  scrollSnapMode: AoiScrollSnapMode
  scrollSnapStrength: number
  selectedCategory: string
  smoothScrollDamping: number
  smoothScrollDurationMs: number
  smoothScrollEnabled: boolean
  specUnits: AoiSpecUnitSettings
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
export const AOI_DEFAULT_CUSTOM_ACCENT: AoiRgbaColor = { r: 255, g: 125, b: 82, a: 1 }
const DEFAULT_ACCENT = AOI_DEFAULT_CUSTOM_ACCENT
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
    customAccent: { ...DEFAULT_ACCENT },
    dataMode: "standard",
    disableWatchHistory: false,
    hideRecentSearches: false,
    locale: "zh-CN",
    noRelatedVideos: false,
    noSearchRecommendations: false,
    openVideosInNewTab: false,
    pageScrollbarStrategy: AOI_SCROLL_DEFAULTS.pageScrollbar.strategy,
    preferredTheme: "system",
    revealMotionDistancePx: AOI_REVEAL_DEFAULTS.distancePx,
    revealMotionDurationMs: AOI_REVEAL_DEFAULTS.durationMs,
    revealMotionEffect: AOI_REVEAL_DEFAULTS.effect,
    revealMotionEnabled: AOI_REVEAL_DEFAULTS.enabled,
    revealMotionMaxDelayMs: AOI_REVEAL_DEFAULTS.maxDelayMs,
    revealMotionReplay: AOI_REVEAL_DEFAULTS.replay,
    revealMotionStaggerMs: AOI_REVEAL_DEFAULTS.staggerMs,
    rubberBandEnabled: AOI_SCROLL_DEFAULTS.rubberBand.enabled,
    rubberBandMaxOffsetPx: AOI_SCROLL_DEFAULTS.rubberBand.maxOffsetPx,
    rubberBandStrength: AOI_SCROLL_DEFAULTS.rubberBand.strength,
    scrollHijackEnabled: AOI_SCROLL_DEFAULTS.hijack.enabled,
    scrollHijackMode: AOI_SCROLL_DEFAULTS.hijack.mode,
    scrollHijackThresholdPx: AOI_SCROLL_DEFAULTS.hijack.thresholdPx,
    scrollSnapEnabled: AOI_SCROLL_DEFAULTS.snap.enabled,
    scrollSnapMode: AOI_SCROLL_DEFAULTS.snap.mode,
    scrollSnapStrength: AOI_SCROLL_DEFAULTS.snap.strength,
    selectedCategory: "home",
    smoothScrollDamping: AOI_SCROLL_DEFAULTS.smooth.damping,
    smoothScrollDurationMs: AOI_SCROLL_DEFAULTS.smooth.durationMs,
    smoothScrollEnabled: AOI_SCROLL_DEFAULTS.smooth.enabled,
    specUnits: { ...AOI_SPEC_UNIT_DEFAULTS },
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
    customAccent: normalizeAoiRgbaColor(candidate.customAccent, fallback.customAccent),
    dataMode: isDataMode(candidate.dataMode) ? candidate.dataMode : fallback.dataMode,
    disableWatchHistory: Boolean(candidate.disableWatchHistory),
    hideRecentSearches: Boolean(candidate.hideRecentSearches),
    locale: isLocale(candidate.locale) ? candidate.locale : fallback.locale,
    noRelatedVideos: Boolean(candidate.noRelatedVideos),
    noSearchRecommendations: Boolean(candidate.noSearchRecommendations),
    openVideosInNewTab: Boolean(candidate.openVideosInNewTab),
    pageScrollbarStrategy: isAoiPageScrollbarStrategy(candidate.pageScrollbarStrategy) ? candidate.pageScrollbarStrategy : fallback.pageScrollbarStrategy,
    preferredTheme: isPreferredTheme(candidate.preferredTheme) ? candidate.preferredTheme : fallback.preferredTheme,
    revealMotionDistancePx: clampAoiRevealSetting(candidate.revealMotionDistancePx, 0, 48, fallback.revealMotionDistancePx),
    revealMotionDurationMs: clampAoiRevealSetting(candidate.revealMotionDurationMs, 120, 800, fallback.revealMotionDurationMs),
    revealMotionEffect: isAoiRevealMotionEffect(candidate.revealMotionEffect) ? candidate.revealMotionEffect : fallback.revealMotionEffect,
    revealMotionEnabled: typeof candidate.revealMotionEnabled === "boolean" ? candidate.revealMotionEnabled : fallback.revealMotionEnabled,
    revealMotionMaxDelayMs: clampAoiRevealSetting(candidate.revealMotionMaxDelayMs, 0, 600, fallback.revealMotionMaxDelayMs),
    revealMotionReplay: isAoiRevealMotionReplay(candidate.revealMotionReplay) ? candidate.revealMotionReplay : fallback.revealMotionReplay,
    revealMotionStaggerMs: clampAoiRevealSetting(candidate.revealMotionStaggerMs, 0, 120, fallback.revealMotionStaggerMs),
    rubberBandEnabled: typeof candidate.rubberBandEnabled === "boolean" ? candidate.rubberBandEnabled : fallback.rubberBandEnabled,
    rubberBandMaxOffsetPx: clampAoiScrollSetting(candidate.rubberBandMaxOffsetPx, 8, 36, fallback.rubberBandMaxOffsetPx),
    rubberBandStrength: clampAoiScrollSetting(candidate.rubberBandStrength, 0, 100, fallback.rubberBandStrength),
    scrollHijackEnabled: typeof candidate.scrollHijackEnabled === "boolean" ? candidate.scrollHijackEnabled : fallback.scrollHijackEnabled,
    scrollHijackMode: isAoiScrollHijackMode(candidate.scrollHijackMode) ? candidate.scrollHijackMode : fallback.scrollHijackMode,
    scrollHijackThresholdPx: clampAoiScrollSetting(candidate.scrollHijackThresholdPx, 24, 180, fallback.scrollHijackThresholdPx),
    scrollSnapEnabled: typeof candidate.scrollSnapEnabled === "boolean" ? candidate.scrollSnapEnabled : fallback.scrollSnapEnabled,
    scrollSnapMode: isAoiScrollSnapMode(candidate.scrollSnapMode) ? candidate.scrollSnapMode : fallback.scrollSnapMode,
    scrollSnapStrength: clampAoiScrollSetting(candidate.scrollSnapStrength, 0, 100, fallback.scrollSnapStrength),
    selectedCategory: typeof candidate.selectedCategory === "string" && candidate.selectedCategory ? candidate.selectedCategory : fallback.selectedCategory,
    smoothScrollDamping: clampAoiScrollSetting(candidate.smoothScrollDamping, 0.04, 0.22, fallback.smoothScrollDamping),
    smoothScrollDurationMs: clampAoiScrollSetting(candidate.smoothScrollDurationMs, 600, 1800, fallback.smoothScrollDurationMs),
    smoothScrollEnabled: typeof candidate.smoothScrollEnabled === "boolean" ? candidate.smoothScrollEnabled : fallback.smoothScrollEnabled,
    specUnits: normalizeAoiSpecUnits(candidate.specUnits),
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

function mixRgbaWithWhite(color: AoiRgbaColor, amount: number) {
  const base = normalizeAoiRgbaColor(color, DEFAULT_ACCENT)
  const white = { r: 255, g: 255, b: 255, a: base.a }

  return aoiRgbaToCss(mixAoiRgbaColor(base, white, amount))
}

function scaleFromRgba(color: AoiRgbaColor): AoiAccentScale {
  const base = normalizeAoiRgbaColor(color, DEFAULT_ACCENT)

  return {
    accent10: mixRgbaWithWhite(base, 0.9),
    accent20: mixRgbaWithWhite(base, 0.76),
    accent40: mixRgbaWithWhite(base, 0.42),
    accent50: mixRgbaWithWhite(base, 0.18),
    accent60: aoiRgbaToCss(base)
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
  const customAccent = ref<AoiRgbaColor>({ ...DEFAULT_ACCENT })
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
  const pageScrollbarStrategy = ref<AoiPageScrollbarStrategy>(AOI_SCROLL_DEFAULTS.pageScrollbar.strategy)
  const revealMotionEnabled = ref(AOI_REVEAL_DEFAULTS.enabled)
  const revealMotionEffect = ref<AoiRevealMotionEffectValue>(AOI_REVEAL_DEFAULTS.effect)
  const revealMotionReplay = ref<AoiRevealMotionReplayValue>(AOI_REVEAL_DEFAULTS.replay)
  const revealMotionDurationMs = ref(AOI_REVEAL_DEFAULTS.durationMs)
  const revealMotionDistancePx = ref(AOI_REVEAL_DEFAULTS.distancePx)
  const revealMotionStaggerMs = ref(AOI_REVEAL_DEFAULTS.staggerMs)
  const revealMotionMaxDelayMs = ref(AOI_REVEAL_DEFAULTS.maxDelayMs)
  const smoothScrollEnabled = ref(AOI_SCROLL_DEFAULTS.smooth.enabled)
  const smoothScrollDurationMs = ref(AOI_SCROLL_DEFAULTS.smooth.durationMs)
  const smoothScrollDamping = ref(AOI_SCROLL_DEFAULTS.smooth.damping)
  const scrollSnapEnabled = ref(AOI_SCROLL_DEFAULTS.snap.enabled)
  const scrollSnapMode = ref<AoiScrollSnapMode>(AOI_SCROLL_DEFAULTS.snap.mode)
  const scrollSnapStrength = ref(AOI_SCROLL_DEFAULTS.snap.strength)
  const scrollHijackEnabled = ref(AOI_SCROLL_DEFAULTS.hijack.enabled)
  const scrollHijackMode = ref<AoiScrollHijackMode>(AOI_SCROLL_DEFAULTS.hijack.mode)
  const scrollHijackThresholdPx = ref(AOI_SCROLL_DEFAULTS.hijack.thresholdPx)
  const rubberBandEnabled = ref(AOI_SCROLL_DEFAULTS.rubberBand.enabled)
  const rubberBandStrength = ref(AOI_SCROLL_DEFAULTS.rubberBand.strength)
  const rubberBandMaxOffsetPx = ref(AOI_SCROLL_DEFAULTS.rubberBand.maxOffsetPx)
  const specUnits = reactive<AoiSpecUnitSettings>({ ...AOI_SPEC_UNIT_DEFAULTS })

  const activePreset = computed(() => {
    return AOI_ACCENT_PRESETS.find((preset) => preset.value === accentPreset.value) || DEFAULT_ACCENT_PRESET_OPTION
  })
  const activeAccent = computed(() => accentMode.value === "custom" ? aoiRgbaToCss(customAccent.value) : activePreset.value.accent60)
  const accentScale = computed<AoiAccentScale>(() => {
    if (accentMode.value === "custom") {
      return scaleFromRgba(customAccent.value)
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
      customAccent: { ...customAccent.value },
      dataMode: dataMode.value,
      disableWatchHistory: disableWatchHistory.value,
      hideRecentSearches: hideRecentSearches.value,
      locale: locale.value,
      noRelatedVideos: noRelatedVideos.value,
      noSearchRecommendations: noSearchRecommendations.value,
      openVideosInNewTab: openVideosInNewTab.value,
      pageScrollbarStrategy: pageScrollbarStrategy.value,
      preferredTheme: preferredTheme.value,
      revealMotionDistancePx: revealMotionDistancePx.value,
      revealMotionDurationMs: revealMotionDurationMs.value,
      revealMotionEffect: revealMotionEffect.value,
      revealMotionEnabled: revealMotionEnabled.value,
      revealMotionMaxDelayMs: revealMotionMaxDelayMs.value,
      revealMotionReplay: revealMotionReplay.value,
      revealMotionStaggerMs: revealMotionStaggerMs.value,
      rubberBandEnabled: rubberBandEnabled.value,
      rubberBandMaxOffsetPx: rubberBandMaxOffsetPx.value,
      rubberBandStrength: rubberBandStrength.value,
      scrollHijackEnabled: scrollHijackEnabled.value,
      scrollHijackMode: scrollHijackMode.value,
      scrollHijackThresholdPx: scrollHijackThresholdPx.value,
      scrollSnapEnabled: scrollSnapEnabled.value,
      scrollSnapMode: scrollSnapMode.value,
      scrollSnapStrength: scrollSnapStrength.value,
      selectedCategory: selectedCategory.value,
      smoothScrollDamping: smoothScrollDamping.value,
      smoothScrollDurationMs: smoothScrollDurationMs.value,
      smoothScrollEnabled: smoothScrollEnabled.value,
      specUnits: { ...specUnits },
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
    customAccent.value = normalizeAoiRgbaColor(state.customAccent, DEFAULT_ACCENT)
    dataMode.value = state.dataMode
    disableWatchHistory.value = state.disableWatchHistory
    hideRecentSearches.value = state.hideRecentSearches
    locale.value = state.locale
    noRelatedVideos.value = state.noRelatedVideos
    noSearchRecommendations.value = state.noSearchRecommendations
    openVideosInNewTab.value = state.openVideosInNewTab
    pageScrollbarStrategy.value = state.pageScrollbarStrategy
    preferredTheme.value = state.preferredTheme
    revealMotionDistancePx.value = state.revealMotionDistancePx
    revealMotionDurationMs.value = state.revealMotionDurationMs
    revealMotionEffect.value = state.revealMotionEffect
    revealMotionEnabled.value = state.revealMotionEnabled
    revealMotionMaxDelayMs.value = state.revealMotionMaxDelayMs
    revealMotionReplay.value = state.revealMotionReplay
    revealMotionStaggerMs.value = state.revealMotionStaggerMs
    rubberBandEnabled.value = state.rubberBandEnabled
    rubberBandMaxOffsetPx.value = state.rubberBandMaxOffsetPx
    rubberBandStrength.value = state.rubberBandStrength
    scrollHijackEnabled.value = state.scrollHijackEnabled
    scrollHijackMode.value = state.scrollHijackMode
    scrollHijackThresholdPx.value = state.scrollHijackThresholdPx
    scrollSnapEnabled.value = state.scrollSnapEnabled
    scrollSnapMode.value = state.scrollSnapMode
    scrollSnapStrength.value = state.scrollSnapStrength
    selectedCategory.value = state.selectedCategory
    smoothScrollDamping.value = state.smoothScrollDamping
    smoothScrollDurationMs.value = state.smoothScrollDurationMs
    smoothScrollEnabled.value = state.smoothScrollEnabled
    Object.assign(specUnits, normalizeAoiSpecUnits(state.specUnits))
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

  function setRevealMotionEffect(value: AoiRevealMotionEffectValue) {
    if (!isAoiRevealMotionEffect(value)) {
      return
    }

    revealMotionEffect.value = value
    persist()
  }

  function setRevealMotionReplay(value: AoiRevealMotionReplayValue) {
    if (!isAoiRevealMotionReplay(value)) {
      return
    }

    revealMotionReplay.value = value
    persist()
  }

  function setScrollSnapMode(value: AoiScrollSnapMode) {
    if (!isAoiScrollSnapMode(value)) {
      return
    }

    scrollSnapMode.value = value
    persist()
  }

  function setScrollHijackMode(value: AoiScrollHijackMode) {
    if (!isAoiScrollHijackMode(value)) {
      return
    }

    scrollHijackMode.value = value
    persist()
  }

  function setPageScrollbarStrategy(value: AoiPageScrollbarStrategy) {
    if (!isAoiPageScrollbarStrategy(value)) {
      return
    }

    pageScrollbarStrategy.value = value
    persist()
  }

  function setSpecUnit(key: AoiSpecUnitKey, value: number) {
    specUnits[key] = clampAoiSpecUnit(key, value)
    persist()
  }

  function resetSpecUnits() {
    Object.assign(specUnits, AOI_SPEC_UNIT_DEFAULTS)
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

  function setCustomAccent(value: AoiRgbaColor | string) {
    customAccent.value = normalizeAoiRgbaColor(value, customAccent.value)
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
    customAccent.value = { ...next.customAccent }
    backgroundOpacity.value = next.backgroundOpacity
    backgroundBlur.value = next.backgroundBlur
    backgroundDim.value = next.backgroundDim
    colorfulNavigation.value = next.colorfulNavigation
    pageScrollbarStrategy.value = next.pageScrollbarStrategy
    revealMotionDistancePx.value = next.revealMotionDistancePx
    revealMotionDurationMs.value = next.revealMotionDurationMs
    revealMotionEffect.value = next.revealMotionEffect
    revealMotionEnabled.value = next.revealMotionEnabled
    revealMotionMaxDelayMs.value = next.revealMotionMaxDelayMs
    revealMotionReplay.value = next.revealMotionReplay
    revealMotionStaggerMs.value = next.revealMotionStaggerMs
    rubberBandEnabled.value = next.rubberBandEnabled
    rubberBandMaxOffsetPx.value = next.rubberBandMaxOffsetPx
    rubberBandStrength.value = next.rubberBandStrength
    scrollHijackEnabled.value = next.scrollHijackEnabled
    scrollHijackMode.value = next.scrollHijackMode
    scrollHijackThresholdPx.value = next.scrollHijackThresholdPx
    scrollSnapEnabled.value = next.scrollSnapEnabled
    scrollSnapMode.value = next.scrollSnapMode
    scrollSnapStrength.value = next.scrollSnapStrength
    smoothScrollDamping.value = next.smoothScrollDamping
    smoothScrollDurationMs.value = next.smoothScrollDurationMs
    smoothScrollEnabled.value = next.smoothScrollEnabled
    Object.assign(specUnits, next.specUnits)
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
      pageScrollbarStrategy,
      revealMotionEnabled,
      revealMotionEffect,
      revealMotionReplay,
      revealMotionDurationMs,
      revealMotionDistancePx,
      revealMotionStaggerMs,
      revealMotionMaxDelayMs,
      smoothScrollEnabled,
      smoothScrollDurationMs,
      smoothScrollDamping,
      scrollSnapEnabled,
      scrollSnapMode,
      scrollSnapStrength,
      scrollHijackEnabled,
      scrollHijackMode,
      scrollHijackThresholdPx,
      rubberBandEnabled,
      rubberBandStrength,
      rubberBandMaxOffsetPx,
      () => ({ ...specUnits }),
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
    pageScrollbarStrategy,
    persist,
    preferredTheme,
    revealMotionDistancePx,
    revealMotionDurationMs,
    revealMotionEffect,
    revealMotionEnabled,
    revealMotionMaxDelayMs,
    revealMotionReplay,
    revealMotionStaggerMs,
    rubberBandEnabled,
    rubberBandMaxOffsetPx,
    rubberBandStrength,
    scrollHijackEnabled,
    scrollHijackMode,
    scrollHijackThresholdPx,
    scrollSnapEnabled,
    scrollSnapMode,
    scrollSnapStrength,
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
    setPageScrollbarStrategy,
    setPreferredTheme,
    setRevealMotionEffect,
    setRevealMotionReplay,
    setScrollHijackMode,
    setScrollSnapMode,
    setSelectedCategory,
    smoothScrollDamping,
    smoothScrollDurationMs,
    smoothScrollEnabled,
    specUnits,
    resetSpecUnits,
    setSpecUnit,
    useRelativeDates
  }
})

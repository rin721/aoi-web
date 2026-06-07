import { createAoiSpecCssVars } from "~/utils/aoiSpecUnits"

type I18nRuntime = {
  locale?: string | { value: string }
  setLocale?: (locale: string) => Promise<unknown> | unknown
}

export default defineNuxtPlugin((nuxtApp) => {
  const settings = useAppSettingsStore()
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)")

  async function applyLocale(locale: string) {
    const i18n = (nuxtApp as unknown as { $i18n?: I18nRuntime }).$i18n

    if (typeof i18n?.setLocale === "function") {
      await i18n.setLocale(locale)
      return
    }

    if (i18n?.locale && typeof i18n.locale === "object") {
      i18n.locale.value = locale
    }
  }

  function applySettings() {
    const shouldDark = settings.preferredTheme === "dark"
      || (settings.preferredTheme === "system" && prefersDark.matches)
    const root = document.documentElement
    const style = root.style

    root.classList.toggle("dark", shouldDark)
    root.dataset.aoiColorfulNav = settings.colorfulNavigation ? "true" : "false"
    root.dataset.aoiContrast = settings.appearanceContrast
    root.dataset.aoiDataMode = settings.dataMode
    root.dataset.aoiDanmaku = settings.danmakuEnabled ? "enabled" : "disabled"
    root.dataset.aoiDanmakuBottom = settings.danmakuBottomModeEnabled ? "enabled" : "disabled"
    root.dataset.aoiDanmakuScroll = settings.danmakuScrollModeEnabled ? "enabled" : "disabled"
    root.dataset.aoiDanmakuTop = settings.danmakuTopModeEnabled ? "enabled" : "disabled"
    root.dataset.aoiDensity = settings.appearanceDensity
    root.dataset.aoiPageScrollbar = settings.pageScrollbarStrategy
    root.dataset.aoiRevealEffect = settings.revealMotionEffect
    root.dataset.aoiRevealMotion = settings.revealMotionEnabled ? "enabled" : "disabled"
    root.dataset.aoiRevealReplay = settings.revealMotionReplay
    root.dataset.aoiRouteProgress = settings.routeProgressEnabled ? "enabled" : "disabled"
    root.dataset.aoiRouteProgressSpinner = settings.routeProgressShowSpinner ? "true" : "false"
    root.dataset.aoiRubberBand = root.dataset.aoiRubberBand || "idle"
    root.dataset.aoiRubberBandEdge = root.dataset.aoiRubberBandEdge || "none"
    root.dataset.aoiRubberBandMotion = settings.rubberBandEnabled ? "enabled" : "disabled"
    root.dataset.aoiScrollHijack = settings.scrollHijackEnabled ? "enabled" : "disabled"
    root.dataset.aoiScrollHijackMode = settings.scrollHijackMode
    root.dataset.aoiScrollSnap = settings.scrollSnapEnabled ? "enabled" : "disabled"
    root.dataset.aoiScrollSnapMode = settings.scrollSnapMode
    root.dataset.aoiSmoothScroll = settings.smoothScrollEnabled ? "enabled" : "disabled"
    root.dataset.aoiShape = settings.appearanceShape
    root.dataset.aoiSize = settings.appearanceSize

    const specVars = createAoiSpecCssVars(settings.specUnits, {
      density: settings.appearanceDensity,
      shape: settings.appearanceShape,
      size: settings.appearanceSize
    })

    Object.entries(specVars).forEach(([name, value]) => {
      style.setProperty(name, value)
    })

    style.setProperty("--aoi-accent-60", settings.accentScale.accent60)
    style.setProperty("--aoi-accent-50", settings.accentScale.accent50)
    style.setProperty("--aoi-accent-40", settings.accentScale.accent40)
    style.setProperty("--aoi-accent-20", settings.accentScale.accent20)
    style.setProperty("--aoi-accent-10", settings.accentScale.accent10)
    style.setProperty("--aoi-user-bg-image", settings.backgroundObjectUrl ? `url("${settings.backgroundObjectUrl}")` : "none")
    style.setProperty("--aoi-user-bg-opacity", settings.backgroundObjectUrl ? String(settings.backgroundOpacity) : "0")
    style.setProperty("--aoi-user-bg-blur", `${settings.backgroundBlur}px`)
    style.setProperty("--aoi-user-bg-dim", String(settings.backgroundObjectUrl ? settings.backgroundDim : 0))
    style.setProperty("--aoi-danmaku-font-scale", String(settings.danmakuFontScale))
    style.setProperty("--aoi-danmaku-opacity", String(settings.danmakuOpacity))
    style.setProperty("--aoi-danmaku-speed", String(settings.danmakuSpeed))
    style.setProperty("--aoi-danmaku-visible-area", `${settings.danmakuVisibleArea}%`)
    style.setProperty("--aoi-reveal-duration-setting", `${settings.revealMotionDurationMs}ms`)
    style.setProperty("--aoi-reveal-distance-setting", `${settings.revealMotionDistancePx}px`)
    style.setProperty("--aoi-reveal-stagger-setting", `${settings.revealMotionStaggerMs}ms`)
    style.setProperty("--aoi-reveal-max-delay-setting", `${settings.revealMotionMaxDelayMs}ms`)
    style.setProperty("--aoi-route-progress-height", `${settings.routeProgressHeightPx}px`)
    style.setProperty("--aoi-route-progress-speed", `${settings.routeProgressSpeedMs}ms`)
    style.setProperty("--aoi-route-progress-easing", settings.routeProgressEasing)
    style.setProperty("--aoi-page-rubber-band-max", `${settings.rubberBandMaxOffsetPx}px`)
    style.setProperty("--aoi-page-rubber-band-strength", String(settings.rubberBandStrength))
    style.setProperty("--aoi-scroll-hijack-threshold", `${settings.scrollHijackThresholdPx}px`)
    style.setProperty("--aoi-scroll-smooth-duration", `${settings.smoothScrollDurationMs}ms`)
    style.setProperty("--aoi-scroll-smooth-damping", String(settings.smoothScrollDamping))
    style.setProperty("--aoi-scroll-snap-strength", String(settings.scrollSnapStrength))
  }

  onNuxtReady(async () => {
    await settings.restore()
    await applyLocale(settings.locale)
    applySettings()

    watch(() => settings.locale, (value) => {
      void applyLocale(value)
    })
    watch(() => [
      settings.preferredTheme,
      settings.appearanceContrast,
      settings.appearanceDensity,
      settings.appearanceShape,
      settings.appearanceSize,
      settings.colorfulNavigation,
      settings.dataMode,
      settings.danmakuBottomModeEnabled,
      settings.danmakuEnabled,
      settings.danmakuFontScale,
      settings.danmakuOpacity,
      settings.danmakuScrollModeEnabled,
      settings.danmakuSpeed,
      settings.danmakuTopModeEnabled,
      settings.danmakuVisibleArea,
      settings.accentScale.accent10,
      settings.accentScale.accent20,
      settings.accentScale.accent40,
      settings.accentScale.accent50,
      settings.accentScale.accent60,
      settings.backgroundObjectUrl,
      settings.backgroundOpacity,
      settings.backgroundBlur,
      settings.backgroundDim,
      settings.revealMotionEnabled,
      settings.revealMotionEffect,
      settings.revealMotionReplay,
      settings.revealMotionDurationMs,
      settings.revealMotionDistancePx,
      settings.revealMotionStaggerMs,
      settings.revealMotionMaxDelayMs,
      settings.routeProgressEnabled,
      settings.routeProgressShowSpinner,
      settings.routeProgressHeightPx,
      settings.routeProgressSpeedMs,
      settings.routeProgressEasing,
      settings.pageScrollbarStrategy,
      settings.smoothScrollEnabled,
      settings.smoothScrollDurationMs,
      settings.smoothScrollDamping,
      settings.scrollSnapEnabled,
      settings.scrollSnapMode,
      settings.scrollSnapStrength,
      settings.scrollHijackEnabled,
      settings.scrollHijackMode,
      settings.scrollHijackThresholdPx,
      settings.rubberBandEnabled,
      settings.rubberBandStrength,
      settings.rubberBandMaxOffsetPx,
      settings.specUnits.baseFontPx,
      settings.specUnits.spaceUnitPx,
      settings.specUnits.radiusUnitPx,
      settings.specUnits.controlHeightPx,
      settings.specUnits.contentWidthMode,
      settings.specUnits.contentWidthPercent,
      settings.specUnits.contentMaxWidthPx,
      settings.specUnits.contentWideWidthMode,
      settings.specUnits.contentWideWidthPercent,
      settings.specUnits.contentWideMaxWidthPx,
      settings.specUnits.railWidthPx,
      settings.specUnits.mobileNavHeightPx,
      settings.specUnits.videoGridMinCardWidthPx,
      settings.specUnits.settingsCardMinWidthPx
    ], applySettings)
    prefersDark.addEventListener("change", applySettings)
  })
})

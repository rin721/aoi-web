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
    root.dataset.aoiDensity = settings.appearanceDensity
    root.dataset.aoiRevealEffect = settings.revealMotionEffect
    root.dataset.aoiRevealMotion = settings.revealMotionEnabled ? "enabled" : "disabled"
    root.dataset.aoiRevealReplay = settings.revealMotionReplay
    root.dataset.aoiShape = settings.appearanceShape
    root.dataset.aoiSize = settings.appearanceSize

    style.setProperty("--aoi-accent-60", settings.accentScale.accent60)
    style.setProperty("--aoi-accent-50", settings.accentScale.accent50)
    style.setProperty("--aoi-accent-40", settings.accentScale.accent40)
    style.setProperty("--aoi-accent-20", settings.accentScale.accent20)
    style.setProperty("--aoi-accent-10", settings.accentScale.accent10)
    style.setProperty("--aoi-user-bg-image", settings.backgroundObjectUrl ? `url("${settings.backgroundObjectUrl}")` : "none")
    style.setProperty("--aoi-user-bg-opacity", settings.backgroundObjectUrl ? String(settings.backgroundOpacity) : "0")
    style.setProperty("--aoi-user-bg-blur", `${settings.backgroundBlur}px`)
    style.setProperty("--aoi-user-bg-dim", String(settings.backgroundObjectUrl ? settings.backgroundDim : 0))
    style.setProperty("--aoi-reveal-duration-setting", `${settings.revealMotionDurationMs}ms`)
    style.setProperty("--aoi-reveal-distance-setting", `${settings.revealMotionDistancePx}px`)
    style.setProperty("--aoi-reveal-stagger-setting", `${settings.revealMotionStaggerMs}ms`)
    style.setProperty("--aoi-reveal-max-delay-setting", `${settings.revealMotionMaxDelayMs}ms`)
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
      settings.revealMotionMaxDelayMs
    ], applySettings)
    prefersDark.addEventListener("change", applySettings)
  })
})

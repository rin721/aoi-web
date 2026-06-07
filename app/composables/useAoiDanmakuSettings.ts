import type { MaybeRefOrGetter } from "vue"
import type { AoiDanmakuRuntimeSettings } from "~/utils/aoiDanmaku"
import { normalizeAoiDanmakuSettings } from "~/utils/aoiDanmaku"

export function useAoiDanmakuSettings(
  overrides: MaybeRefOrGetter<Partial<AoiDanmakuRuntimeSettings> | undefined> = {}
) {
  const settings = useAppSettingsStore()

  return computed(() => {
    const runtime = normalizeAoiDanmakuSettings({
      blocklist: settings.danmakuBlocklist,
      bottomModeEnabled: settings.danmakuBottomModeEnabled,
      enabled: settings.danmakuEnabled,
      fontScale: settings.danmakuFontScale,
      opacity: settings.danmakuOpacity,
      scrollModeEnabled: settings.danmakuScrollModeEnabled,
      speed: settings.danmakuSpeed,
      topModeEnabled: settings.danmakuTopModeEnabled,
      visibleArea: settings.danmakuVisibleArea,
      ...toValue(overrides)
    })

    return {
      ...runtime,
      enabled: settings.danmakuEnabled && runtime.enabled
    }
  })
}

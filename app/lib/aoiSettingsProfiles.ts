export type AoiSettingsProfileScope = "build" | "runtime"
export type AoiSettingsProfileFieldType = "boolean" | "color" | "number" | "string"

export interface AoiSettingsProfileField {
  group: string
  key: string
  label: string
  path: string
  scopes: AoiSettingsProfileScope[]
  type: AoiSettingsProfileFieldType
}

export interface AoiSettingsProfile {
  createdAt: string
  description: string
  fields: string[]
  id: string
  name: string
  scope: AoiSettingsProfileScope
  settings: Record<string, unknown>
  updatedAt: string
}

export interface AoiBuildProfileSummary {
  builtin?: boolean
  createdAt: string
  description: string
  id: string
  name: string
  updatedAt: string
}

export interface AoiBuildProfileManifest {
  activeProfileId: string
  profiles: AoiBuildProfileSummary[]
}

export interface AoiSettingsProfileDiffItem {
  after: string
  before: string
  changed: boolean
  field: AoiSettingsProfileField
}

export const AOI_DEFAULT_BUILD_PROFILE_ID = "default"
export const AOI_RUNTIME_PROFILE_STORAGE_KEY = "aoi.runtimeSettingsProfiles.v1"

export const AOI_SETTINGS_PROFILE_FIELDS: AoiSettingsProfileField[] = [
  { key: "preferredTheme", path: "preferredTheme", label: "主题模式", group: "主题与颜色", type: "string", scopes: ["build", "runtime"] },
  { key: "locale", path: "locale", label: "语言", group: "主题与颜色", type: "string", scopes: ["build", "runtime"] },
  { key: "accentMode", path: "accentMode", label: "色彩模式", group: "主题与颜色", type: "string", scopes: ["build", "runtime"] },
  { key: "accentPreset", path: "accentPreset", label: "预设色", group: "主题与颜色", type: "string", scopes: ["build", "runtime"] },
  { key: "customAccent", path: "customAccent", label: "自定义色", group: "主题与颜色", type: "color", scopes: ["build", "runtime"] },
  { key: "appearanceDensity", path: "appearanceDensity", label: "界面密度", group: "外观形态", type: "string", scopes: ["build", "runtime"] },
  { key: "appearanceSize", path: "appearanceSize", label: "界面尺寸", group: "外观形态", type: "string", scopes: ["build", "runtime"] },
  { key: "appearanceShape", path: "appearanceShape", label: "圆角形态", group: "外观形态", type: "string", scopes: ["build", "runtime"] },
  { key: "appearanceContrast", path: "appearanceContrast", label: "对比度", group: "外观形态", type: "string", scopes: ["build", "runtime"] },
  { key: "colorfulNavigation", path: "colorfulNavigation", label: "彩色导航栏", group: "外观形态", type: "boolean", scopes: ["build", "runtime"] },
  { key: "backgroundOpacity", path: "backgroundOpacity", label: "背景透明度", group: "背景", type: "number", scopes: ["build", "runtime"] },
  { key: "backgroundBlur", path: "backgroundBlur", label: "背景模糊", group: "背景", type: "number", scopes: ["build", "runtime"] },
  { key: "backgroundDim", path: "backgroundDim", label: "背景遮罩", group: "背景", type: "number", scopes: ["build", "runtime"] },
  { key: "backgroundImageId", path: "backgroundImageId", label: "背景图片引用", group: "背景", type: "string", scopes: ["runtime"] },
  { key: "backgroundFileName", path: "backgroundFileName", label: "背景文件名", group: "背景", type: "string", scopes: ["runtime"] },
  { key: "backgroundFileSize", path: "backgroundFileSize", label: "背景文件大小", group: "背景", type: "number", scopes: ["runtime"] },
  { key: "danmakuEnabled", path: "danmakuEnabled", label: "启用弹幕", group: "弹幕", type: "boolean", scopes: ["build", "runtime"] },
  { key: "danmakuScrollModeEnabled", path: "danmakuScrollModeEnabled", label: "滚动弹幕", group: "弹幕", type: "boolean", scopes: ["build", "runtime"] },
  { key: "danmakuTopModeEnabled", path: "danmakuTopModeEnabled", label: "顶部弹幕", group: "弹幕", type: "boolean", scopes: ["build", "runtime"] },
  { key: "danmakuBottomModeEnabled", path: "danmakuBottomModeEnabled", label: "底部弹幕", group: "弹幕", type: "boolean", scopes: ["build", "runtime"] },
  { key: "danmakuOpacity", path: "danmakuOpacity", label: "弹幕透明度", group: "弹幕", type: "number", scopes: ["build", "runtime"] },
  { key: "danmakuFontScale", path: "danmakuFontScale", label: "弹幕字号倍率", group: "弹幕", type: "number", scopes: ["build", "runtime"] },
  { key: "danmakuSpeed", path: "danmakuSpeed", label: "弹幕速度倍率", group: "弹幕", type: "number", scopes: ["build", "runtime"] },
  { key: "danmakuVisibleArea", path: "danmakuVisibleArea", label: "弹幕显示区域", group: "弹幕", type: "number", scopes: ["build", "runtime"] },
  { key: "danmakuBlocklist", path: "danmakuBlocklist", label: "弹幕屏蔽词", group: "弹幕", type: "string", scopes: ["build", "runtime"] },
  { key: "spec.baseFontPx", path: "specUnits.baseFontPx", label: "基础字号", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "spec.spaceUnitPx", path: "specUnits.spaceUnitPx", label: "间距单位", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "spec.radiusUnitPx", path: "specUnits.radiusUnitPx", label: "圆角单位", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "spec.controlHeightPx", path: "specUnits.controlHeightPx", label: "控件高度", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "spec.contentWidthMode", path: "specUnits.contentWidthMode", label: "内容宽度模式", group: "规格单位", type: "string", scopes: ["build", "runtime"] },
  { key: "spec.contentWidthPercent", path: "specUnits.contentWidthPercent", label: "内容宽度百分比", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "spec.contentMaxWidthPx", path: "specUnits.contentMaxWidthPx", label: "内容宽度像素", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "spec.contentWideWidthMode", path: "specUnits.contentWideWidthMode", label: "宽内容模式", group: "规格单位", type: "string", scopes: ["build", "runtime"] },
  { key: "spec.contentWideWidthPercent", path: "specUnits.contentWideWidthPercent", label: "宽内容百分比", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "spec.contentWideMaxWidthPx", path: "specUnits.contentWideMaxWidthPx", label: "宽内容像素", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "spec.railWidthPx", path: "specUnits.railWidthPx", label: "桌面侧栏", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "spec.mobileNavHeightPx", path: "specUnits.mobileNavHeightPx", label: "移动导航高度", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "spec.videoGridMinCardWidthPx", path: "specUnits.videoGridMinCardWidthPx", label: "视频卡片最小宽", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "spec.settingsCardMinWidthPx", path: "specUnits.settingsCardMinWidthPx", label: "设置卡片最小宽", group: "规格单位", type: "number", scopes: ["build", "runtime"] },
  { key: "dataMode", path: "dataMode", label: "流量模式", group: "偏好", type: "string", scopes: ["build", "runtime"] },
  { key: "openVideosInNewTab", path: "openVideosInNewTab", label: "新标签打开视频", group: "偏好", type: "boolean", scopes: ["build", "runtime"] },
  { key: "useRelativeDates", path: "useRelativeDates", label: "相对日期", group: "偏好", type: "boolean", scopes: ["build", "runtime"] },
  { key: "hideRecentSearches", path: "hideRecentSearches", label: "隐藏最近搜索", group: "偏好", type: "boolean", scopes: ["build", "runtime"] },
  { key: "disableWatchHistory", path: "disableWatchHistory", label: "禁用观看历史", group: "偏好", type: "boolean", scopes: ["build", "runtime"] },
  { key: "noSearchRecommendations", path: "noSearchRecommendations", label: "关闭搜索推荐", group: "偏好", type: "boolean", scopes: ["build", "runtime"] },
  { key: "noRelatedVideos", path: "noRelatedVideos", label: "关闭相关视频", group: "偏好", type: "boolean", scopes: ["build", "runtime"] },
  { key: "pageScrollbarStrategy", path: "pageScrollbarStrategy", label: "页面滚动条", group: "动效与滚动", type: "string", scopes: ["build", "runtime"] },
  { key: "revealMotionEnabled", path: "revealMotionEnabled", label: "入场动效", group: "动效与滚动", type: "boolean", scopes: ["build", "runtime"] },
  { key: "revealMotionEffect", path: "revealMotionEffect", label: "入场效果", group: "动效与滚动", type: "string", scopes: ["build", "runtime"] },
  { key: "revealMotionReplay", path: "revealMotionReplay", label: "入场重放", group: "动效与滚动", type: "string", scopes: ["build", "runtime"] },
  { key: "revealMotionDurationMs", path: "revealMotionDurationMs", label: "入场时长", group: "动效与滚动", type: "number", scopes: ["build", "runtime"] },
  { key: "revealMotionDistancePx", path: "revealMotionDistancePx", label: "入场距离", group: "动效与滚动", type: "number", scopes: ["build", "runtime"] },
  { key: "revealMotionStaggerMs", path: "revealMotionStaggerMs", label: "入场错峰", group: "动效与滚动", type: "number", scopes: ["build", "runtime"] },
  { key: "revealMotionMaxDelayMs", path: "revealMotionMaxDelayMs", label: "最大延迟", group: "动效与滚动", type: "number", scopes: ["build", "runtime"] },
  { key: "smoothScrollEnabled", path: "smoothScrollEnabled", label: "平滑滚动", group: "动效与滚动", type: "boolean", scopes: ["build", "runtime"] },
  { key: "smoothScrollDurationMs", path: "smoothScrollDurationMs", label: "滚动时长", group: "动效与滚动", type: "number", scopes: ["build", "runtime"] },
  { key: "smoothScrollDamping", path: "smoothScrollDamping", label: "滚动阻尼", group: "动效与滚动", type: "number", scopes: ["build", "runtime"] },
  { key: "scrollSnapEnabled", path: "scrollSnapEnabled", label: "滚动吸附", group: "动效与滚动", type: "boolean", scopes: ["build", "runtime"] },
  { key: "scrollSnapMode", path: "scrollSnapMode", label: "吸附模式", group: "动效与滚动", type: "string", scopes: ["build", "runtime"] },
  { key: "scrollSnapStrength", path: "scrollSnapStrength", label: "吸附强度", group: "动效与滚动", type: "number", scopes: ["build", "runtime"] },
  { key: "scrollHijackEnabled", path: "scrollHijackEnabled", label: "滚动场景控制", group: "动效与滚动", type: "boolean", scopes: ["build", "runtime"] },
  { key: "scrollHijackMode", path: "scrollHijackMode", label: "场景控制模式", group: "动效与滚动", type: "string", scopes: ["build", "runtime"] },
  { key: "scrollHijackThresholdPx", path: "scrollHijackThresholdPx", label: "场景控制阈值", group: "动效与滚动", type: "number", scopes: ["build", "runtime"] },
  { key: "rubberBandEnabled", path: "rubberBandEnabled", label: "橡皮筋反馈", group: "动效与滚动", type: "boolean", scopes: ["build", "runtime"] },
  { key: "rubberBandStrength", path: "rubberBandStrength", label: "橡皮筋强度", group: "动效与滚动", type: "number", scopes: ["build", "runtime"] },
  { key: "rubberBandMaxOffsetPx", path: "rubberBandMaxOffsetPx", label: "橡皮筋最大位移", group: "动效与滚动", type: "number", scopes: ["build", "runtime"] },
  { key: "routeProgressEnabled", path: "routeProgressEnabled", label: "路由进度条", group: "路由进度", type: "boolean", scopes: ["build", "runtime"] },
  { key: "routeProgressMinimum", path: "routeProgressMinimum", label: "起始进度", group: "路由进度", type: "number", scopes: ["build", "runtime"] },
  { key: "routeProgressTrickle", path: "routeProgressTrickle", label: "自动递增", group: "路由进度", type: "boolean", scopes: ["build", "runtime"] },
  { key: "routeProgressTrickleSpeedMs", path: "routeProgressTrickleSpeedMs", label: "递增速度", group: "路由进度", type: "number", scopes: ["build", "runtime"] },
  { key: "routeProgressSpeedMs", path: "routeProgressSpeedMs", label: "动画速度", group: "路由进度", type: "number", scopes: ["build", "runtime"] },
  { key: "routeProgressDelayMs", path: "routeProgressDelayMs", label: "显示延迟", group: "路由进度", type: "number", scopes: ["build", "runtime"] },
  { key: "routeProgressHeightPx", path: "routeProgressHeightPx", label: "进度条高度", group: "路由进度", type: "number", scopes: ["build", "runtime"] },
  { key: "routeProgressShowSpinner", path: "routeProgressShowSpinner", label: "显示 Spinner", group: "路由进度", type: "boolean", scopes: ["build", "runtime"] },
  { key: "routeProgressEasing", path: "routeProgressEasing", label: "缓动曲线", group: "路由进度", type: "string", scopes: ["build", "runtime"] }
]

const FIELD_BY_KEY = new Map(AOI_SETTINGS_PROFILE_FIELDS.map((field) => [field.key, field]))

function cloneValue<T>(value: T): T {
  if (value === undefined) {
    return value
  }

  return JSON.parse(JSON.stringify(value)) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function getPathValue(source: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, part) => {
    if (!isRecord(current)) {
      return undefined
    }

    return current[part]
  }, source)
}

function setPathValue(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".")
  let current: Record<string, unknown> = target

  parts.slice(0, -1).forEach((part) => {
    const next = current[part]

    if (!isRecord(next)) {
      current[part] = {}
    }

    current = current[part] as Record<string, unknown>
  })

  current[parts[parts.length - 1]!] = cloneValue(value)
}

function setTargetPathValue(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".")
  let current: Record<string, unknown> = target

  for (const part of parts.slice(0, -1)) {
    const next = current[part]

    if (!isRecord(next)) {
      return
    }

    current = next
  }

  current[parts[parts.length - 1]!] = cloneValue(value)
}

export function isAoiSettingsProfileId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{1,47}$/.test(value)
}

export function slugifyAoiSettingsProfileId(value: string, fallback = "custom-profile") {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)

  return isAoiSettingsProfileId(slug) ? slug : fallback
}

export function getAoiSettingsProfileFields(scope: AoiSettingsProfileScope) {
  return AOI_SETTINGS_PROFILE_FIELDS.filter((field) => field.scopes.includes(scope))
}

export function getAoiSettingsProfileField(key: string) {
  return FIELD_BY_KEY.get(key)
}

export function normalizeAoiSettingsProfileFieldKeys(
  keys: unknown,
  scope: AoiSettingsProfileScope,
  options: { fallbackToAll?: boolean } = {}
) {
  const fallbackToAll = options.fallbackToAll ?? true
  const allowed = new Set(getAoiSettingsProfileFields(scope).map((field) => field.key))
  const values = Array.isArray(keys) ? keys : []
  const normalized: string[] = []

  values.forEach((value) => {
    if (typeof value === "string" && allowed.has(value) && !normalized.includes(value)) {
      normalized.push(value)
    }
  })

  return normalized.length > 0 || !fallbackToAll ? normalized : Array.from(allowed)
}

export function pickAoiSettingsProfileValues(
  source: unknown,
  fieldKeys: string[],
  scope: AoiSettingsProfileScope,
  options: { fallbackToAll?: boolean } = {}
) {
  const fields = normalizeAoiSettingsProfileFieldKeys(fieldKeys, scope, options)
  const settings: Record<string, unknown> = {}

  fields.forEach((key) => {
    const field = getAoiSettingsProfileField(key)
    const value = field ? getPathValue(source, field.path) : undefined

    if (field && value !== undefined) {
      setPathValue(settings, field.path, value)
    }
  })

  return settings
}

export function createAoiSettingsProfile(
  input: {
    description?: string
    fields: string[]
    id: string
    name?: string
    scope: AoiSettingsProfileScope
    settings: unknown
  },
  now = new Date().toISOString()
): AoiSettingsProfile {
  const id = slugifyAoiSettingsProfileId(input.id)
  const fields = normalizeAoiSettingsProfileFieldKeys(input.fields, input.scope, { fallbackToAll: false })

  return {
    createdAt: now,
    description: input.description?.trim() || "",
    fields,
    id,
    name: input.name?.trim() || id,
    scope: input.scope,
    settings: pickAoiSettingsProfileValues(input.settings, fields, input.scope, { fallbackToAll: false }),
    updatedAt: now
  }
}

export function normalizeAoiSettingsProfile(value: unknown, scope: AoiSettingsProfileScope): AoiSettingsProfile | null {
  if (!isRecord(value) || !isAoiSettingsProfileId(value.id)) {
    return null
  }

  const fields = normalizeAoiSettingsProfileFieldKeys(value.fields, scope)

  return {
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    description: typeof value.description === "string" ? value.description : "",
    fields,
    id: value.id,
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : value.id,
    scope,
    settings: pickAoiSettingsProfileValues(value.settings, fields, scope),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString()
  }
}

export function createAoiSettingsProfileDiff(
  currentSettings: unknown,
  profileSettings: unknown,
  fieldKeys: string[],
  scope: AoiSettingsProfileScope
): AoiSettingsProfileDiffItem[] {
  return normalizeAoiSettingsProfileFieldKeys(fieldKeys, scope, { fallbackToAll: false }).map((key) => {
    const field = getAoiSettingsProfileField(key)!
    const beforeValue = getPathValue(currentSettings, field.path)
    const afterValue = getPathValue(profileSettings, field.path)
    const before = formatAoiSettingsProfileValue(beforeValue)
    const after = formatAoiSettingsProfileValue(afterValue)

    return {
      after,
      before,
      changed: before !== after,
      field
    }
  })
}

export function applyAoiSettingsProfileValues(target: Record<string, unknown>, profile: AoiSettingsProfile) {
  profile.fields.forEach((key) => {
    const field = getAoiSettingsProfileField(key)
    const value = field ? getPathValue(profile.settings, field.path) : undefined

    if (field && value !== undefined) {
      setTargetPathValue(target, field.path, value)
    }
  })
}

export function formatAoiSettingsProfileValue(value: unknown) {
  if (value === undefined) {
    return "未设置"
  }

  if (value === null) {
    return "null"
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return JSON.stringify(value)
}

export function summarizeAoiSettingsProfileFields(fieldKeys: string[], scope: AoiSettingsProfileScope) {
  const fields = normalizeAoiSettingsProfileFieldKeys(fieldKeys, scope, { fallbackToAll: false })
  const groups = new Map<string, number>()

  fields.forEach((key) => {
    const group = getAoiSettingsProfileField(key)?.group || "其它"

    groups.set(group, (groups.get(group) || 0) + 1)
  })

  return Array.from(groups.entries())
    .map(([group, count]) => `${group} ${count}`)
    .join(" · ")
}

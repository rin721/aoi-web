import { mockLowCodeApp, mockPageSchema } from "~/lowcode/schemas/mockPageSchema"
import {
  cloneLowCodeValue,
  isLowCodeApp,
  isLowCodePage,
  isPageVersion,
  normalizeLowCodeApp,
  normalizeLowCodePage
} from "~/lowcode/schemaModel"
import type { LowCodeApp, LowCodeAppSummary, LowCodePage, PageVersion } from "~/types/lowcode"

export { normalizeLowCodeApp, normalizeLowCodePage } from "~/lowcode/schemaModel"

const LOW_CODE_APP_STORAGE_PREFIX = "aoi.lowcode.app.v1"
const LOW_CODE_APP_INDEX_KEY = "aoi.lowcode.apps.v1:index"
const LOW_CODE_PAGE_VERSION_STORAGE_PREFIX = "aoi.lowcode.page.versions.v1"
const LEGACY_LOW_CODE_PAGE_STORAGE_PREFIX = "aoi.lowcode.page.v1"

export function createLowCodeAppStorageKey(appId: string) {
  return `${LOW_CODE_APP_STORAGE_PREFIX}:${appId}`
}

export function createLowCodePageStorageKey(appId: string, pageId: string) {
  return `${LEGACY_LOW_CODE_PAGE_STORAGE_PREFIX}:${appId}:${pageId}`
}

export function createLowCodePageVersionsStorageKey(appId: string, pageId: string) {
  return `${LOW_CODE_PAGE_VERSION_STORAGE_PREFIX}:${appId}:${pageId}`
}

function createDefaultLowCodeApp(appId: string): LowCodeApp {
  const app = cloneLowCodeValue(mockLowCodeApp)

  return normalizeLowCodeApp({
    ...app,
    id: appId,
    name: appId === mockLowCodeApp.id ? app.name : `${appId} App`
  })
}

function summarizeLowCodeApp(app: LowCodeApp): LowCodeAppSummary {
  return {
    currentPageId: app.currentPageId,
    id: app.id,
    name: app.name,
    pageCount: app.pages.length
  }
}

function readStoredAppIds() {
  if (!import.meta.client) {
    return []
  }

  const ids = new Set<string>()

  try {
    const raw = window.localStorage.getItem(LOW_CODE_APP_INDEX_KEY)
    const parsed = raw ? JSON.parse(raw) : []

    if (Array.isArray(parsed)) {
      for (const value of parsed) {
        if (typeof value === "string") {
          ids.add(value)
        }
      }
    }

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)

      if (key?.startsWith(`${LOW_CODE_APP_STORAGE_PREFIX}:`)) {
        ids.add(key.slice(`${LOW_CODE_APP_STORAGE_PREFIX}:`.length))
      }
    }
  } catch {
    return []
  }

  return Array.from(ids)
}

function writeStoredAppIds(ids: string[]) {
  if (!import.meta.client) {
    return
  }

  try {
    window.localStorage.setItem(LOW_CODE_APP_INDEX_KEY, JSON.stringify(Array.from(new Set(ids))))
  } catch {
    // The editor can still work in memory when browser storage is unavailable.
  }
}

function loadLegacyLowCodePage(appId: string, pageId: string) {
  if (!import.meta.client) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(createLowCodePageStorageKey(appId, pageId))
    const parsed = raw ? JSON.parse(raw) : null

    return isLowCodePage(parsed) ? normalizeLowCodePage(parsed) : null
  } catch {
    return null
  }
}

export function loadLowCodeApp(appId: string) {
  if (!import.meta.client) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(createLowCodeAppStorageKey(appId))
    const parsed = raw ? JSON.parse(raw) : null

    return isLowCodeApp(parsed) ? normalizeLowCodeApp(parsed) : null
  } catch {
    return null
  }
}

export function loadOrCreateLowCodeApp(appId: string) {
  const stored = loadLowCodeApp(appId)

  if (stored) {
    return stored
  }

  const legacyPage = loadLegacyLowCodePage(appId, mockPageSchema.id)

  if (legacyPage) {
    return normalizeLowCodeApp({
      ...createDefaultLowCodeApp(appId),
      currentPageId: legacyPage.id,
      pages: [
        legacyPage
      ]
    })
  }

  return createDefaultLowCodeApp(appId)
}

export function saveLowCodeApp(app: LowCodeApp) {
  if (!import.meta.client) {
    return false
  }

  try {
    const normalizedApp = normalizeLowCodeApp(app)
    window.localStorage.setItem(
      createLowCodeAppStorageKey(normalizedApp.id),
      JSON.stringify(cloneLowCodeValue(normalizedApp))
    )
    writeStoredAppIds([
      ...readStoredAppIds(),
      normalizedApp.id
    ])
    return true
  } catch {
    return false
  }
}

export function loadLowCodePageVersions(appId: string, pageId: string): PageVersion[] {
  if (!import.meta.client) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(createLowCodePageVersionsStorageKey(appId, pageId))
    const parsed = raw ? JSON.parse(raw) : []

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(isPageVersion)
      .map((version) => ({
        ...version,
        schema: normalizeLowCodePage(version.schema)
      }))
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
  } catch {
    return []
  }
}

export function saveLowCodePageVersion(appId: string, pageSchema: LowCodePage, label?: string) {
  if (!import.meta.client) {
    return null
  }

  const createdAt = new Date().toISOString()
  const normalizedPage = normalizeLowCodePage(pageSchema)
  const version: PageVersion = {
    createdAt,
    id: `version-${normalizedPage.id}-${Date.now()}`,
    label: label || `Saved ${new Date(createdAt).toLocaleString()}`,
    pageId: normalizedPage.id,
    schema: cloneLowCodeValue(normalizedPage)
  }

  try {
    const versions = [
      version,
      ...loadLowCodePageVersions(appId, normalizedPage.id)
    ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))

    window.localStorage.setItem(
      createLowCodePageVersionsStorageKey(appId, normalizedPage.id),
      JSON.stringify(cloneLowCodeValue(versions))
    )
    return version
  } catch {
    return null
  }
}

export function restoreLowCodePageVersion(version: PageVersion) {
  return normalizeLowCodePage(cloneLowCodeValue(version.schema))
}

export function listLowCodeApps(): LowCodeAppSummary[] {
  if (!import.meta.client) {
    return [
      summarizeLowCodeApp(createDefaultLowCodeApp(mockLowCodeApp.id))
    ]
  }

  const summaries = readStoredAppIds()
    .map((appId) => loadLowCodeApp(appId))
    .filter((app): app is LowCodeApp => Boolean(app))
    .map(summarizeLowCodeApp)

  if (!summaries.some((app) => app.id === mockLowCodeApp.id)) {
    summaries.unshift(summarizeLowCodeApp(createDefaultLowCodeApp(mockLowCodeApp.id)))
  }

  return summaries
}

export function loadLowCodePageSchema(appId: string, pageId: string) {
  const app = loadLowCodeApp(appId)
  const page = app?.pages.find((item) => item.id === pageId)

  if (page) {
    return page
  }

  return loadLegacyLowCodePage(appId, pageId)
}

export function saveLowCodePageSchema(appId: string, pageSchema: LowCodePage) {
  const existingApp = loadLowCodeApp(appId) || createDefaultLowCodeApp(appId)
  const normalizedPage = normalizeLowCodePage(pageSchema)
  const pageExists = existingApp.pages.some((page) => page.id === normalizedPage.id)
  const pages = pageExists
    ? existingApp.pages.map((page) => page.id === normalizedPage.id ? normalizedPage : page)
    : [...existingApp.pages, normalizedPage]

  return saveLowCodeApp({
    ...existingApp,
    currentPageId: normalizedPage.id,
    pages
  })
}

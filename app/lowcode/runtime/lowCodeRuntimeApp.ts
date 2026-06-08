import { mockLowCodeApp, mockPageSchema } from "~/lowcode/schemas/mockPageSchema"
import type { ComponentNode, LowCodeApp, LowCodePage } from "~/types/lowcode"

const LOW_CODE_APP_STORAGE_PREFIX = "aoi.lowcode.app.v1"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isComponentNode(value: unknown): value is ComponentNode {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.id !== "string" || typeof value.type !== "string") {
    return false
  }

  return value.children === undefined
    || (Array.isArray(value.children) && value.children.every(isComponentNode))
}

function isLowCodePage(value: unknown): value is LowCodePage {
  if (!isRecord(value)) {
    return false
  }

  const layout = value.layout || value.root

  return typeof value.id === "string"
    && typeof value.name === "string"
    && typeof value.path === "string"
    && isComponentNode(layout)
}

function isLowCodeApp(value: unknown): value is LowCodeApp {
  return isRecord(value)
    && value.schemaVersion === "lowcode.app.v1"
    && typeof value.id === "string"
    && typeof value.name === "string"
    && Array.isArray(value.pages)
    && value.pages.every(isLowCodePage)
}

function normalizePath(path: string) {
  const trimmed = path.trim()

  if (!trimmed) {
    return "/"
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

export function normalizeRuntimeLowCodePage(page: LowCodePage): LowCodePage {
  const layout = page.layout || page.root || mockPageSchema.layout

  return {
    ...page,
    layout,
    path: normalizePath(page.path),
    root: layout
  }
}

export function normalizeRuntimeLowCodeApp(app: LowCodeApp): LowCodeApp {
  const pages = app.pages.map(normalizeRuntimeLowCodePage)
  const firstPage = pages[0]
  const currentPageExists = pages.some((page) => page.id === app.currentPageId)

  return {
    ...app,
    currentPageId: currentPageExists ? app.currentPageId : firstPage?.id,
    pages,
    schemaVersion: "lowcode.app.v1"
  }
}

export function createRuntimeLowCodeAppStorageKey(appId: string) {
  return `${LOW_CODE_APP_STORAGE_PREFIX}:${appId}`
}

export function loadRuntimeLowCodeApp(appId: string) {
  if (!import.meta.client) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(createRuntimeLowCodeAppStorageKey(appId))
    const parsed = raw ? JSON.parse(raw) : null

    return isLowCodeApp(parsed) ? normalizeRuntimeLowCodeApp(parsed) : null
  } catch {
    return null
  }
}

export function loadOrCreateRuntimeLowCodeApp(appId: string) {
  const stored = loadRuntimeLowCodeApp(appId)

  if (stored) {
    return stored
  }

  const app = clone(mockLowCodeApp)

  return normalizeRuntimeLowCodeApp({
    ...app,
    id: appId,
    name: appId === mockLowCodeApp.id ? app.name : `${appId} App`
  })
}

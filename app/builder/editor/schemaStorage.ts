import type { ComponentNode, LowCodePage } from "~/types/lowcode"

const LOW_CODE_PAGE_STORAGE_PREFIX = "aoi.lowcode.page.v1"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function isComponentNode(value: unknown): value is ComponentNode {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.id !== "string" || typeof value.type !== "string") {
    return false
  }

  if (value.children !== undefined) {
    if (!Array.isArray(value.children)) {
      return false
    }

    return value.children.every(isComponentNode)
  }

  return true
}

function isLowCodePage(value: unknown): value is LowCodePage {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.name === "string"
    && typeof value.path === "string"
    && isComponentNode(value.root)
}

export function createLowCodePageStorageKey(appId: string, pageId: string) {
  return `${LOW_CODE_PAGE_STORAGE_PREFIX}:${appId}:${pageId}`
}

export function loadLowCodePageSchema(appId: string, pageId: string) {
  if (!import.meta.client) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(createLowCodePageStorageKey(appId, pageId))
    const parsed = raw ? JSON.parse(raw) : null

    return isLowCodePage(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveLowCodePageSchema(appId: string, pageSchema: LowCodePage) {
  if (!import.meta.client) {
    return false
  }

  try {
    window.localStorage.setItem(
      createLowCodePageStorageKey(appId, pageSchema.id),
      JSON.stringify(JSON.parse(JSON.stringify(pageSchema)))
    )
    return true
  } catch {
    return false
  }
}

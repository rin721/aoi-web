import { mockLowCodeApp } from "~/lowcode/schemas/mockPageSchema"
import {
  cloneLowCodeValue,
  isLowCodeApp,
  normalizeLowCodeApp,
  normalizeLowCodePage
} from "~/lowcode/schemaModel"

const LOW_CODE_APP_STORAGE_PREFIX = "aoi.lowcode.app.v1"

export const normalizeRuntimeLowCodePage = normalizeLowCodePage
export const normalizeRuntimeLowCodeApp = normalizeLowCodeApp

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

  const app = cloneLowCodeValue(mockLowCodeApp)

  return normalizeRuntimeLowCodeApp({
    ...app,
    id: appId,
    name: appId === mockLowCodeApp.id ? app.name : `${appId} App`
  })
}

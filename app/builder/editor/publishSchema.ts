import { isLowCodeApp, normalizeLowCodeApp } from "~/lowcode/schemaModel"
import type { LowCodeApp } from "~/types/lowcode"

export function formatLowCodeAppExport(appSchema: LowCodeApp) {
  return JSON.stringify(normalizeLowCodeApp(appSchema), null, 2)
}

export function parseLowCodeAppImport(raw: string) {
  try {
    const parsed = JSON.parse(raw)

    return isLowCodeApp(parsed) ? normalizeLowCodeApp(parsed) : null
  } catch {
    return null
  }
}

import { normalizeLowCodeApp } from "~/builder/editor/schemaStorage"
import type { ComponentNode, LowCodeApp, LowCodePage } from "~/types/lowcode"

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
    return Array.isArray(value.children) && value.children.every(isComponentNode)
  }

  if (value.slots !== undefined) {
    return isRecord(value.slots)
      && Object.values(value.slots).every((slotNodes) =>
        Array.isArray(slotNodes) && slotNodes.every(isComponentNode)
      )
  }

  return true
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
    && value.pages.length > 0
    && value.pages.every(isLowCodePage)
}

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

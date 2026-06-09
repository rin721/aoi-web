import { mockPageSchema } from "~/lowcode/schemas/mockPageSchema"
import type { ComponentNode, DataSource, LowCodeApp, LowCodePage, PageVersion } from "~/types/lowcode"

export interface LowCodeSchemaValidationResult {
  errors: string[]
  ok: boolean
}

export function cloneLowCodeValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function isComponentNodeArray(value: unknown): value is ComponentNode[] {
  return Array.isArray(value) && value.every(isComponentNode)
}

function isComponentNodeSlots(value: unknown): value is Record<string, ComponentNode[]> {
  return isRecord(value)
    && Object.values(value).every(isComponentNodeArray)
}

export function isComponentNode(value: unknown): value is ComponentNode {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.id !== "string" || typeof value.type !== "string") {
    return false
  }

  if (value.children !== undefined && !isComponentNodeArray(value.children)) {
    return false
  }

  if (value.slots !== undefined && !isComponentNodeSlots(value.slots)) {
    return false
  }

  return true
}

export function isDataSource(value: unknown): value is DataSource {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    return false
  }

  if (value.type === "mock") {
    return true
  }

  if (value.type === "api") {
    return isRecord(value.config)
      && typeof value.config.url === "string"
      && typeof value.config.method === "string"
  }

  if (value.type === "sqlite") {
    return isRecord(value.config)
      && Array.isArray(value.config.tables)
  }

  return false
}

export function isLowCodePage(value: unknown): value is LowCodePage {
  if (!isRecord(value)) {
    return false
  }

  const layout = value.layout || value.root

  return typeof value.id === "string"
    && typeof value.name === "string"
    && typeof value.path === "string"
    && isComponentNode(layout)
}

export function isLowCodeApp(value: unknown): value is LowCodeApp {
  return isRecord(value)
    && value.schemaVersion === "lowcode.app.v1"
    && typeof value.id === "string"
    && typeof value.name === "string"
    && Array.isArray(value.pages)
    && value.pages.length > 0
    && value.pages.every(isLowCodePage)
}

export function isPageVersion(value: unknown): value is PageVersion {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.pageId === "string"
    && typeof value.createdAt === "string"
    && typeof value.label === "string"
    && isLowCodePage(value.schema)
}

export function normalizeLowCodePath(path: string) {
  const trimmed = path.trim()

  if (!trimmed) {
    return "/"
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

export function normalizeLowCodePage(page: LowCodePage): LowCodePage {
  const layout = page.layout || page.root || mockPageSchema.layout

  return {
    ...page,
    layout,
    path: normalizeLowCodePath(page.path),
    root: layout
  }
}

export function normalizeLowCodeApp(app: LowCodeApp): LowCodeApp {
  const pages = app.pages.length
    ? app.pages.map(normalizeLowCodePage)
    : [normalizeLowCodePage(mockPageSchema)]
  const firstPage = pages[0]
  const currentPageExists = pages.some((page) => page.id === app.currentPageId)

  return {
    ...app,
    currentPageId: currentPageExists ? app.currentPageId : firstPage?.id,
    pages,
    schemaVersion: "lowcode.app.v1"
  }
}

export function normalizeDataSources(dataSources: unknown): DataSource[] {
  return Array.isArray(dataSources)
    ? dataSources.filter(isDataSource).map((source) => cloneLowCodeValue(source))
    : []
}

export function validateLowCodeApp(value: unknown): LowCodeSchemaValidationResult {
  const errors: string[] = []

  if (!isRecord(value)) {
    return {
      errors: ["Schema must be a JSON object."],
      ok: false
    }
  }

  if (value.schemaVersion !== "lowcode.app.v1") {
    errors.push("schemaVersion must be lowcode.app.v1.")
  }

  if (typeof value.id !== "string" || !value.id.trim()) {
    errors.push("App id is required.")
  }

  if (typeof value.name !== "string" || !value.name.trim()) {
    errors.push("App name is required.")
  }

  if (!Array.isArray(value.pages) || !value.pages.length) {
    errors.push("At least one LowCodePage is required.")
  } else {
    value.pages.forEach((page, index) => {
      if (!isLowCodePage(page)) {
        errors.push(`pages[${index}] is not a valid LowCodePage.`)
      }
    })
  }

  return {
    errors,
    ok: errors.length === 0
  }
}

export function parseLowCodeAppJson(raw: string) {
  try {
    const parsed = JSON.parse(raw)

    return isLowCodeApp(parsed) ? normalizeLowCodeApp(parsed) : null
  } catch {
    return null
  }
}

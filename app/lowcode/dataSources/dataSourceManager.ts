import type { DataSource, LowCodeApp, LowCodePage } from "~/types/lowcode"

export function resolveRuntimeDataSources(appSchema: LowCodeApp, pageSchema: LowCodePage): DataSource[] {
  const sourceMap = new Map<string, DataSource>()

  for (const source of appSchema.dataSources || []) {
    sourceMap.set(source.id, source)
  }

  for (const source of pageSchema.dataSources || []) {
    sourceMap.set(source.id, source)
  }

  return Array.from(sourceMap.values())
}

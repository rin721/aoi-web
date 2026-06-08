import { createDatabaseAdapter } from "~/lowcode/dataSources/databaseAdapter"
import { getDataSources as getPluginDataSources } from "~/lowcode/plugins/pluginRegistry"
import type { DataBinding, DataSource } from "~/types/lowcode"

export const mockDataSources: DataSource[] = [
  {
    data: {
      headline: "Mock users",
      users: [
        {
          id: "user-001",
          name: "青木 直人",
          email: "naoto@example.test",
          role: "Designer"
        },
        {
          id: "user-002",
          name: "林 小雨",
          email: "xiaoyu@example.test",
          role: "Developer"
        },
        {
          id: "user-003",
          name: "Maya Chen",
          email: "maya@example.test",
          role: "Product"
        }
      ]
    },
    id: "mock-users",
    name: "Mock User List",
    type: "mock"
  }
]

export const apiDataSources: DataSource[] = [
  {
    config: {
      headers: {},
      method: "GET",
      params: {},
      responseMapping: {
        rootKey: "users"
      },
      url: "https://jsonplaceholder.typicode.com/users"
    },
    id: "api-jsonplaceholder-users",
    name: "JSONPlaceholder Users",
    type: "api"
  }
]

export const sqliteDataSources: DataSource[] = [
  {
    config: {
      adapter: "memory",
      databaseName: "aoi-local",
      tables: [
        {
          fields: [
            {
              name: "id",
              primaryKey: true,
              required: true,
              type: "text",
              unique: true
            },
            {
              name: "name",
              required: true,
              type: "text"
            },
            {
              name: "email",
              required: true,
              type: "text",
              unique: true
            },
            {
              defaultValue: "Member",
              name: "role",
              required: true,
              type: "text"
            }
          ],
          name: "users",
          seed: [
            {
              email: "aoi-local@example.test",
              id: "local-user-001",
              name: "Aoi Local",
              role: "Owner"
            },
            {
              email: "builder@example.test",
              id: "local-user-002",
              name: "Builder User",
              role: "Editor"
            }
          ]
        }
      ]
    },
    id: "sqlite-local-users",
    name: "Local SQLite Users",
    type: "sqlite"
  }
]

export const defaultDataSources: DataSource[] = [
  ...mockDataSources,
  ...apiDataSources,
  ...sqliteDataSources
]

export function getDefaultDataSources() {
  const coreIds = new Set(defaultDataSources.map((source) => source.id))
  const pluginDataSources = getPluginDataSources().filter((source) => !coreIds.has(source.id))

  return [
    ...defaultDataSources,
    ...pluginDataSources
  ]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

export function getRegisteredDataSource(sourceId: string, dataSources: DataSource[] = getDefaultDataSources()) {
  return dataSources.find((source) => source.id === sourceId)
    || getDefaultDataSources().find((source) => source.id === sourceId)
}

export function getDataSourceFieldOptions(sourceId: string, dataSources: DataSource[] = getDefaultDataSources()) {
  const source = getRegisteredDataSource(sourceId, dataSources)

  if (!source) {
    return []
  }

  if (source.type === "mock" && isRecord(source.data)) {
    return Object.keys(source.data).map((key) => ({
      label: key,
      value: key
    }))
  }

  if (source.type === "api") {
    const field = source.config.responseMapping?.rootKey || "response"

    return [
      {
        label: field,
        value: field
      }
    ]
  }

  if (source.type === "sqlite") {
    return source.config.tables.map((table) => ({
      label: table.name,
      value: table.name
    }))
  }

  return []
}

export function resolveDataBindingValue(
  binding: DataBinding,
  dataSources: DataSource[] = getDefaultDataSources(),
  runtimeValues: Record<string, unknown> = {}
) {
  const source = getRegisteredDataSource(binding.sourceId, dataSources)

  if (!source) {
    return binding.fallback
  }

  const sourceData = source.type === "mock"
    ? source.data
    : source.type === "api"
      ? runtimeValues[source.id]
      : source.type === "sqlite"
        ? runtimeValues[source.id]
        : undefined

  if (binding.path === "response") {
    return sourceData === undefined ? binding.fallback : sourceData
  }

  if (!isRecord(sourceData) || !Object.prototype.hasOwnProperty.call(sourceData, binding.path)) {
    return binding.fallback
  }

  return sourceData[binding.path]
}

export async function runUsersCrudExample(source = sqliteDataSources[0]) {
  if (!source || source.type !== "sqlite") {
    throw new Error("SQLite users data source is not registered.")
  }

  const adapter = createDatabaseAdapter(source)

  await adapter.connect()

  const beforeInsert = await adapter.query("users")
  const inserted = await adapter.insert("users", {
    email: "inserted-user@example.test",
    id: "local-user-inserted",
    name: "Inserted User",
    role: "Viewer"
  })
  const afterInsert = await adapter.query("users")

  return {
    afterInsert,
    beforeInsert,
    inserted
  }
}

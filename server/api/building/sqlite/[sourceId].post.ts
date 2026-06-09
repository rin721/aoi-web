import { mkdirSync } from "node:fs"
import { resolve } from "node:path"
import { DatabaseSync, type SQLInputValue } from "node:sqlite"
import type {
  DatabaseQueryOptions,
  DatabaseRecord,
  DatabaseWhere,
  DataSource,
  SQLiteFieldSchema,
  SQLiteTableSchema
} from "../../../../app/types/lowcode"

type SQLiteDataSource = Extract<DataSource, { type: "sqlite" }>

interface SQLiteRequestBody {
  operation?: "connect" | "initSchema" | "query" | "insert" | "update" | "delete"
  options?: DatabaseQueryOptions
  patch?: DatabaseRecord
  record?: DatabaseRecord
  source?: SQLiteDataSource
  table?: string
  tables?: SQLiteTableSchema[]
  where?: DatabaseWhere
}

interface DatabaseEntry {
  database: DatabaseSync
  path: string
}

const databaseDir = resolve(process.cwd(), ".data", "building")
const databaseEntries = new Map<string, DatabaseEntry>()

function assertBuildingApiAvailable() {
  if (!import.meta.dev) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not found"
    })
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function assertSQLiteDataSource(value: unknown): SQLiteDataSource {
  if (!isRecord(value) || value.type !== "sqlite" || typeof value.id !== "string" || !isRecord(value.config)) {
    throw new Error("Invalid SQLite data source.")
  }

  if (!Array.isArray(value.config.tables)) {
    throw new Error("SQLite data source requires tables.")
  }

  return value as SQLiteDataSource
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_") || "aoi-local"
}

function getDatabasePath(source: SQLiteDataSource) {
  const databaseName = sanitizeFileName(source.config.databaseName || source.id)

  return resolve(databaseDir, `${databaseName}.sqlite`)
}

function quoteIdentifier(value: string) {
  if (!value.trim()) {
    throw new Error("SQLite identifier cannot be empty.")
  }

  return `"${value.replace(/"/g, "\"\"")}"`
}

function getSqlType(field: SQLiteFieldSchema) {
  if (field.type === "integer" || field.type === "boolean") {
    return "INTEGER"
  }

  if (field.type === "real") {
    return "REAL"
  }

  return "TEXT"
}

function getSqlDefault(field: SQLiteFieldSchema) {
  if (!Object.prototype.hasOwnProperty.call(field, "defaultValue")) {
    return ""
  }

  if (field.defaultValue === null) {
    return " DEFAULT NULL"
  }

  if (typeof field.defaultValue === "number") {
    return ` DEFAULT ${field.defaultValue}`
  }

  if (typeof field.defaultValue === "boolean") {
    return ` DEFAULT ${field.defaultValue ? 1 : 0}`
  }

  if (typeof field.defaultValue === "string") {
    return ` DEFAULT ${JSON.stringify(field.defaultValue)}`
  }

  return ""
}

function createTableSql(table: SQLiteTableSchema) {
  const columns = table.fields.map((field) => [
    quoteIdentifier(field.name),
    getSqlType(field),
    field.primaryKey ? "PRIMARY KEY" : "",
    field.required ? "NOT NULL" : "",
    field.unique && !field.primaryKey ? "UNIQUE" : "",
    getSqlDefault(field)
  ].filter(Boolean).join(" "))

  return `CREATE TABLE IF NOT EXISTS ${quoteIdentifier(table.name)} (${columns.join(", ")})`
}

function getDatabase(source: SQLiteDataSource) {
  mkdirSync(databaseDir, { recursive: true })

  const path = getDatabasePath(source)
  const existing = databaseEntries.get(path)

  if (existing) {
    return existing.database
  }

  const database = new DatabaseSync(path)

  databaseEntries.set(path, { database, path })
  return database
}

function findTable(source: SQLiteDataSource, tableName: string) {
  const table = source.config.tables.find((item) => item.name === tableName)

  if (!table) {
    throw new Error(`Unknown sqlite table: ${tableName}`)
  }

  return table
}

function encodeFieldValue(field: SQLiteFieldSchema | undefined, value: unknown) {
  if (field?.type === "boolean") {
    return value ? 1 : 0
  }

  if (field?.type === "json" && value !== undefined && value !== null) {
    return typeof value === "string" ? value : JSON.stringify(value)
  }

  return value
}

function decodeFieldValue(field: SQLiteFieldSchema | undefined, value: unknown) {
  if (field?.type === "boolean") {
    return Boolean(value)
  }

  if (field?.type === "json" && typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  return value
}

function toSQLInputValue(value: unknown): SQLInputValue {
  if (value === undefined) {
    return null
  }

  if (
    value === null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "bigint"
    || value instanceof Uint8Array
  ) {
    return value
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0
  }

  return JSON.stringify(value)
}

function encodeRecord(table: SQLiteTableSchema, record: DatabaseRecord) {
  const fieldMap = new Map(table.fields.map((field) => [field.name, field]))

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      encodeFieldValue(fieldMap.get(key), value)
    ])
  )
}

function decodeRecord(table: SQLiteTableSchema, record: DatabaseRecord) {
  const fieldMap = new Map(table.fields.map((field) => [field.name, field]))

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      decodeFieldValue(fieldMap.get(key), value)
    ])
  )
}

function buildWhereClause(where?: DatabaseWhere): { sql: string, values: SQLInputValue[] } {
  if (!where || !Object.keys(where).length) {
    return {
      sql: "",
      values: []
    }
  }

  const entries = Object.entries(where)

  return {
    sql: ` WHERE ${entries.map(([key]) => `${quoteIdentifier(key)} = ?`).join(" AND ")}`,
    values: entries.map(([, value]) => toSQLInputValue(value))
  }
}

function initSchema(database: DatabaseSync, tables: SQLiteTableSchema[]) {
  for (const table of tables) {
    database.exec(createTableSql(table))

    const countRow = database
      .prepare(`SELECT COUNT(*) as count FROM ${quoteIdentifier(table.name)}`)
      .get() as { count?: number } | undefined

    if (countRow?.count || !table.seed?.length) {
      continue
    }

    for (const record of table.seed) {
      insertRecord(database, table, record)
    }
  }
}

function insertRecord(database: DatabaseSync, table: SQLiteTableSchema, record: DatabaseRecord) {
  const encodedRecord = encodeRecord(table, record)
  const entries = Object.entries(encodedRecord)

  if (!entries.length) {
    throw new Error("Insert record cannot be empty.")
  }

  const sql = [
    `INSERT INTO ${quoteIdentifier(table.name)}`,
    `(${entries.map(([key]) => quoteIdentifier(key)).join(", ")})`,
    `VALUES (${entries.map(() => "?").join(", ")})`
  ].join(" ")

  database.prepare(sql).run(...entries.map(([, value]) => toSQLInputValue(value)))

  return decodeRecord(table, encodedRecord)
}

function queryRecords(database: DatabaseSync, table: SQLiteTableSchema, options: DatabaseQueryOptions = {}) {
  const where = buildWhereClause(options.where)
  const limit = typeof options.limit === "number" && options.limit > 0
    ? ` LIMIT ${Math.floor(options.limit)}`
    : ""
  const rows = database
    .prepare(`SELECT * FROM ${quoteIdentifier(table.name)}${where.sql}${limit}`)
    .all(...where.values) as DatabaseRecord[]

  return rows.map((row) => decodeRecord(table, row))
}

function updateRecords(
  database: DatabaseSync,
  table: SQLiteTableSchema,
  where: DatabaseWhere,
  patch: DatabaseRecord
) {
  const encodedPatch = encodeRecord(table, patch)
  const patchEntries = Object.entries(encodedPatch)

  if (!patchEntries.length) {
    return []
  }

  const whereClause = buildWhereClause(where)
  const sql = [
    `UPDATE ${quoteIdentifier(table.name)} SET`,
    patchEntries.map(([key]) => `${quoteIdentifier(key)} = ?`).join(", "),
    whereClause.sql
  ].join(" ")

  database.prepare(sql).run(
    ...patchEntries.map(([, value]) => toSQLInputValue(value)),
    ...whereClause.values
  )

  return queryRecords(database, table, { where })
}

function deleteRecords(database: DatabaseSync, table: SQLiteTableSchema, where?: DatabaseWhere) {
  const whereClause = buildWhereClause(where)
  const result = database
    .prepare(`DELETE FROM ${quoteIdentifier(table.name)}${whereClause.sql}`)
    .run(...whereClause.values) as { changes?: number }

  return result.changes || 0
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "SQLite request failed"
}

export default defineEventHandler(async (event) => {
  assertBuildingApiAvailable()

  try {
    const sourceId = getRouterParam(event, "sourceId") || ""
    const body = await readBody<SQLiteRequestBody>(event)
    const source = assertSQLiteDataSource(body.source)

    if (source.id !== sourceId) {
      throw new Error("SQLite source id mismatch.")
    }

    const database = getDatabase(source)
    const tables = body.tables || source.config.tables

    initSchema(database, tables)

    if (body.operation === "connect" || body.operation === "initSchema") {
      return {
        ok: true
      }
    }

    if (!body.table) {
      throw new Error("SQLite table is required.")
    }

    const table = findTable(source, body.table)

    if (body.operation === "query") {
      return {
        data: queryRecords(database, table, body.options),
        ok: true
      }
    }

    if (body.operation === "insert") {
      return {
        data: insertRecord(database, table, body.record || {}),
        ok: true
      }
    }

    if (body.operation === "update") {
      return {
        data: updateRecords(database, table, body.where || {}, body.patch || {}),
        ok: true
      }
    }

    if (body.operation === "delete") {
      return {
        data: deleteRecords(database, table, body.where),
        ok: true
      }
    }

    throw new Error("Unsupported SQLite operation.")
  } catch (error) {
    setResponseStatus(event, 400)

    return {
      error: getErrorMessage(error),
      ok: false
    }
  }
})

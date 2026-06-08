import { existsSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { DatabaseSync } from "node:sqlite"
import type {
  AoiDataDriver,
  AoiDataOperation,
  AoiDataResourceSchema,
  AoiDataResult,
  AoiDataRuntimeError,
  AoiModelFieldSchema,
  AoiModelSchema,
  AoiMutationInput,
  AoiQueryInput,
  AoiSeedData,
  AoiSystemSchema
} from "@aoi/protocol"
import {
  cloneAoiSchema,
  isAoiDataRuntimeError,
  isAoiIdentifier,
  normalizeAoiSystemSchema,
  validateAoiSystemSchema
} from "@aoi/protocol"

export interface AoiSqliteNodeProjectStoreOptions {
  projectId: string
  schema: AoiSystemSchema
  seedData?: AoiSeedData
  sqlitePath?: string
  workspaceRoot?: string
}

export interface AoiProjectStoreStats {
  modelCount: number
  projectId: string
  resourceCount: number
  sqlitePath: string
}

export interface AoiSqliteNodeProjectStore {
  close: () => void
  driver: AoiDataDriver
  ensure: () => void
  loadSchema: () => AoiSystemSchema
  resetData: () => Promise<void>
  saveSchema: (schema: AoiSystemSchema) => void
  seedDefault: () => Promise<void>
  stats: () => AoiProjectStoreStats
}

type SqlValue = string | number | bigint | null
type AoiDataRuntimeException = Error & { aoiDataRuntimeError: AoiDataRuntimeError }

const META_TABLE = "aoi_project_meta"

export function findAoiWorkspaceRoot(start = process.cwd()) {
  let current = resolve(start)

  while (true) {
    if (existsSync(resolve(current, "pnpm-workspace.yaml"))) {
      return current
    }

    const parent = resolve(current, "..")

    if (parent === current) {
      return resolve(start)
    }

    current = parent
  }
}

export function resolveAoiProjectSqlitePath(projectId: string, workspaceRoot = findAoiWorkspaceRoot()) {
  assertIdentifier(projectId, "projectId")

  return resolve(workspaceRoot, "data", "projects", projectId, "project.sqlite")
}

export function createSqliteNodeProjectStore(options: AoiSqliteNodeProjectStoreOptions): AoiSqliteNodeProjectStore {
  const schemaRef = { current: prepareSchema(options.schema, false) }
  const seedData = options.seedData || {}
  const sqlitePath = options.sqlitePath || resolveAoiProjectSqlitePath(options.projectId, options.workspaceRoot)

  mkdirSync(dirname(sqlitePath), { recursive: true })

  const db = new DatabaseSync(sqlitePath)

  db.exec(`CREATE TABLE IF NOT EXISTS ${quoteIdent(META_TABLE)} (key TEXT PRIMARY KEY, value TEXT NOT NULL)`)

  function ensure() {
    const persistedSchema = readPersistedSchema()

    if (persistedSchema) {
      schemaRef.current = persistedSchema
    } else {
      writeSchema(schemaRef.current)
    }

    ensureModelTables(schemaRef.current)
  }

  function saveSchema(schema: AoiSystemSchema) {
    schemaRef.current = prepareSchema(schema, false)
    writeSchema(schemaRef.current)
    ensureModelTables(schemaRef.current)
  }

  function loadSchema() {
    const persistedSchema = readPersistedSchema()

    if (persistedSchema) {
      schemaRef.current = persistedSchema
    }

    return cloneAoiSchema(schemaRef.current)
  }

  function stats(): AoiProjectStoreStats {
    const schema = loadSchema()

    return {
      modelCount: schema.dataSources.flatMap((source) => source.models).length,
      projectId: options.projectId,
      resourceCount: schema.dataSources.flatMap((source) => source.resources).length,
      sqlitePath
    }
  }

  const driver: AoiDataDriver = {
    create: async (input) => createRecord(loadSchema(), input),
    delete: async (input) => deleteRecord(loadSchema(), input),
    query: async (input) => queryRecords(loadSchema(), input),
    reset: async () => resetData(),
    seed: async (nextSeedData) => seedRecords(loadSchema(), nextSeedData),
    update: async (input) => updateRecord(loadSchema(), input)
  }

  async function seedDefault() {
    await seedRecords(loadRecoverableSchema(), seedData)
  }

  async function resetData() {
    const schema = loadRecoverableSchema()

    assertGlobalOperationAllowed(schema, "reset")
    ensureModelTables(schema)

    schema.dataSources.flatMap((source) => source.models).forEach((model) => {
      assertIdentifier(model.id, "model.id")
      db.exec(`DELETE FROM ${quoteIdent(model.id)}`)
    })

    await seedRecords(schema, seedData)
  }

  function writeSchema(schema: AoiSystemSchema) {
    db.prepare(`INSERT OR REPLACE INTO ${quoteIdent(META_TABLE)} (key, value) VALUES (?, ?)`).run("schema", JSON.stringify(schema))
  }

  function readPersistedSchema() {
    const row = db.prepare(`SELECT value FROM ${quoteIdent(META_TABLE)} WHERE key = ?`).get("schema") as { value?: string } | undefined

    if (!row?.value) {
      return null
    }

    try {
      return prepareSchema(JSON.parse(row.value) as AoiSystemSchema, true)
    } catch (error) {
      if (getAoiDataRuntimeError(error)) {
        throw error
      }

      failDataRuntime({
        code: "SCHEMA_PARSE_FAILED",
        message: "Stored project Schema could not be parsed.",
        recoverable: true
      })
    }
  }

  function loadRecoverableSchema() {
    try {
      return loadSchema()
    } catch (error) {
      const dataError = getAoiDataRuntimeError(error)

      if (!dataError?.recoverable) {
        throw error
      }

      writeSchema(schemaRef.current)
      ensureModelTables(schemaRef.current)
      return cloneAoiSchema(schemaRef.current)
    }
  }

  function ensureModelTables(schema: AoiSystemSchema) {
    schema.dataSources.flatMap((source) => source.models).forEach((model) => ensureModelTable(model))
  }

  function ensureModelTable(model: AoiModelSchema) {
    assertIdentifier(model.id, "model.id")

    const fields = normalizeModelFields(model)
    const columns = fields.map((field) => {
      assertIdentifier(field.id, "field.id")

      if (field.id === "id") {
        return `${quoteIdent(field.id)} TEXT PRIMARY KEY`
      }

      return `${quoteIdent(field.id)} ${sqlType(field)}`
    })

    db.exec(`CREATE TABLE IF NOT EXISTS ${quoteIdent(model.id)} (${columns.join(", ")})`)

    const existing = new Set((db.prepare(`PRAGMA table_info(${quoteIdent(model.id)})`).all() as Array<{ name: string }>).map((column) => column.name))

    fields.forEach((field) => {
      if (!existing.has(field.id)) {
        db.exec(`ALTER TABLE ${quoteIdent(model.id)} ADD COLUMN ${quoteIdent(field.id)} ${sqlType(field)}`)
      }
    })
  }

  function queryRecords(schema: AoiSystemSchema, input: AoiQueryInput): AoiDataResult {
    const { model, resource } = resolveResource(schema, input.resourceId)

    assertResourceOperationAllowed(resource, "query")
    ensureModelTable(model)

    const limit = Number.isFinite(input.limit) ? Math.min(Math.max(input.limit || 50, 1), 500) : 50
    const rows = db.prepare(`SELECT * FROM ${quoteIdent(model.id)} ORDER BY ${quoteIdent("id")} LIMIT ?`).all(limit) as Array<Record<string, unknown>>
    const count = db.prepare(`SELECT COUNT(*) as value FROM ${quoteIdent(model.id)}`).get() as { value: number }

    return {
      items: rows.map((row) => deserializeRecord(model, row)),
      totalCount: count.value
    }
  }

  function createRecord(schema: AoiSystemSchema, input: AoiMutationInput): AoiDataResult {
    const { model, resource } = resolveResource(schema, input.resourceId)

    assertResourceOperationAllowed(resource, "create")
    ensureModelTable(model)

    const record = normalizeRecord(model, {
      id: input.record?.id || randomUUID(),
      ...input.record
    })
    const fields = normalizeModelFields(model)
    const names = fields.map((field) => quoteIdent(field.id))
    const placeholders = fields.map(() => "?")
    const values = fields.map((field) => serializeFieldValue(field, record[field.id]))

    db.prepare(`INSERT INTO ${quoteIdent(model.id)} (${names.join(", ")}) VALUES (${placeholders.join(", ")})`).run(...values)

    return { items: [record], totalCount: 1 }
  }

  function updateRecord(schema: AoiSystemSchema, input: AoiMutationInput): AoiDataResult {
    const { model, resource } = resolveResource(schema, input.resourceId)

    assertResourceOperationAllowed(resource, "update")
    ensureModelTable(model)

    const id = String(input.id || input.record?.id || "")

    if (!id) {
      failDataRuntime({
        code: "INVALID_INPUT",
        message: "An id is required for update.",
        operation: "update",
        recoverable: false,
        resourceId: input.resourceId
      })
    }

    const current = db.prepare(`SELECT * FROM ${quoteIdent(model.id)} WHERE id = ?`).get(id) as Record<string, unknown> | undefined

    if (!current) {
      failDataRuntime({
        code: "MISSING_RECORD",
        message: `Record ${id} does not exist in ${input.resourceId}.`,
        operation: "update",
        recoverable: true,
        resourceId: input.resourceId
      })
    }

    const record = normalizeRecord(model, {
      ...deserializeRecord(model, current),
      ...input.record,
      id
    })
    const fields = normalizeModelFields(model).filter((field) => field.id !== "id")
    const assignments = fields.map((field) => `${quoteIdent(field.id)} = ?`)
    const values = fields.map((field) => serializeFieldValue(field, record[field.id]))

    db.prepare(`UPDATE ${quoteIdent(model.id)} SET ${assignments.join(", ")} WHERE id = ?`).run(...values, id)

    return { items: [record], totalCount: 1 }
  }

  function deleteRecord(schema: AoiSystemSchema, input: AoiMutationInput): AoiDataResult {
    const { model, resource } = resolveResource(schema, input.resourceId)

    assertResourceOperationAllowed(resource, "delete")
    ensureModelTable(model)

    const id = String(input.id || input.record?.id || "")

    if (!id) {
      failDataRuntime({
        code: "INVALID_INPUT",
        message: "An id is required for delete.",
        operation: "delete",
        recoverable: false,
        resourceId: input.resourceId
      })
    }

    const current = db.prepare(`SELECT * FROM ${quoteIdent(model.id)} WHERE id = ?`).get(id) as Record<string, unknown> | undefined

    if (!current) {
      failDataRuntime({
        code: "MISSING_RECORD",
        message: `Record ${id} does not exist in ${input.resourceId}.`,
        operation: "delete",
        recoverable: true,
        resourceId: input.resourceId
      })
    }

    db.prepare(`DELETE FROM ${quoteIdent(model.id)} WHERE id = ?`).run(id)

    return {
      items: [deserializeRecord(model, current)],
      totalCount: 1
    }
  }

  async function seedRecords(schema: AoiSystemSchema, nextSeedData: AoiSeedData) {
    assertGlobalOperationAllowed(schema, "seed")
    ensureModelTables(schema)

    for (const model of schema.dataSources.flatMap((source) => source.models)) {
      const records = nextSeedData[model.id] || []

      for (const record of records) {
        const normalized = normalizeRecord(model, {
          id: record.id || randomUUID(),
          ...record
        })
        const fields = normalizeModelFields(model)
        const names = fields.map((field) => quoteIdent(field.id))
        const placeholders = fields.map(() => "?")
        const values = fields.map((field) => serializeFieldValue(field, normalized[field.id]))

        db.prepare(`INSERT OR REPLACE INTO ${quoteIdent(model.id)} (${names.join(", ")}) VALUES (${placeholders.join(", ")})`).run(...values)
      }
    }
  }

  return {
    close: () => db.close(),
    driver,
    ensure,
    loadSchema,
    resetData,
    saveSchema,
    seedDefault,
    stats
  }
}

function resolveResource(schema: AoiSystemSchema, resourceId: string): { model: AoiModelSchema, resource: AoiDataResourceSchema } {
  for (const source of schema.dataSources) {
    const resource = source.resources.find((item) => item.id === resourceId)

    if (resource) {
      const model = source.models.find((item) => item.id === resource.modelId)

      if (!model) {
        failDataRuntime({
          code: "SCHEMA_INVALID",
          message: `Model ${resource.modelId} is not configured.`,
          recoverable: true,
          resourceId
        })
      }

      return { model, resource }
    }
  }

  failDataRuntime({
    code: "RESOURCE_NOT_FOUND",
    message: `Resource ${resourceId} is not configured.`,
    recoverable: true,
    resourceId
  })
}

export function getAoiDataRuntimeError(error: unknown): AoiDataRuntimeError | null {
  if (error && typeof error === "object" && "aoiDataRuntimeError" in error) {
    const dataError = (error as { aoiDataRuntimeError?: unknown }).aoiDataRuntimeError

    return isAoiDataRuntimeError(dataError) ? dataError : null
  }

  return isAoiDataRuntimeError(error) ? error : null
}

function prepareSchema(schema: AoiSystemSchema, recoverable: boolean) {
  const normalized = normalizeAoiSystemSchema(schema)
  const result = validateAoiSystemSchema(normalized)

  if (!result.ok) {
    failDataRuntime({
      code: "SCHEMA_INVALID",
      details: result.issues,
      message: `Project Schema is invalid: ${formatIssues(result.issues)}`,
      recoverable
    })
  }

  return result.normalizedSchema
}

function assertResourceOperationAllowed(resource: AoiDataResourceSchema, operation: AoiDataOperation) {
  if (!resource.operations.includes(operation)) {
    failDataRuntime({
      code: "OPERATION_NOT_ALLOWED",
      message: `Resource ${resource.id} does not allow ${operation}.`,
      operation,
      recoverable: false,
      resourceId: resource.id
    })
  }
}

function assertGlobalOperationAllowed(schema: AoiSystemSchema, operation: "seed" | "reset") {
  const resources = schema.dataSources.flatMap((source) => source.resources)

  schema.dataSources.flatMap((source) => source.models).forEach((model) => {
    const modelResources = resources.filter((resource) => resource.modelId === model.id)

    if (modelResources.length && modelResources.every((resource) => !resource.operations.includes(operation))) {
      failDataRuntime({
        code: "OPERATION_NOT_ALLOWED",
        message: `Model ${model.id} has no resource that allows ${operation}.`,
        operation,
        recoverable: false
      })
    }
  })
}

function failDataRuntime(error: AoiDataRuntimeError): never {
  const exception = new Error(error.message) as AoiDataRuntimeException

  exception.name = "AoiDataRuntimeError"
  exception.aoiDataRuntimeError = error
  throw exception
}

function formatIssues(issues: Array<{ message: string, path: string }>) {
  return issues.slice(0, 5).map((issue) => `${issue.path}: ${issue.message}`).join("; ")
}

function normalizeModelFields(model: AoiModelSchema) {
  const hasId = model.fields.some((field) => field.id === "id")

  return hasId ? model.fields : [{ id: "id", label: "ID", type: "string" } satisfies AoiModelFieldSchema, ...model.fields]
}

function normalizeRecord(model: AoiModelSchema, record: Record<string, unknown>) {
  const normalized: Record<string, unknown> = {}

  normalizeModelFields(model).forEach((field) => {
    const value = record[field.id]

    normalized[field.id] = value === undefined ? defaultFieldValue(field) : value
  })

  return normalized
}

function deserializeRecord(model: AoiModelSchema, row: Record<string, unknown>) {
  const record: Record<string, unknown> = {}

  normalizeModelFields(model).forEach((field) => {
    const value = row[field.id]

    if (field.type === "boolean") {
      record[field.id] = value === 1 || value === true
    } else {
      record[field.id] = value
    }
  })

  return record
}

function defaultFieldValue(field: AoiModelFieldSchema) {
  if (field.defaultValue !== undefined) {
    return field.defaultValue
  }

  if (field.type === "boolean") {
    return false
  }

  if (field.type === "integer" || field.type === "number") {
    return 0
  }

  return ""
}

function serializeFieldValue(field: AoiModelFieldSchema, value: unknown): SqlValue {
  if (value === null || value === undefined) {
    return null
  }

  if (field.type === "boolean") {
    return value ? 1 : 0
  }

  if (field.type === "integer") {
    return Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0
  }

  if (field.type === "number") {
    return Number.isFinite(Number(value)) ? Number(value) : 0
  }

  if (typeof value === "object") {
    return JSON.stringify(value)
  }

  return String(value)
}

function sqlType(field: AoiModelFieldSchema) {
  if (field.type === "integer" || field.type === "boolean") {
    return "INTEGER"
  }

  if (field.type === "number") {
    return "REAL"
  }

  return "TEXT"
}

function quoteIdent(value: string) {
  assertIdentifier(value, "identifier")

  return `"${value}"`
}

function assertIdentifier(value: string, label: string) {
  if (!isAoiIdentifier(value)) {
    failDataRuntime({
      code: "INVALID_INPUT",
      message: `Invalid ${label}: ${value}`,
      recoverable: false
    })
  }
}

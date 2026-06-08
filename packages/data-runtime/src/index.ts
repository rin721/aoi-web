import { existsSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { createHash, randomUUID } from "node:crypto"
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
  AoiSchemaMigrationOperation,
  AoiSchemaMigrationPlan,
  AoiSchemaMigrationResult,
  AoiSeedData,
  AoiSystemSchema
} from "@aoi/protocol"
import {
  cloneAoiSchema,
  isAoiDataRuntimeError,
  isAoiIdentifier,
  normalizeAoiSystemSchema,
  validateAoiSchemaMigrationPlan,
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
  applySchemaMigration: (plan: AoiSchemaMigrationPlan) => Promise<AoiSchemaMigrationResult>
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
    const currentSchema = loadSchema()
    const nextSchema = prepareSchema(schema, false)

    assertNonDestructiveSchemaSave(currentSchema, nextSchema)
    schemaRef.current = nextSchema
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

  async function applySchemaMigration(plan: AoiSchemaMigrationPlan): Promise<AoiSchemaMigrationResult> {
    const currentSchema = loadSchema()
    const validation = validateAoiSchemaMigrationPlan(plan, currentSchema)

    if (!validation.ok) {
      failDataRuntime({
        code: "MIGRATION_INVALID",
        details: validation.issues,
        message: `Schema migration is invalid: ${formatIssues(validation.issues)}`,
        recoverable: false
      })
    }

    const destructive = plan.operations.some(isDestructiveMigrationOperation)

    if (destructive && !plan.confirmDestructive) {
      failDataRuntime({
        code: "MIGRATION_REQUIRES_CONFIRMATION",
        message: "Destructive Schema migration requires confirmation.",
        recoverable: false
      })
    }

    const previousSchemaHash = hashSchema(currentSchema)
    const nextSchema = validation.normalizedSchema
    const nextSchemaHash = hashSchema(nextSchema)
    const result: AoiSchemaMigrationResult = {
      appliedAt: new Date().toISOString(),
      destructive,
      nextSchemaHash,
      operationCount: plan.operations.length,
      previousSchemaHash,
      summary: plan.summary || summarizeMigration(plan.operations)
    }

    db.exec("BEGIN IMMEDIATE")

    try {
      for (const operation of plan.operations) {
        applyMigrationOperation(nextSchema, operation)
      }

      schemaRef.current = cloneAoiSchema(nextSchema)
      writeSchema(schemaRef.current)
      appendMigrationHistory(result)
      db.exec("COMMIT")
    } catch (error) {
      db.exec("ROLLBACK")
      throw error
    }

    return result
  }

  function writeSchema(schema: AoiSystemSchema) {
    db.prepare(`INSERT OR REPLACE INTO ${quoteIdent(META_TABLE)} (key, value) VALUES (?, ?)`).run("schema", JSON.stringify(schema))
  }

  function appendMigrationHistory(result: AoiSchemaMigrationResult) {
    const row = db.prepare(`SELECT value FROM ${quoteIdent(META_TABLE)} WHERE key = ?`).get("migrations") as { value?: string } | undefined
    let history: AoiSchemaMigrationResult[] = []

    if (row?.value) {
      try {
        history = JSON.parse(row.value) as AoiSchemaMigrationResult[]
      } catch {
        history = []
      }
    }

    db.prepare(`INSERT OR REPLACE INTO ${quoteIdent(META_TABLE)} (key, value) VALUES (?, ?)`)
      .run("migrations", JSON.stringify(appendMigrationHistoryEntry(history, result)))
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

  function applyMigrationOperation(nextSchema: AoiSystemSchema, operation: AoiSchemaMigrationOperation) {
    switch (operation.kind) {
      case "model.create":
        ensureModelTable(operation.model)
        break
      case "model.rename":
        renameModelTable(operation.fromId, operation.toId, modelById(nextSchema, operation.toId))
        break
      case "model.delete":
        dropModelTable(operation.modelId)
        break
      case "field.create":
        addModelField(modelById(nextSchema, operation.modelId), operation.field)
        break
      case "field.rename":
        renameModelField(operation.modelId, operation.fromId, operation.toId, modelById(nextSchema, operation.modelId))
        break
      case "field.delete":
        if (operation.fieldId === "id") {
          failDataRuntime({
            code: "MIGRATION_INVALID",
            message: "The id field cannot be deleted.",
            recoverable: false
          })
        }
        rebuildModelTable(operation.modelId, modelById(nextSchema, operation.modelId))
        break
      case "field.updateMeta":
        rebuildModelTable(operation.modelId, modelById(nextSchema, operation.modelId))
        break
      case "resource.create":
      case "resource.rename":
      case "resource.delete":
      case "resource.update":
        break
    }
  }

  function renameModelTable(fromId: string, toId: string, nextModel: AoiModelSchema) {
    assertIdentifier(fromId, "model.fromId")
    assertIdentifier(toId, "model.toId")

    if (tableExists(fromId) && !tableExists(toId)) {
      db.exec(`ALTER TABLE ${quoteIdent(fromId)} RENAME TO ${quoteIdent(toId)}`)
    }

    ensureModelTable(nextModel)
  }

  function dropModelTable(modelId: string) {
    assertIdentifier(modelId, "model.id")
    db.exec(`DROP TABLE IF EXISTS ${quoteIdent(modelId)}`)
  }

  function addModelField(model: AoiModelSchema, field: AoiModelFieldSchema) {
    ensureModelTable(model)

    if (!columnExists(model.id, field.id)) {
      db.exec(`ALTER TABLE ${quoteIdent(model.id)} ADD COLUMN ${quoteIdent(field.id)} ${sqlType(field)}`)
    }
  }

  function renameModelField(modelId: string, fromId: string, toId: string, nextModel: AoiModelSchema) {
    assertIdentifier(modelId, "model.id")
    assertIdentifier(fromId, "field.fromId")
    assertIdentifier(toId, "field.toId")

    if (!tableExists(modelId)) {
      ensureModelTable(nextModel)
      return
    }

    if (columnExists(modelId, fromId) && !columnExists(modelId, toId)) {
      db.exec(`ALTER TABLE ${quoteIdent(modelId)} RENAME COLUMN ${quoteIdent(fromId)} TO ${quoteIdent(toId)}`)
    }

    ensureModelTable(nextModel)
  }

  function rebuildModelTable(modelId: string, nextModel: AoiModelSchema) {
    assertIdentifier(modelId, "model.id")

    if (!tableExists(modelId)) {
      ensureModelTable(nextModel)
      return
    }

    const tempTable = `AoiTemp${randomUUID().replace(/-/g, "").slice(0, 24)}`
    const fields = normalizeModelFields(nextModel)
    const columns = fields.map((field) => field.id === "id" ? `${quoteIdent(field.id)} TEXT PRIMARY KEY` : `${quoteIdent(field.id)} ${sqlType(field)}`)
    const existingColumns = new Set(tableColumns(modelId))
    const copiedFields = fields.filter((field) => existingColumns.has(field.id))

    db.exec(`CREATE TABLE ${quoteIdent(tempTable)} (${columns.join(", ")})`)

    if (copiedFields.length) {
      const copiedNames = copiedFields.map((field) => quoteIdent(field.id)).join(", ")

      db.exec(`INSERT INTO ${quoteIdent(tempTable)} (${copiedNames}) SELECT ${copiedNames} FROM ${quoteIdent(modelId)}`)
    }

    db.exec(`DROP TABLE ${quoteIdent(modelId)}`)
    db.exec(`ALTER TABLE ${quoteIdent(tempTable)} RENAME TO ${quoteIdent(modelId)}`)
    ensureModelTable(nextModel)
  }

  function tableExists(tableName: string) {
    assertIdentifier(tableName, "tableName")
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName)

    return Boolean(row)
  }

  function columnExists(tableName: string, columnName: string) {
    return tableColumns(tableName).includes(columnName)
  }

  function tableColumns(tableName: string) {
    assertIdentifier(tableName, "tableName")

    if (!tableExists(tableName)) {
      return []
    }

    return (db.prepare(`PRAGMA table_info(${quoteIdent(tableName)})`).all() as Array<{ name: string }>).map((column) => column.name)
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
    applySchemaMigration,
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

function modelById(schema: AoiSystemSchema, modelId: string) {
  const model = schema.dataSources.flatMap((source) => source.models).find((item) => item.id === modelId)

  if (!model) {
    failDataRuntime({
      code: "MIGRATION_INVALID",
      message: `Model ${modelId} is not configured in the next Schema.`,
      recoverable: false
    })
  }

  return model
}

function appendMigrationHistoryEntry(history: AoiSchemaMigrationResult[], result: AoiSchemaMigrationResult) {
  return [...history, result].slice(-50)
}

function assertNonDestructiveSchemaSave(currentSchema: AoiSystemSchema, nextSchema: AoiSystemSchema) {
  const nextModels = new Map(nextSchema.dataSources.flatMap((source) => source.models).map((model) => [model.id, model]))
  const nextResources = new Map(nextSchema.dataSources.flatMap((source) => source.resources).map((resource) => [resource.id, resource]))

  for (const model of currentSchema.dataSources.flatMap((source) => source.models)) {
    const nextModel = nextModels.get(model.id)

    if (!nextModel) {
      failDataRuntime({
        code: "MIGRATION_REQUIRES_CONFIRMATION",
        message: `Model ${model.id} cannot be removed by saveSchema. Use applySchemaMigration with destructive confirmation.`,
        recoverable: false
      })
    }

    const nextFields = new Map(normalizeModelFields(nextModel).map((field) => [field.id, field]))

    for (const field of normalizeModelFields(model)) {
      const nextField = nextFields.get(field.id)

      if (!nextField) {
        failDataRuntime({
          code: "MIGRATION_REQUIRES_CONFIRMATION",
          message: `Field ${model.id}.${field.id} cannot be removed by saveSchema. Use applySchemaMigration with destructive confirmation.`,
          recoverable: false
        })
      }

      if (nextField.type !== field.type) {
        failDataRuntime({
          code: "MIGRATION_INVALID",
          message: `Field ${model.id}.${field.id} type changes must go through applySchemaMigration.`,
          recoverable: false
        })
      }
    }
  }

  for (const resource of currentSchema.dataSources.flatMap((source) => source.resources)) {
    if (!nextResources.has(resource.id)) {
      failDataRuntime({
        code: "MIGRATION_REQUIRES_CONFIRMATION",
        message: `Resource ${resource.id} cannot be removed by saveSchema. Use applySchemaMigration.`,
        recoverable: false
      })
    }
  }
}

function isDestructiveMigrationOperation(operation: AoiSchemaMigrationOperation) {
  return operation.kind === "model.delete" || operation.kind === "field.delete"
}

function hashSchema(schema: AoiSystemSchema) {
  return createHash("sha256")
    .update(JSON.stringify(normalizeAoiSystemSchema(schema)))
    .digest("hex")
}

function summarizeMigration(operations: AoiSchemaMigrationOperation[]) {
  if (!operations.length) {
    return "Schema migration"
  }

  return operations.map((operation) => {
    switch (operation.kind) {
      case "model.create":
        return `create model ${operation.model.id}`
      case "model.rename":
        return `rename model ${operation.fromId} to ${operation.toId}`
      case "model.delete":
        return `delete model ${operation.modelId}`
      case "field.create":
        return `create field ${operation.modelId}.${operation.field.id}`
      case "field.rename":
        return `rename field ${operation.modelId}.${operation.fromId} to ${operation.toId}`
      case "field.delete":
        return `delete field ${operation.modelId}.${operation.fieldId}`
      case "field.updateMeta":
        return `update field ${operation.modelId}.${operation.field.id}`
      case "resource.create":
        return `create resource ${operation.resource.id}`
      case "resource.rename":
        return `rename resource ${operation.fromId} to ${operation.toId}`
      case "resource.delete":
        return `delete resource ${operation.resourceId}`
      case "resource.update":
        return `update resource ${operation.resource.id}`
    }
  }).join("; ")
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

import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { DatabaseSync } from "node:sqlite"
import test from "node:test"
import {
  adminCrudSeedData,
  adminCrudSystemSchema
} from "../../templates/admin-crud/src/index"
import {
  cloneAoiSchema,
  type AoiDataResourceSchema,
  type AoiModelSchema,
  type AoiNodeSchema,
  type AoiSystemSchema
} from "@aoi/protocol"
import {
  createSqliteNodeProjectStore,
  getAoiDataRuntimeError
} from "./index"

test("runs seed, reset, and CRUD through the sqlite-node adapter", async () => {
  const workspaceRoot = await mkdtemp(resolve(tmpdir(), "aoi-data-runtime-"))

  try {
    const store = createSqliteNodeProjectStore({
      projectId: "admin_crud",
      schema: adminCrudSystemSchema,
      seedData: adminCrudSeedData,
      workspaceRoot
    })

    try {
      await store.seedDefault()

      const seeded = await store.driver.query({ limit: 20, resourceId: "customersResource" })
      assert.equal(seeded.totalCount, 3)

      await store.driver.create({
        record: {
          createdAt: "2026-06-08T00:00:00.000Z",
          id: "cust_test",
          name: "Test Customer",
          owner: "Aoi",
          segment: "SMB",
          status: "active"
        },
        resourceId: "customersResource"
      })

      await store.driver.update({
        id: "cust_test",
        record: { status: "paused" },
        resourceId: "customersResource"
      })

      const updated = await store.driver.query({ limit: 20, resourceId: "customersResource" })
      assert.equal(updated.items.find((item) => item.id === "cust_test")?.status, "paused")

      await store.driver.delete({ id: "cust_test", resourceId: "customersResource" })
      await store.resetData()

      const reset = await store.driver.query({ limit: 20, resourceId: "customersResource" })
      assert.equal(reset.totalCount, 3)
    } finally {
      store.close()
    }
  } finally {
    await rm(workspaceRoot, { force: true, recursive: true })
  }
})

test("keeps persisted schema instead of overwriting it with the default schema", async () => {
  const workspaceRoot = await mkdtemp(resolve(tmpdir(), "aoi-data-runtime-"))
  const sqlitePath = resolve(workspaceRoot, "project.sqlite")

  try {
    const persistedSchema = cloneAoiSchema(adminCrudSystemSchema)
    persistedSchema.app.name = "Persisted Admin"

    const firstStore = createSqliteNodeProjectStore({
      projectId: "admin_crud",
      schema: persistedSchema,
      seedData: adminCrudSeedData,
      sqlitePath
    })

    firstStore.saveSchema(persistedSchema)
    firstStore.close()

    const secondStore = createSqliteNodeProjectStore({
      projectId: "admin_crud",
      schema: adminCrudSystemSchema,
      seedData: adminCrudSeedData,
      sqlitePath
    })

    try {
      assert.equal(secondStore.loadSchema().app.name, "Persisted Admin")
    } finally {
      secondStore.close()
    }
  } finally {
    await rm(workspaceRoot, { force: true, recursive: true })
  }
})

test("enforces operation allowlists and missing-record errors", async () => {
  const workspaceRoot = await mkdtemp(resolve(tmpdir(), "aoi-data-runtime-"))
  const schema = cloneAoiSchema(adminCrudSystemSchema)

  schema.dataSources[0].resources[0].operations = ["query"]

  try {
    const store = createSqliteNodeProjectStore({
      projectId: "admin_crud",
      schema,
      workspaceRoot
    })

    try {
      await assert.rejects(
        () => store.driver.create({ record: { id: "blocked" }, resourceId: "customersResource" }),
        (error) => getAoiDataRuntimeError(error)?.code === "OPERATION_NOT_ALLOWED"
      )

      schema.dataSources[0].resources[0].operations = ["query", "update", "delete"]
      store.saveSchema(schema)

      await assert.rejects(
        () => store.driver.update({ id: "missing", record: { name: "Missing" }, resourceId: "customersResource" }),
        (error) => getAoiDataRuntimeError(error)?.code === "MISSING_RECORD"
      )
      await assert.rejects(
        () => store.driver.delete({ id: "missing", resourceId: "customersResource" }),
        (error) => getAoiDataRuntimeError(error)?.code === "MISSING_RECORD"
      )
    } finally {
      store.close()
    }
  } finally {
    await rm(workspaceRoot, { force: true, recursive: true })
  }
})

test("applies controlled sqlite schema migrations", async () => {
  const workspaceRoot = await mkdtemp(resolve(tmpdir(), "aoi-data-runtime-"))

  try {
    const store = createSqliteNodeProjectStore({
      projectId: "admin_crud",
      schema: adminCrudSystemSchema,
      seedData: adminCrudSeedData,
      workspaceRoot
    })

    try {
      await store.seedDefault()

      const addedFieldSchema = store.loadSchema()
      const source = addedFieldSchema.dataSources[0]
      const customers = source.models.find((model) => model.id === "customers")

      assert.ok(customers)
      customers.fields.push({ id: "tier", label: "Tier", type: "string" })

      await store.applySchemaMigration({
        nextSchema: addedFieldSchema,
        operations: [{
          dataSourceId: source.id,
          field: { id: "tier", label: "Tier", type: "string" },
          kind: "field.create",
          modelId: "customers"
        }]
      })

      await store.driver.create({
        record: {
          createdAt: "2026-06-08T00:00:00.000Z",
          id: "cust_migration",
          name: "Migration Customer",
          owner: "Aoi",
          segment: "Enterprise",
          status: "active",
          tier: "gold"
        },
        resourceId: "customersResource"
      })

      const renamedFieldSchema = store.loadSchema()
      const renamedCustomers = renamedFieldSchema.dataSources[0].models.find((model) => model.id === "customers")
      const tierField = renamedCustomers?.fields.find((field) => field.id === "tier")

      assert.ok(renamedCustomers)
      assert.ok(tierField)
      tierField.id = "tierCode"
      tierField.label = "Tier Code"

      await store.applySchemaMigration({
        nextSchema: renamedFieldSchema,
        operations: [{
          dataSourceId: source.id,
          fromId: "tier",
          kind: "field.rename",
          modelId: "customers",
          toId: "tierCode"
        }]
      })

      const afterRename = await store.driver.query({ limit: 50, resourceId: "customersResource" })
      assert.equal(afterRename.items.find((item) => item.id === "cust_migration")?.tierCode, "gold")

      const deletedFieldSchema = store.loadSchema()
      const deleteCustomers = deletedFieldSchema.dataSources[0].models.find((model) => model.id === "customers")

      assert.ok(deleteCustomers)
      deleteCustomers.fields = deleteCustomers.fields.filter((field) => field.id !== "tierCode")

      await assert.rejects(
        () => store.applySchemaMigration({
          nextSchema: deletedFieldSchema,
          operations: [{
            dataSourceId: source.id,
            fieldId: "tierCode",
            kind: "field.delete",
            modelId: "customers"
          }]
        }),
        (error) => getAoiDataRuntimeError(error)?.code === "MIGRATION_REQUIRES_CONFIRMATION"
      )

      await store.applySchemaMigration({
        confirmDestructive: true,
        nextSchema: deletedFieldSchema,
        operations: [{
          dataSourceId: source.id,
          fieldId: "tierCode",
          kind: "field.delete",
          modelId: "customers"
        }]
      })

      const renamedModelSchema = store.loadSchema()
      const renameSource = renamedModelSchema.dataSources[0]
      const customersModel = renameSource.models.find((model) => model.id === "customers")
      const customersResource = renameSource.resources.find((resource) => resource.id === "customersResource")

      assert.ok(customersModel)
      assert.ok(customersResource)
      customersModel.id = "clients"
      customersResource.modelId = "clients"
      renamedModelSchema.modules.forEach((module) => {
        module.modelIds = module.modelIds.map((modelId) => modelId === "customers" ? "clients" : modelId)
      })
      visitSchemaNodes(renamedModelSchema, (node) => {
        if (node.props.modelId === "customers") {
          node.props.modelId = "clients"
        }
      })

      await store.applySchemaMigration({
        nextSchema: renamedModelSchema,
        operations: [
          {
            dataSourceId: renameSource.id,
            fromId: "customers",
            kind: "model.rename",
            toId: "clients"
          },
          {
            dataSourceId: renameSource.id,
            kind: "resource.update",
            resource: customersResource
          }
        ]
      })

      const afterModelRename = await store.driver.query({ limit: 50, resourceId: "customersResource" })
      assert.ok(afterModelRename.items.some((item) => item.id === "cust_migration"))

      const scratchSchema = store.loadSchema()
      const scratchSource = scratchSchema.dataSources[0]
      const scratchModel: AoiModelSchema = {
        displayField: "name",
        fields: [
          { id: "id", label: "ID", type: "string" },
          { id: "name", label: "Name", type: "string" }
        ],
        id: "migrationScratch",
        label: "Migration Scratch",
        pluralLabel: "Migration Scratch"
      }
      const scratchResource: AoiDataResourceSchema = {
        driver: scratchSource.driver,
        id: "migrationScratchResource",
        label: "Migration Scratch Resource",
        modelId: "migrationScratch",
        operations: ["query", "create", "update", "delete", "seed", "reset"]
      }

      scratchSource.models.push(scratchModel)
      scratchSource.resources.push(scratchResource)

      await store.applySchemaMigration({
        nextSchema: scratchSchema,
        operations: [
          { dataSourceId: scratchSource.id, kind: "model.create", model: scratchModel },
          { dataSourceId: scratchSource.id, kind: "resource.create", resource: scratchResource }
        ]
      })

      const deletedModelSchema = store.loadSchema()
      const deleteSource = deletedModelSchema.dataSources[0]

      deleteSource.models = deleteSource.models.filter((model) => model.id !== "migrationScratch")
      deleteSource.resources = deleteSource.resources.filter((resource) => resource.modelId !== "migrationScratch")

      await assert.rejects(
        () => store.applySchemaMigration({
          nextSchema: deletedModelSchema,
          operations: [
            { dataSourceId: deleteSource.id, kind: "resource.delete", resourceId: "migrationScratchResource" },
            { dataSourceId: deleteSource.id, kind: "model.delete", modelId: "migrationScratch" }
          ]
        }),
        (error) => getAoiDataRuntimeError(error)?.code === "MIGRATION_REQUIRES_CONFIRMATION"
      )

      await store.applySchemaMigration({
        confirmDestructive: true,
        nextSchema: deletedModelSchema,
        operations: [
          { dataSourceId: deleteSource.id, kind: "resource.delete", resourceId: "migrationScratchResource" },
          { dataSourceId: deleteSource.id, kind: "model.delete", modelId: "migrationScratch" }
        ]
      })

      assert.equal(store.loadSchema().dataSources[0].models.some((model) => model.id === "migrationScratch"), false)
    } finally {
      store.close()
    }
  } finally {
    await rm(workspaceRoot, { force: true, recursive: true })
  }
})

test("reports corrupted stored schema and lets reset recover from the default schema", async () => {
  const workspaceRoot = await mkdtemp(resolve(tmpdir(), "aoi-data-runtime-"))
  const sqlitePath = resolve(workspaceRoot, "project.sqlite")

  try {
    const store = createSqliteNodeProjectStore({
      projectId: "admin_crud",
      schema: adminCrudSystemSchema,
      seedData: adminCrudSeedData,
      sqlitePath
    })

    store.saveSchema(adminCrudSystemSchema)
    store.close()

    const db = new DatabaseSync(sqlitePath)
    db.prepare("UPDATE aoi_project_meta SET value = ? WHERE key = ?").run("{bad json", "schema")
    db.close()

    const recoveredStore = createSqliteNodeProjectStore({
      projectId: "admin_crud",
      schema: adminCrudSystemSchema,
      seedData: adminCrudSeedData,
      sqlitePath
    })

    try {
      assert.throws(
        () => recoveredStore.loadSchema(),
        (error) => getAoiDataRuntimeError(error)?.code === "SCHEMA_PARSE_FAILED"
      )

      await recoveredStore.resetData()

      const result = await recoveredStore.driver.query({ limit: 20, resourceId: "customersResource" })
      assert.equal(result.totalCount, 3)
    } finally {
      recoveredStore.close()
    }
  } finally {
    await rm(workspaceRoot, { force: true, recursive: true })
  }
})

function visitSchemaNodes(schema: AoiSystemSchema, visitor: (node: AoiNodeSchema) => void) {
  const visit = (node: AoiNodeSchema) => {
    visitor(node)
    ;(node.children || []).forEach(visit)
    Object.values(node.slots || {}).flat().forEach(visit)
  }

  schema.pages.forEach((page) => visit(page.root))
}

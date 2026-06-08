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
  cloneAoiSchema
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

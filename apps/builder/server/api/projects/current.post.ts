import type {
  AoiSchemaMigrationPlan,
  AoiSchemaMigrationResult,
  AoiSystemSchema
} from "@aoi/protocol"
import {
  normalizeAoiSystemSchema,
  validateAoiSystemSchema
} from "@aoi/protocol"
import { createAdminCrudStore } from "../../utils/admin-crud-store"
import { throwAoiHttpError } from "../../utils/aoi-http-error"

type ProjectAction = "applySchemaMigration" | "resetData" | "saveSchema" | "seedData"

interface ProjectBody {
  action?: ProjectAction
  migrationPlan?: AoiSchemaMigrationPlan
  schema?: AoiSystemSchema
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ProjectBody>(event)
  let store: ReturnType<typeof createAdminCrudStore> | null = null

  try {
    store = createAdminCrudStore()
    let migrationResult: AoiSchemaMigrationResult | null = null

    if (body.action === "saveSchema") {
      if (!body.schema) {
        throw createError({ statusCode: 400, statusMessage: "Schema is required." })
      }

      const validation = validateAoiSystemSchema(normalizeAoiSystemSchema(body.schema))

      if (!validation.ok) {
        throw createError({
          data: { validationIssues: validation.issues },
          statusCode: 400,
          statusMessage: `Schema validation failed: ${validation.issues.map((issue) => issue.message).join("; ")}`
        })
      }

      store.saveSchema(validation.normalizedSchema)
    } else if (body.action === "applySchemaMigration") {
      if (!body.migrationPlan) {
        throw createError({ statusCode: 400, statusMessage: "Migration plan is required." })
      }

      migrationResult = await store.applySchemaMigration(body.migrationPlan)
    } else if (body.action === "resetData") {
      await store.resetData()
    } else if (body.action === "seedData") {
      await store.seedDefault()
    } else {
      throw createError({ statusCode: 400, statusMessage: "Unsupported project action." })
    }

    return {
      migrationResult,
      ok: true,
      schema: store.loadSchema(),
      stats: store.stats(),
      validationIssues: validateAoiSystemSchema(store.loadSchema()).issues
    }
  } catch (error) {
    throwAoiHttpError(error, "Project update failed.")
  } finally {
    store?.close()
  }
})

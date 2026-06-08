import { compileAoiRuntimeProject } from "@aoi/compiler"
import {
  findAoiWorkspaceRoot
} from "@aoi/data-runtime"
import {
  adminCrudSeedData
} from "@aoi/template-admin-crud"
import { createAdminCrudStore } from "../../utils/admin-crud-store"
import { throwAoiHttpError } from "../../utils/aoi-http-error"

export default defineEventHandler(async () => {
  const workspaceRoot = findAoiWorkspaceRoot()
  let store: ReturnType<typeof createAdminCrudStore> | null = null

  try {
    store = createAdminCrudStore()
    const result = await compileAoiRuntimeProject({
      schema: store.loadSchema(),
      seedData: adminCrudSeedData,
      workspaceRoot
    })

    return {
      ok: true,
      ...result
    }
  } catch (error) {
    throwAoiHttpError(error, "Runtime compile failed.")
  } finally {
    store?.close()
  }
})

import { createAdminCrudStore, ensureAdminCrudSeeded } from "../../utils/admin-crud-store"
import { throwAoiHttpError } from "../../utils/aoi-http-error"
import { validateAoiSystemSchema } from "@aoi/protocol"

export default defineEventHandler(async () => {
  let store: ReturnType<typeof createAdminCrudStore> | null = null

  try {
    await ensureAdminCrudSeeded()
    store = createAdminCrudStore()
    const schema = store.loadSchema()
    const validation = validateAoiSystemSchema(schema)

    return {
      ok: true,
      schema: validation.normalizedSchema,
      stats: store.stats(),
      validationIssues: validation.issues
    }
  } catch (error) {
    throwAoiHttpError(error, "Project load failed.")
  } finally {
    store?.close()
  }
})

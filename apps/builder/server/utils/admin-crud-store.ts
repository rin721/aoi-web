import {
  createSqliteNodeProjectStore,
  findAoiWorkspaceRoot
} from "@aoi/data-runtime"
import {
  adminCrudProjectId,
  adminCrudSeedData,
  adminCrudSystemSchema
} from "@aoi/template-admin-crud"

export function createAdminCrudStore() {
  const workspaceRoot = findAoiWorkspaceRoot()

  return createSqliteNodeProjectStore({
    projectId: adminCrudProjectId,
    schema: adminCrudSystemSchema,
    seedData: adminCrudSeedData,
    workspaceRoot
  })
}

export async function ensureAdminCrudSeeded() {
  let store: ReturnType<typeof createAdminCrudStore> | null = null

  try {
    store = createAdminCrudStore()
    const schema = store.loadSchema()
    const resources = schema.dataSources.flatMap((source) => source.resources)
    const firstResource = resources[0]

    if (!firstResource) {
      return
    }

    const result = await store.driver.query({ limit: 1, resourceId: firstResource.id })

    if (result.totalCount === 0) {
      await store.seedDefault()
    }
  } finally {
    store?.close()
  }
}

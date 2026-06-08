import {
  createSqliteNodeProjectStore,
  findAoiWorkspaceRoot
} from "@aoi/data-runtime"
import { generatedSystemSchema } from "../../app/generated/system.schema"
import { generatedSeedData } from "../../app/generated/seed"

export function createRuntimeStore() {
  return createSqliteNodeProjectStore({
    projectId: generatedSystemSchema.id,
    schema: generatedSystemSchema,
    seedData: generatedSeedData,
    workspaceRoot: findAoiWorkspaceRoot()
  })
}

export async function ensureRuntimeSeeded() {
  let store: ReturnType<typeof createRuntimeStore> | null = null

  try {
    store = createRuntimeStore()
    const schema = store.loadSchema()
    const firstResource = schema.dataSources.flatMap((source) => source.resources)[0]

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

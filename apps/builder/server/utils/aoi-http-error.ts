import { getAoiDataRuntimeError } from "@aoi/data-runtime"

export function throwAoiHttpError(error: unknown, fallback: string): never {
  const dataError = getAoiDataRuntimeError(error)

  if (dataError) {
    throw createError({
      data: { aoiDataRuntimeError: dataError },
      statusCode: dataError.recoverable ? 409 : 400,
      statusMessage: dataError.message
    })
  }

  if (error && typeof error === "object" && "statusCode" in error) {
    throw error
  }

  throw createError({
    data: {
      cause: error instanceof Error ? error.message : String(error)
    },
    statusCode: 500,
    statusMessage: fallback
  })
}

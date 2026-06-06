import { promises as fs } from "node:fs"
import { resolve } from "node:path"
import { AOI_ORIGINAL_BUILD_DEFAULT_APP_SETTINGS } from "../../../app/config/aoi-build-defaults.original"
import {
  AOI_BUILD_DEFAULT_CONFIG_PATHS,
  normalizeAoiBuildDefaultAppSettings,
  serializeAoiBuildDefaultConfig
} from "../../../app/lib/aoiBuildDefaultSerialization"

type DeveloperBuildDefaultsAction = "restore" | "write"

interface DeveloperBuildDefaultsBody {
  action?: DeveloperBuildDefaultsAction
  settings?: unknown
}

const activeConfigPath = resolve(process.cwd(), AOI_BUILD_DEFAULT_CONFIG_PATHS.active)

function assertDeveloperApiAvailable() {
  if (!import.meta.dev) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not found"
    })
  }
}

async function writeActiveConfig(settings: unknown) {
  const normalized = normalizeAoiBuildDefaultAppSettings(settings)
  const source = serializeAoiBuildDefaultConfig(normalized)

  await fs.writeFile(activeConfigPath, source, "utf8")

  return {
    bytes: Buffer.byteLength(source, "utf8"),
    source
  }
}

export default defineEventHandler(async (event) => {
  assertDeveloperApiAvailable()

  const body = await readBody<DeveloperBuildDefaultsBody>(event)

  if (body?.action === "write") {
    const result = await writeActiveConfig(body.settings)

    return {
      action: "write",
      activePath: AOI_BUILD_DEFAULT_CONFIG_PATHS.active,
      originalPath: AOI_BUILD_DEFAULT_CONFIG_PATHS.original,
      ok: true,
      updatedAt: new Date().toISOString(),
      ...result
    }
  }

  if (body?.action === "restore") {
    const result = await writeActiveConfig(AOI_ORIGINAL_BUILD_DEFAULT_APP_SETTINGS)

    return {
      action: "restore",
      activePath: AOI_BUILD_DEFAULT_CONFIG_PATHS.active,
      originalPath: AOI_BUILD_DEFAULT_CONFIG_PATHS.original,
      ok: true,
      updatedAt: new Date().toISOString(),
      ...result
    }
  }

  throw createError({
    statusCode: 400,
    statusMessage: "Unsupported developer build-default action"
  })
})

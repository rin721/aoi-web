import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import test from "node:test"
import {
  adminCrudSeedData,
  adminCrudSystemSchema
} from "../../templates/admin-crud/src/index"
import {
  cloneAoiSchema
} from "@aoi/protocol"
import { compileAoiRuntimeProject } from "./index"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const runtimeAppDir = resolve(repoRoot, "apps", "runtime")

test("compiles admin CRUD into a builder-free runtime package", async () => {
  const workspaceRoot = await mkdtemp(resolve(tmpdir(), "aoi-compiler-"))

  try {
    const result = await compileAoiRuntimeProject({
      runtimeAppDir,
      schema: adminCrudSystemSchema,
      seedData: adminCrudSeedData,
      workspaceRoot
    })

    const packageJson = JSON.parse(await readFile(resolve(result.outputDir, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>
      name?: string
    }
    const manifest = JSON.parse(await readFile(result.manifestPath, "utf8")) as {
      packageName?: string
      schemaHash?: string
    }
    const generatedSchema = await readFile(result.generatedSchemaPath, "utf8")
    const generatedSchemaModule = await import(`${pathToFileURL(result.generatedSchemaPath).href}?${Date.now()}`) as {
      generatedSystemSchema: typeof adminCrudSystemSchema
    }
    const generatedSeed = await readFile(result.generatedSeedPath, "utf8")
    const packageText = await readFile(resolve(result.outputDir, "package.json"), "utf8")

    assert.equal(packageJson.name, result.packageName)
    assert.equal(packageJson.dependencies?.["@aoi/template-admin-crud"], undefined)
    assert.equal(manifest.packageName, result.packageName)
    assert.ok(manifest.schemaHash)
    assert.match(generatedSchema, /generatedSystemSchema/)
    assert.match(generatedSchema, /payloadBindings/)
    assert.ok(JSON.stringify(generatedSchemaModule.generatedSystemSchema).includes("payloadBindings"))
    assert.match(generatedSeed, /generatedSeedData/)
    assert.doesNotMatch(packageText, /@aoi\/template-admin-crud|apps\/builder|\/building/)
  } finally {
    await rm(workspaceRoot, { force: true, recursive: true })
  }
})

test("fails compilation when schema validation fails", async () => {
  const workspaceRoot = await mkdtemp(resolve(tmpdir(), "aoi-compiler-"))
  const schema = cloneAoiSchema(adminCrudSystemSchema)

  schema.routes[0].pageId = "missingPage"

  try {
    await assert.rejects(
      () => compileAoiRuntimeProject({
        runtimeAppDir,
        schema,
        seedData: adminCrudSeedData,
        workspaceRoot
      }),
      /Cannot compile invalid Aoi Schema/
    )
  } finally {
    await rm(workspaceRoot, { force: true, recursive: true })
  }
})

import { promises as fs } from "node:fs"
import { createHash } from "node:crypto"
import { resolve } from "node:path"
import type {
  AoiGeneratedManifest,
  AoiSeedData,
  AoiSystemSchema
} from "@aoi/protocol"
import {
  normalizeAoiSystemSchema,
  validateAoiSystemSchema
} from "@aoi/protocol"

export interface AoiCompileRuntimeOptions {
  outputDir?: string
  runtimeAppDir?: string
  schema: AoiSystemSchema
  seedData: AoiSeedData
  workspaceRoot: string
}

export interface AoiCompileRuntimeResult {
  manifest: AoiGeneratedManifest
  manifestPath: string
  generatedSchemaPath: string
  generatedSeedPath: string
  outputDir: string
  packageName: string
}

const GENERATED_ROOT = ".aoi/generated"
const EXCLUDED_COPY_NAMES = new Set([".nuxt", ".output", "node_modules"])

export async function compileAoiRuntimeProject(options: AoiCompileRuntimeOptions): Promise<AoiCompileRuntimeResult> {
  const validation = validateAoiSystemSchema(options.schema)

  if (!validation.ok) {
    throw new Error(`Cannot compile invalid Aoi Schema: ${validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`)
  }

  const schema = normalizeAoiSystemSchema(validation.normalizedSchema)
  const slug = slugifyProject(schema.app.slug || schema.id)
  const runtimeAppDir = options.runtimeAppDir || resolve(options.workspaceRoot, "apps", "runtime")
  const outputDir = options.outputDir || resolve(options.workspaceRoot, GENERATED_ROOT, slug)
  const generatedDir = resolve(outputDir, "app", "generated")
  const manifestPath = resolve(outputDir, "aoi.generated.json")

  assertInsideGeneratedRoot(options.workspaceRoot, outputDir)

  await fs.rm(outputDir, { force: true, recursive: true })
  await copyRuntimeTemplate(runtimeAppDir, outputDir)
  await fs.mkdir(generatedDir, { recursive: true })
  await fs.writeFile(resolve(generatedDir, "system.schema.ts"), serializeTsConst("generatedSystemSchema", schema, "AoiSystemSchema"), "utf8")
  await fs.writeFile(resolve(generatedDir, "seed.ts"), serializeTsConst("generatedSeedData", options.seedData, "AoiSeedData"), "utf8")
  const runtimeDependencies = await rewriteGeneratedPackage(outputDir, slug)
  const manifest: AoiGeneratedManifest = {
    generatedAt: new Date().toISOString(),
    packageName: `@aoi/generated-${slug}`,
    projectSlug: slug,
    runtimeDependencies,
    schemaHash: createHash("sha256").update(JSON.stringify(schema)).digest("hex"),
    schemaVersion: schema.version,
    target: schema.build.target
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
  await assertRuntimeDoesNotContainBuilder(outputDir)

  return {
    manifest,
    manifestPath,
    generatedSchemaPath: resolve(generatedDir, "system.schema.ts"),
    generatedSeedPath: resolve(generatedDir, "seed.ts"),
    outputDir,
    packageName: `@aoi/generated-${slug}`
  }
}

async function copyRuntimeTemplate(source: string, target: string) {
  await fs.mkdir(target, { recursive: true })
  const entries = await fs.readdir(source, { withFileTypes: true })

  for (const entry of entries) {
    if (EXCLUDED_COPY_NAMES.has(entry.name)) {
      continue
    }

    const from = resolve(source, entry.name)
    const to = resolve(target, entry.name)

    if (entry.isDirectory()) {
      await copyRuntimeTemplate(from, to)
    } else if (entry.isFile()) {
      await fs.copyFile(from, to)
    }
  }
}

async function rewriteGeneratedPackage(outputDir: string, slug: string) {
  const packagePath = resolve(outputDir, "package.json")
  const raw = JSON.parse(await fs.readFile(packagePath, "utf8")) as Record<string, unknown>
  const dependencies = raw.dependencies && typeof raw.dependencies === "object"
    ? raw.dependencies as Record<string, string>
    : {}

  raw.name = `@aoi/generated-${slug}`
  raw.private = true
  delete dependencies["@aoi/template-admin-crud"]
  raw.dependencies = dependencies

  await fs.writeFile(packagePath, `${JSON.stringify(raw, null, 2)}\n`, "utf8")
  return dependencies
}

async function assertRuntimeDoesNotContainBuilder(outputDir: string) {
  const offenders: string[] = []

  async function visit(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const path = resolve(dir, entry.name)

      if (entry.isDirectory()) {
        await visit(path)
        continue
      }

      if (!entry.isFile() || !/\.(ts|vue|json|css|md)$/.test(entry.name)) {
        continue
      }

      const content = await fs.readFile(path, "utf8")

      if (content.includes("apps/builder") || content.includes("/building") || content.includes("@aoi/template-admin-crud")) {
        offenders.push(path)
      }
    }
  }

  await visit(outputDir)

  if (offenders.length) {
    throw new Error(`Generated runtime contains builder references: ${offenders.join(", ")}`)
  }
}

function serializeTsConst(name: string, value: unknown, typeName: string) {
  return `import type { ${typeName} } from "@aoi/protocol"\n\nexport const ${name} = ${JSON.stringify(value, null, 2)} satisfies ${typeName}\n`
}

function slugifyProject(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "aoi-runtime"
}

function assertInsideGeneratedRoot(workspaceRoot: string, outputDir: string) {
  const generatedRoot = resolve(workspaceRoot, GENERATED_ROOT)
  const resolvedOutput = resolve(outputDir)

  if (resolvedOutput !== generatedRoot && !resolvedOutput.startsWith(`${generatedRoot}\\`) && !resolvedOutput.startsWith(`${generatedRoot}/`)) {
    throw new Error(`Output must stay inside ${generatedRoot}`)
  }
}

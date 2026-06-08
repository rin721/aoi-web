import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { compileAoiRuntimeProject } from "./index"
import {
  adminCrudSeedData,
  adminCrudSystemSchema
} from "@aoi/template-admin-crud"

const args = new Set(process.argv.slice(2))

if (!args.has("--template") || !args.has("admin-crud")) {
  console.error("Usage: pnpm --filter @aoi/compiler compile:admin-crud")
  process.exit(1)
}

const result = await compileAoiRuntimeProject({
  schema: adminCrudSystemSchema,
  seedData: adminCrudSeedData,
  workspaceRoot: findWorkspaceRoot()
})

console.log(JSON.stringify(result, null, 2))

function findWorkspaceRoot(start = process.cwd()) {
  let current = resolve(start)

  while (true) {
    if (existsSync(resolve(current, "pnpm-workspace.yaml"))) {
      return current
    }

    const parent = resolve(current, "..")

    if (parent === current) {
      return resolve(start)
    }

    current = parent
  }
}

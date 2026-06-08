# Aoi Design Rules

This file is the durable design and architecture rule entry for `aoi-web-workspace`.
Keep `design/` focused on long-lived constraints. Do not add temporary research notes, prototypes, phase plans, or stale mockups here.

## Product And Stack

- Aoi is now a pnpm monorepo for a Schema-driven low-code self-building platform.
- `apps/builder` is the construction workspace. Its core route is `/building`.
- `apps/runtime` is the clean generated-runtime template. It must not import builder code or expose `/building`.
- `apps/aoi-site` is the migrated legacy Nuxt 4 video community app and remains a reference surface, not the V1 low-code example domain.
- V1 uses a generic CRUD admin domain with `customers`, `orders`, and `approvalTasks`.
- Use pnpm only. The repository package manager is `pnpm@10.22.0`.

## Repository Boundaries

- `packages/protocol` owns Aoi system Schema, material protocol, data model, action flow, data resource, and build target types.
- `packages/materials` owns built-in material manifests and Vue render adapters.
- `packages/runtime-core` owns Schema rendering, resource discovery, and action-flow execution.
- `packages/data-runtime` owns data driver contracts and server-side SQLite access.
- `packages/compiler` owns Schema-to-runtime generation.
- `packages/templates/admin-crud` owns the V1 generic CRUD template Schema and seed data.
- Local SQLite files live under `data/projects/{projectId}/project.sqlite`; generated outputs live under `.aoi/generated/{projectSlug}`. Both are generated and must not be committed.
- Generated or dependency directories such as `.nuxt/`, `.output/`, `.aoi/`, `data/`, and `node_modules/` are off limits.

## Builder Rules

- `/building` should be a real engineering workspace on the first screen: project tree, material registry, canvas, inspector, data model view, SQLite data console, and compile action.
- Builder can save project Schema to local SQLite and export/import `system.schema.json`.
- Builder UI must not accept or submit arbitrary SQL. All data behavior must be derived from `AoiModelSchema` and `AoiDataResourceSchema`.
- Builder may depend on runtime packages, protocol packages, materials, templates, compiler, and data-runtime. Runtime must never depend on builder.
- V1 does not implement composite material authoring or a material marketplace. Keep protocol hooks only.

## Runtime Rules

- Runtime renders Schema through `packages/runtime-core` and built-in material adapters.
- Runtime data access goes through `packages/data-runtime` and route handlers generated from Schema resources.
- Runtime package and generated output must not contain `apps/builder` imports or `/building` routes.
- Runtime pages should stay dense, predictable, and application-like rather than marketing-oriented.

## Schema And Protocol Rules

- Schema is the source of truth for app identity, routes, pages, nodes, material references, models, resources, action flows, and build targets.
- Do not invent page-local response shapes when a shared Schema or data contract exists.
- JSON keys use camelCase. Time fields use ISO 8601 UTC strings. Pagination can be added later with opaque cursors.
- Material manifests must describe props, events, data inputs, actions, lifecycle hooks, registry scope, and style vars.

## SQLite Rules

- V1 uses Node local SQLite through `node:sqlite`; keep it behind the `sqlite-node` adapter.
- SQLite table names and column names must pass identifier validation before being quoted.
- Store project databases under `data/projects/{projectId}/project.sqlite`.
- Seed/reset can recreate V1 template data; destructive operations must stay inside the intended project database.

## Legacy Aoi Site Rules

- Legacy frontend code lives in `apps/aoi-site/app/`.
- Legacy shared DTOs and fixtures live in `apps/aoi-site/shared/`.
- Legacy Nuxt mock endpoints live in `apps/aoi-site/server/api/mock/` and should stay close to future API contracts.
- Legacy user-facing locale files live in `apps/aoi-site/i18n/locales/`.
- Business pages and feature components in the legacy site must not use `md-*` Material Web elements directly.
- Material Web imports stay centralized in `apps/aoi-site/app/plugins/material-web.client.ts`.
- New Material Web behavior must be exposed through `apps/aoi-site/app/components/aoi/` first.
- Plain text links, card links, tag links, and navigation links in the legacy site use `AoiLink`.

## UI Foundation

- Use stable dimensions and responsive constraints for tool panels, boards, tables, forms, and buttons.
- Preserve keyboard focus, touch targets, text contrast, responsive behavior, and `prefers-reduced-motion`.
- Prefer local Lucide icons through `@nuxt/icon`.
- Avoid decorative orbs, one-note palettes, and marketing-style hero layouts for builder/runtime workspaces.

## Verification Rules

- After TypeScript, Vue, route, composable, store, protocol, runtime, data, or compiler changes, run `pnpm typecheck`.
- After Nuxt config, server route, runtime config, compiler, or build-sensitive changes, run `pnpm build`.
- Visible UI changes should be checked in browser at desktop and mobile widths when feasible.
- There is currently no committed lint script; do not claim lint was run unless a lint script is added or provided.

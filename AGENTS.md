# Agent Rules

## Project Snapshot

- This is `aoi-web`, a Nuxt 4 frontend-first application using Vue 3, TypeScript, Pinia, `@nuxtjs/i18n`, `@nuxt/icon`, and Material Web behind local Aoi wrappers.
- Package management is pnpm only. The repository declares `pnpm@10.22.0`.
- The app currently works with local mock API routes and browser-local state while preserving typed contracts for a future Go backend.
- Treat `design/tech-stack.md`, `design/aoi-visual-system.md`, `design/frontend-backend-contract.md`, and `design/implementation-plan.md` as the product and architecture references for larger changes.

## Commands

- Install dependencies: `pnpm install`
- Start development server: `pnpm dev`
- Type-check: `pnpm typecheck`
- Build: `pnpm build`
- Preview production build: `pnpm preview`

There is no committed lint script yet. Do not claim lint verification unless a lint command is added or provided by the user.

## Repository Boundaries

- Frontend application code lives in `app/`.
- Shared DTOs and fixtures that must be reused by both app code and mock server routes live in `shared/`.
- Nuxt mock endpoints live in `server/api/mock/`; do not grow this into a production backend.
- Localized messages live in `i18n/locales/`.
- Design and planning docs live in `design/`.
- Generated or dependency folders such as `.nuxt/`, `.output/`, and `node_modules/` should not be edited.

## Code Style

- Use TypeScript and Vue 3 Composition API.
- Follow the existing formatting: 2-space indentation, double quotes, LF line endings, and no semicolons in Vue/TS files.
- Prefer Nuxt auto-imports and local composables over new global utilities.
- Keep changes narrowly scoped and avoid unrelated refactors.
- Use `rg` or `rg --files` for repository searches when available.

## UI And Component Rules

- Business pages and feature components must not use `md-*` Material Web elements directly.
- Material Web imports stay centralized in `app/plugins/material-web.client.ts`.
- Add or extend wrappers in `app/components/aoi/` before exposing new Material Web behavior to pages.
- Use existing Aoi primitives such as `AoiButton`, `AoiIconButton`, `AoiTextField`, `AoiTabs`, `AoiCheckbox`, `AoiDialog`, `AoiMenu`, and `AoiProgress`.
- Use CSS variables from `app/assets/css/tokens.css` and shared layout rules from `app/assets/css/main.css`.
- Preserve responsive behavior, accessible labels, keyboard focus, touch target sizes, and reduced-motion behavior.
- Prefer local Lucide icons through `@nuxt/icon`; avoid remote icon dependencies.

## State, API, And Data Rules

- Route API access through `useAoiApi()` and keep API error diagnostics compatible with `useAoiApiTelemetry()`.
- Keep future-backend DTO shapes in shared types. Avoid page-level ad hoc response shapes when a shared contract exists.
- Browser-local stores must hydrate safely on the client, recover from corrupt `localStorage`, and avoid SSR crashes.
- Mock endpoints should mirror the future API contract where practical.
- Do not persist uploaded file bytes in browser-local draft state; only metadata belongs there.

## i18n Rules

- The default locale is `zh-CN` with `no_prefix` routing.
- Keep locale keys synchronized across `zh-CN.json`, `en.json`, and `ja.json` when adding shared user-facing text.
- Some existing feature pages contain inline Chinese text. When touching those areas substantially, prefer moving reusable copy into locale files.

## Verification

- Run `pnpm typecheck` for TypeScript, Vue, route, composable, or store changes.
- Run `pnpm build` when touching Nuxt config, server routes, runtime config, or build-sensitive module setup.
- For visible UI changes, check desktop and mobile behavior in a browser whenever feasible.
- Mention any skipped verification in the final response.

## Git And Collaboration

- Check the working tree before editing.
- Do not revert user changes or unrelated dirty files.
- Do not commit, branch, or push unless the user explicitly asks.
- Keep generated lockfile changes only when dependencies are intentionally changed through pnpm.

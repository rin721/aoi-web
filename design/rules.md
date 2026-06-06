# Aoi Design Rules

This file is the durable design and architecture rule entry for `aoi-web`.
Keep `design/` focused on constraints that guide future implementation. Do not add temporary research notes, prototypes, phase plans, or stale mockups here.

## Product And Stack

- Aoi is a Nuxt 4 frontend-first video community app using Vue 3, TypeScript, Pinia, `@nuxtjs/i18n`, `@nuxt/icon`, and Material Web behind local Aoi wrappers.
- Use pnpm only. The repository package manager is `pnpm@10.22.0`.
- Current data is local mock API plus browser-local state. Keep contracts ready for a future Go backend, but do not build production backend behavior inside Nuxt mock routes.
- KIRAKIRA is a structural reference, not a visual clone target. Borrow fixed navigation, category-first discovery, compact announcement, and dense video grids. Keep Aoi's sunflower-orange identity and use sakura mainly as an auxiliary decorative color.

## Repository Boundaries

- Frontend app code lives in `app/`.
- Shared DTOs and fixtures used by both app and mock server live in `shared/`.
- Nuxt mock endpoints live in `server/api/mock/` and should stay close to future API contracts.
- User-facing locale files live in `i18n/locales/`.
- Generated or dependency directories such as `.nuxt/`, `.output/`, and `node_modules/` are off limits.
- Prefer relative imports or Nuxt auto-imports. Do not add unnecessary global utilities.

## UI Foundation

- Business pages and feature components must not use `md-*` Material Web elements directly.
- Material Web imports stay centralized in `app/plugins/material-web.client.ts`.
- New Material Web behavior must be exposed through `app/components/aoi/` first.
- Plain text links, card links, tag links, and navigation links use `AoiLink`; business code should not use `NuxtLink` or bare `<a>`.
- Button-style navigation uses `AoiButton` or `AoiIconButton` with `to`/`href`.
- Use `app/assets/css/tokens.css` tokens and shared structure rules in `app/assets/css/main.css`.
- Prefer semantic tokens such as panel/card/control/nav/state/danger variables over one-off color literals.
- Use domain-specific radius tokens: `--aoi-radius-container`, `--aoi-radius-card`, `--aoi-radius-control`, `--aoi-radius-field`, `--aoi-radius-choice`, `--aoi-radius-nav-indicator`, and `--aoi-radius-round`. Reserve `999px` for navigation indicators, single-line pill controls, and true round/circular affordances; wide input/select fields must use capped field radii instead of control radii.
- Preserve responsive behavior, visible focus states, keyboard access, touch targets, text contrast, and `prefers-reduced-motion`.
- Icons should come from the local Lucide collection through `@nuxt/icon`.

## Layout Rules

- Desktop uses a fixed 56px left rail.
- Mobile uses a fixed 56px top header and 56px bottom nav with four primary destinations.
- Content max width is around 1280px; wider settings-style workspaces may use the wide max-width token.
- Category discovery should stay visible and horizontally scrollable on mobile.
- Video grids use stable 16:9 covers, desktop `repeat(auto-fill, minmax(224px, 1fr))`, and mobile two columns with `minmax(0, 1fr)`.
- Settings pages keep a grouped sticky side rail on desktop; mobile flattens destinations into a compact sticky horizontal strip below the fixed header so active content remains reachable while scrolling.
- Mobile player controls should stay compact: one timeline row plus one control row when possible. Hide verbose visible labels when accessible labels remain.

## Data And API Rules

- API access goes through `useAoiApi()` and remains compatible with `useAoiApiTelemetry()`.
- DTO shapes intended for the future backend belong in shared types, not page-local ad hoc response objects.
- JSON uses camelCase keys. Time fields use ISO 8601 UTC strings. Pagination uses opaque cursors.
- Frontend error UI expects stable error payloads compatible with `AoiApiErrorPayload`.
- Mock endpoints should model future API facts. Browser-local interactions are separate local prototype state.
- Browser-local stores must hydrate only on the client, recover from damaged `localStorage`, and avoid SSR crashes.
- Upload drafts must never persist file bytes; save only metadata.

## Local State Rules

- Library state stores history, favorites, watch-later, and liked IDs under `aoi.library.v1`.
- Upload drafts store metadata under `aoi.uploadDrafts.v1`.
- Following state stores creator snapshots under `aoi.following.v1`.
- Comments store local discussion data under `aoi.comments.v1`.
- Player preferences store volume, muted, playback rate, and theater mode under `aoi.player.v1`.
- Local state should not be sent to `/api/mock`; it represents frontend-only interaction rehearsal.

## i18n Rules

- Default locale is `zh-CN`; route strategy is `no_prefix`.
- New shared user-facing copy should update `zh-CN.json`, `en.json`, and `ja.json`.
- Existing inline Chinese copy may remain for narrow changes. If touching a large reusable surface, prefer moving reusable copy into locale files.

## Verification Rules

- After TypeScript, Vue, route, composable, or store changes, run `pnpm typecheck`.
- After Nuxt config, server route, runtime config, or build-sensitive changes, run `pnpm build`.
- Visible UI changes should be checked in browser at desktop and mobile widths when feasible.
- There is currently no committed lint script; do not claim lint was run unless a lint script is added or provided.

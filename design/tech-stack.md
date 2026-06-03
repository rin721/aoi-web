# Aoi Frontend Tech Stack

## Recommendation

Aoi should be built as a Nuxt 4 frontend-only application with mock data first, then connected to a Go backend through typed API contracts.

## Core Stack

| Area | Choice | Reason |
| --- | --- | --- |
| Framework | Nuxt 4 | Matches the project README, supports Vue SFCs, SSR/SPA flexibility, file routing, and strong DX. |
| Language | TypeScript | Required for stable DTOs, component props, and API typing. |
| View layer | Vue 3 Composition API | Aligns with Nuxt 4 and README conventions. |
| Build | Vite through Nuxt | Fast local development and production bundling. |
| UI foundation | Material Web | Aoi now uses Material Web as the low-level control system through a strict Aoi wrapper layer. |
| Icon system | `@nuxt/icon` + local Lucide collection | SSR-friendly Iconify integration with local `@iconify-json/lucide` data, avoiding remote icon fetches. |
| Styling | CSS variables | Aoi tokens map into Material system tokens while preserving the custom Aoi media-community layout. |
| State | Pinia | Fits the README and handles persisted settings, auth state, player preferences, and user preferences. |
| Data fetching | Nuxt `$fetch` and composables | Keeps API access SSR-aware and easy to swap from mock to Go backend. |
| i18n | `@nuxtjs/i18n` | Locale routing, lazy messages, SEO support, and Vue i18n integration. |
| Validation | Zod or Valibot | Optional but recommended for API response validation during mock-to-backend transition. |
| Testing | Vitest, Vue Test Utils, Playwright | Unit/component coverage plus viewport regression checks for the media layout. |

## Material Web Wrapper Strategy

Material Web is in maintenance mode, so Aoi must not let page or business components depend on `md-*` elements directly. The implementation uses Material Web as a controlled foundation behind `app/components/aoi/*`.

Rules:

- Business pages use `AoiButton`, `AoiIconButton`, `AoiTextField`, `AoiTabs`, `AoiCheckbox`, `AoiSwitch`, `AoiDialog`, `AoiMenu`, `AoiSelect`, and `AoiProgress`.
- `md-*` tags are allowed only inside Aoi wrapper components.
- Material Web imports are centralized in `app/plugins/material-web.client.ts`.
- Aoi CSS tokens map to Material tokens such as `--md-sys-color-primary`, `--md-sys-color-surface`, and shape tokens.
- If Material Web misses a future interaction primitive, add a new Aoi wrapper first and evaluate the lowest-risk fallback under that wrapper.

## Proposed Nuxt Structure

```text
app/
  app.vue
  assets/css/
    main.css
    tokens.css
  components/
    app/
    aoi/
    navigation/
    video/
    feedback/
  composables/
    useAoiApi.ts
    useAoiApiTelemetry.ts
    useHomeFeed.ts
    useThemePreference.ts
  plugins/
    material-web.client.ts
  layouts/
    default.vue
  pages/
    index.vue
    category/[slug].vue
    search.vue
    u/[handle].vue
    video/[id].vue
    feed/following.vue
  stores/
    app-settings.ts
    session.ts
  types/
    api.ts
    video.ts
i18n/
  locales/
    zh-CN.json
    en.json
    ja.json
server/
  api/mock/
```

Nuxt 4 favors the `app/` directory for frontend application code. The `server/` area should only be used for local mock endpoints during frontend development. It should not become the production Go backend.

## Frontend-Only Development Strategy

1. Build static UI from fixtures.
2. Move fixtures behind composables.
3. Add mock Nuxt server endpoints with the same DTOs as the future Go API.
4. Centralize `$fetch` errors into `AoiApiErrorPayload` and expose diagnostics in settings.
5. Generate or share OpenAPI types once the Go backend begins.
6. Replace mock endpoint base URL with the real API gateway.

## Sources

- Nuxt 4 documentation: https://nuxt.com/docs/4.x
- Nuxt Icon module: https://nuxt.com/modules/icon
- Nuxt i18n module: https://nuxt.com/modules/i18n
- Material Web maintenance note: https://github.com/material-components/material-web/discussions/5642

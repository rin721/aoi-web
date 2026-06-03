# Aoi Implementation Plan

## Phase 1: Design Foundation

- Create `/design` research, visual system, tech stack, API contract, and implementation planning documents.
- Build a static HTML/CSS prototype that demonstrates the first screen across desktop and mobile.
- Validate no horizontal overflow, no nav overlap, visible focus states, and reduced-motion support.

Acceptance:

- `/design/aoi-ui-prototype.html` opens directly in a browser.
- Desktop uses a 56px left rail.
- Mobile uses a 56px top bar and 56px bottom nav.
- Mobile video grid remains two columns without clipping.

## Phase 2: Nuxt 4 Scaffold

- Initialize Nuxt 4 with TypeScript and pnpm.
- Add Material Web, `@nuxt/icon`, local `@iconify-json/lucide`, Pinia, and `@nuxtjs/i18n`.
- Define Aoi CSS tokens and map them into Material Web system tokens.
- Keep README technology notes aligned with the selected stack.

Acceptance:

- `pnpm dev` starts the frontend.
- `pnpm typecheck` passes.
- `pnpm lint` passes after linting is configured.

## Phase 3: App Shell and Components

- Implement default layout with desktop rail, mobile header, bottom nav, and content viewport.
- Build Aoi wrapper components over Material Web, then shared product components: category tabs, announcement strip, video card, video grid, app logo, and empty/error states.
- Add responsive behavior from the static prototype.
- Preserve accessible labels, keyboard focus, and touch target sizes.

Acceptance:

- Desktop, tablet, and mobile screenshots match the design intent.
- Keyboard navigation reaches all primary nav items and content cards.
- `prefers-reduced-motion` disables decorative animation.
- Business pages do not use `md-*` tags directly.

## Phase 4: Mock Data and Pages

- Add DTOs from `frontend-backend-contract.md`.
- Add local fixtures for categories, announcement, latest videos, and users.
- Create composables: `useAoiApi`, `useHomeFeed`, `useCategories`.
- Implement pages: home, category, search, video detail shell, following placeholder.
- Add Nuxt mock API routes under `/api/mock` for home, categories, videos, search, and video detail.
- Keep mock fixtures and API types in `shared/` so app composables and server handlers use the same contract.
- Expand navigation destinations with stable placeholder pages for history, collections, upload, following, and settings.

Acceptance:

- Home page renders entirely from typed mock data.
- Category filter changes the visible feed.
- Search page supports query state even before real backend integration.
- Business pages do not import fixtures directly and do not use `md-*` tags directly.
- `/search?q=...`, `/category/:slug`, and `/video/:id` render stable loading, empty, error, and success states.

## Phase 5: Future Go API Integration

- Add runtime config for API base URL.
- Replace mock data boundary with `$fetch` calls.
- Sync DTOs with Go OpenAPI output once backend routes exist.
- Add loading, retry, and error telemetry hooks.
- Add API status diagnostics and stable frontend error payloads.
- Add creator profile and following-feed DTOs so community browsing does not depend on local fixtures.

Acceptance:

- The frontend can switch between mock and real API through configuration.
- API errors render stable UI states.
- No page component directly imports fixtures after real API integration begins.
- Settings page shows current API mode, base path, implemented endpoints, and recent API errors.
- Creator and following routes render through `useAoiApi()` and mock endpoints only.

Current Phase 5 frontend-only implementation:

- `useAoiApi()` now centralizes `$fetch`, base URL selection, and conversion into `AoiApiErrorPayload`.
- `useAoiApiTelemetry()` keeps the latest API errors visible in settings for future Go API debugging.
- Added mock endpoints for `/api/mock/status`, `/api/mock/feed/following`, and `/api/mock/users/:handle`.
- Added `/u/:handle` creator profile pages and upgraded `/feed/following` from placeholder to mock API preview.

## Phase 6: Local Interaction Layer

- Add an anonymous local library store backed by `localStorage`.
- Support browser-local history, favorites, watch later, and liked video state without writing to mock API.
- Deepen video cards and video detail actions so local state is visible and reversible.
- Replace history and collections placeholders with real local-library views.
- Add local interaction diagnostics and reset controls to settings.

Acceptance:

- Opening `/video/:id` records one local history entry and repeated opens update the timestamp without duplicates.
- Favorite, watch later, and like actions toggle on and off from video cards or video detail.
- `/history` and `/collections` hydrate safely from `localStorage` and render stable empty/loading states on SSR.
- Settings displays local counts and can clear `aoi.library.v1`.
- Corrupt or unavailable localStorage falls back to an empty library without crashing.

Current Phase 6 frontend-only implementation:

- `useLibraryStore()` owns all local interaction state and persists it under `aoi.library.v1`.
- `VideoCard` uses non-nested links so favorite/watch-later actions remain independent controls.
- Video detail records history after local library hydration and exposes local like/favorite/watch-later actions.

## Phase 7: Local Upload Draft Workspace

- Upgrade `/upload` from a static placeholder into a frontend-only creator workspace.
- Store anonymous upload metadata drafts in `localStorage` without uploading files or writing to mock API.
- Let creators capture file metadata, title, description, category, visibility, tags, comment settings, and sensitive-content marker.
- Add a local readiness checklist and a "queued locally" state that previews the future submit handoff.
- Surface upload draft diagnostics and reset controls in settings.

Acceptance:

- `/upload` hydrates safely, creates an initial draft on the client, and auto-saves changes under `aoi.uploadDrafts.v1`.
- Selecting a file records only name, size, MIME type, and selected timestamp; file bytes are never persisted or sent.
- Drafts can be created, selected, deleted, tagged, and marked as locally queued when required fields pass validation.
- Settings displays draft, ready, and queued counts and can clear all upload drafts.
- Business pages still do not use `md-*` tags directly.

Current Phase 7 frontend-only implementation:

- `useUploadDraftStore()` owns local upload draft state and persistence.
- `/upload` now provides a complete local metadata workspace with source selection, form fields, tag chips, draft list, preview, validation, and local queue action.
- Settings shows `aoi.uploadDrafts.v1` diagnostics and reset control.

## Phase 8: Local Following Layer

- Add anonymous browser-local creator following state without authentication or backend writes.
- Let creator cards and creator profile pages toggle follow/unfollow through Aoi wrapper controls.
- Upgrade `/feed/following` so local follows produce a usable frontend-only following feed before Go auth exists.
- Keep recommended creators from mock API and filter out creators already followed locally.
- Surface local following diagnostics and reset controls in settings.

Acceptance:

- Following and unfollowing a creator updates creator cards, creator profile follower count, and `/feed/following`.
- Local follow data persists under `aoi.following.v1` and recovers safely from corrupt storage.
- `/feed/following` shows local followed creators and latest videos from their stored snapshots.
- Settings displays followed creator and local update counts and can clear local follows.
- Business pages still do not use `md-*` tags directly.

Current Phase 8 frontend-only implementation:

- `useFollowingStore()` owns local followed creator snapshots and persistence.
- `CreatorCard`, creator profile pages, and following feed now expose local follow/unfollow actions.
- Settings shows `aoi.following.v1` diagnostics and reset control.

## Phase 9: Unified Discovery Search

- Upgrade `/api/mock/search` from video-only results to a unified discovery payload.
- Search across videos, creators, and categories while keeping the future Go endpoint shape stable.
- Keep `useAoiApi().searchVideos()` compatible for older call sites, and add `useAoiApi().search()` for full discovery.
- Rebuild `/search` with result-type tabs: all, videos, creators, and categories.
- Let creator results use the existing local follow action and category results link to category feeds.

Acceptance:

- `/search?q=...` renders video, creator, and category results from the mock API.
- `/search?q=...&type=creators` and other type tabs preserve URL state.
- Existing video-only search callers still receive `PageResult<VideoSummary>`.
- Creator result cards can follow/unfollow locally without direct `md-*` usage.
- Mobile search results do not overflow horizontally.

Current Phase 9 frontend-only implementation:

- `SearchPayload` models unified search results in the shared API contract.
- `/api/mock/search` now returns videos, creators, categories, query, and total count.
- `/search` displays tabbed discovery results with `VideoGrid`, `CreatorCard`, and `CategoryCard`.

## Out of Scope for First Design Pass

- Real Go backend implementation.
- Authentication implementation.
- Upload processing and video transcoding.
- Production analytics and recommendation systems.
- Figma export.

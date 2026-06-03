# Frontend and Future Go Backend Contract

## Contract Principles

- The current project remains frontend-only.
- Mock data should use the same field names and shapes expected from the future Go backend.
- JSON uses camelCase keys. Go structs should expose those keys through `json` tags.
- Time fields use ISO 8601 UTC strings.
- Pagination uses opaque cursor strings, not page numbers.
- Media URLs are absolute or root-relative strings returned by the API.
- Errors use a consistent envelope so the frontend can show stable empty/error states.

## Base API

Future base path:

```text
/api/v1
```

During frontend-only development:

```text
/api/mock
```

The frontend should keep the base URL configurable through runtime config:

```ts
export interface AoiRuntimeApiConfig {
  baseURL: string
  mock: boolean
}
```

## Core Models

```ts
export interface UserSummary {
  id: string
  handle: string
  displayName: string
  avatarUrl: string | null
}

export interface ApiStatus {
  mode: "mock" | "go"
  basePath: string
  generatedAt: string
  latencyMs: number
  endpoints: string[]
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  accentColor: string | null
}

export interface VideoSummary {
  id: string
  slug: string
  title: string
  description: string | null
  thumbnailUrl: string
  durationSeconds: number
  viewCount: number
  commentCount: number
  publishedAt: string
  uploader: UserSummary
  categories: Category[]
}

export interface VideoDetail extends VideoSummary {
  sourceUrl: string
  likeCount: number
  tags: string[]
  related: VideoSummary[]
}

export interface Announcement {
  id: string
  title: string
  body: string
  href: string | null
  severity: "info" | "success" | "warning"
  startsAt: string
  endsAt: string | null
}

export interface PageResult<T> {
  items: T[]
  nextCursor: string | null
}

export interface CreatorProfile extends UserSummary {
  bio: string | null
  followerCount: number
  videoCount: number
  joinedAt: string
  categories: Category[]
  latest: PageResult<VideoSummary>
}

export interface FollowingFeedPayload {
  authenticated: boolean
  message: string | null
  creators: CreatorProfile[]
  latest: PageResult<VideoSummary>
}

export interface SearchPayload {
  query: string
  totalCount: number
  videos: PageResult<VideoSummary>
  creators: PageResult<CreatorProfile>
  categories: PageResult<Category>
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
    requestId: string
  }
}

export interface AoiApiErrorPayload {
  code: string
  endpoint: string
  message: string
  requestId: string
  statusCode: number
}
```

## Endpoint Draft

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/home` | Homepage payload: categories, announcement, latest videos. |
| GET | `/api/v1/categories` | Category list for nav and filters. |
| GET | `/api/v1/videos` | Paged video list, filtered by category, tag, or uploader. |
| GET | `/api/v1/videos/{id}` | Video detail and related videos. |
| GET | `/api/v1/search` | Search videos, creators, and categories by query. |
| GET | `/api/v1/feed/following` | Following feed after auth is available. |
| GET | `/api/v1/users/{handle}` | Public creator profile. |
| GET | `/api/v1/status` | Lightweight API status for diagnostics and settings UI. |
| POST | `/api/v1/videos` | Future authenticated upload metadata creation. |

## Query Examples

```text
GET /api/v1/home?locale=zh-CN
GET /api/v1/videos?category=animation&cursor=eyJpZCI6IjEyMyJ9&limit=24
GET /api/v1/search?q=music&limit=20
GET /api/v1/search?q=design&type=creators
```

## Homepage Payload

```ts
export interface HomePayload {
  categories: Category[]
  announcement: Announcement | null
  latest: PageResult<VideoSummary>
}
```

## Frontend State Mapping

- Loading: skeleton covers and muted text rows.
- Empty: friendly message plus category reset action.
- Error: compact alert with retry.
- Auth-gated: show sign-in action only for following feed, upload, and personalized settings.
- Offline or backend unavailable: keep mock data available in development only.

## Local Interaction State

Phase 6 keeps anonymous interaction data in the browser only. It is not sent to `/api/mock` because the mock API represents future backend facts, while local interaction state represents a temporary frontend-only user library.

```ts
export type LibraryVideoSnapshot = VideoSummary

export interface HistoryEntry {
  video: LibraryVideoSnapshot
  lastViewedAt: string
  progressSeconds: number
}
```

Current frontend storage:

- `localStorage` key: `aoi.library.v1`
- Fields: `history`, `favoriteVideos`, `watchLaterVideos`, `likedVideoIds`
- Recovery: invalid JSON, unavailable storage, or incompatible shapes fall back to an empty local library.
- SSR: local data hydrates after the client is ready so server output stays stable.

Future Go mapping can use authenticated endpoints such as:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/me/library` | Fetch the authenticated user's history, favorites, watch-later list, and liked IDs. |
| PUT | `/api/v1/me/library/favorites/{videoId}` | Add or remove one favorite. |
| PUT | `/api/v1/me/library/watch-later/{videoId}` | Add or remove one watch-later item. |
| PUT | `/api/v1/me/library/likes/{videoId}` | Add or remove one local like. |
| POST | `/api/v1/me/history` | Record a viewed video and optional progress. |

## Local Upload Draft State

Phase 7 keeps upload preparation frontend-only. The browser stores draft metadata so creators can rehearse the投稿 flow before authentication, object storage, moderation, and transcoding exist. It does not store video bytes and does not call `/api/mock`.

```ts
export type UploadDraftVisibility = "public" | "unlisted" | "private"
export type UploadDraftStatus = "draft" | "queued-local"

export interface UploadDraftSource {
  name: string
  size: number
  type: string
  selectedAt: string
}

export interface UploadDraft {
  id: string
  title: string
  description: string
  categorySlug: string
  visibility: UploadDraftVisibility
  tags: string[]
  allowComments: boolean
  sensitive: boolean
  source: UploadDraftSource | null
  status: UploadDraftStatus
  createdAt: string
  updatedAt: string
}
```

Current frontend storage:

- `localStorage` key: `aoi.uploadDrafts.v1`
- Fields: `activeDraftId`, `drafts`
- Recovery: invalid JSON, unavailable storage, or incompatible shapes fall back to an empty draft workspace.
- File handling: only metadata from the selected local file is kept; actual bytes remain outside the app.
- Validation: title, category, and source are required before a draft can enter `queued-local`.

Future Go mapping can split upload metadata creation and file transfer:

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/uploads` | Create an authenticated upload session and return a direct object-storage target. |
| PUT | `/api/v1/uploads/{id}/metadata` | Save title, description, category, visibility, tags, and safety flags. |
| POST | `/api/v1/uploads/{id}/submit` | Submit uploaded media for moderation/transcoding. |
| GET | `/api/v1/me/uploads/drafts` | List authenticated server-side drafts after login exists. |

## Local Following State

Phase 8 keeps creator follows in the browser so the frontend can exercise a personalized following feed without login. It stores creator snapshots and their latest mock videos; it does not call `/api/mock` when follow/unfollow changes.

```ts
export interface FollowedCreatorSnapshot extends CreatorProfile {
  followedAt: string
}
```

Current frontend storage:

- `localStorage` key: `aoi.following.v1`
- Fields: `followedCreators`
- Recovery: invalid JSON, unavailable storage, or incompatible shapes fall back to an empty following list.
- Feed behavior: `/feed/following` combines local followed creator snapshots with mock recommendations from `/api/mock/feed/following`.

Future Go mapping can use authenticated endpoints such as:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/me/following` | List creators followed by the current user. |
| PUT | `/api/v1/me/following/{creatorId}` | Follow one creator. |
| DELETE | `/api/v1/me/following/{creatorId}` | Unfollow one creator. |
| GET | `/api/v1/me/feed/following` | Return the personalized following feed after auth exists. |

## Mock Strategy

- Keep initial fixtures in `app/mocks/`.
- Use the exact TypeScript DTOs above for fixtures.
- Build `useAoiApi()` as the only data access boundary.
- Add mock endpoints only after the static UI is validated.
- When Go starts, generate OpenAPI types or manually keep DTOs synced until API stabilizes.

Current Nuxt mock implementation:

- Shared DTOs and fixtures live in `shared/`.
- App compatibility re-exports remain in `app/types/` and `app/mocks/`.
- `useAoiApi()` calls `/api/mock/*` by default, so page data flow matches future `$fetch` integration.
- `useAoiApi()` wraps `$fetch` with a common `AoiApiErrorPayload` so page error states and settings diagnostics receive stable fields.
- `useAoiApiTelemetry()` stores the latest frontend-side API errors for local debugging.
- Implemented mock endpoints: `/api/mock/home`, `/api/mock/categories`, `/api/mock/videos`, `/api/mock/search`, `/api/mock/videos/:id`, `/api/mock/feed/following`, `/api/mock/users/:handle`, `/api/mock/status`.
- `/api/mock/search` returns a unified `SearchPayload` with videos, creators, categories, and total count.
- Implemented frontend routes beyond the first browsing pass: `/u/:handle` for creator profiles, an API-aware `/feed/following` preview, and tabbed unified search results.

## Go Backend Notes

- Return `application/json; charset=utf-8`.
- Add `requestId` in all error responses.
- Keep IDs as strings to allow UUID, ULID, or snowflake-style IDs.
- Keep upload/video processing state out of the first frontend milestone unless upload UI becomes in scope.
- Auth can start with secure HTTP-only cookies or bearer tokens, but the first frontend design only needs anonymous browsing.

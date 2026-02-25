# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] — 2026-02-24

### Added

- **FreshRSS API client** (`utils/build/freshrss-client.ts`) with two-step
  ClientLogin authentication flow, token caching, and optional Cloudflare
  Zero Trust header support.
- **Feed sync orchestrator** (`utils/build/sync.ts`) — `syncFeeds(env)`
  polls FreshRSS, upserts feeds to D1, and enqueues articles for processing.
  Uses `freshrss_item_id` UNIQUE index for idempotent upserts.
- **Article processor** (`utils/build/article-processor.ts`) — sanitises
  HTML via `sanitize-html`, extracts plain-text summaries (capped at 200
  chars), and normalises article metadata.
- **Workers** — `scheduled` handler calls `syncFeeds`; `queue` consumer
  processes articles with `ack()`/`retry()` semantics.
- **Homepage** (`FeedGrid.astro`, `FeedCard.astro`, `TabBar.astro`) —
  responsive CSS Grid layout with design-token-driven theming. TabBar stubs
  My Feed, Trending, and Starred tabs (disabled until 0.4.0).
- **Articles API** — `GET /api/v1/articles` with pagination (`page`,
  `limit`, `feed_id`, `sort`), limit clamped to max 100.
- **Article Modal** (`ArticleModal.astro`, `utils/client/modal.ts`) — deep
  linking via `pushState`, next/previous navigation, escape-key dismiss.
- **Article detail page** (`/article/[id]`) — SSR for direct URL access
  and SEO.
- **Infinite scroll** (`utils/client/infinite-scroll.ts`) —
  `IntersectionObserver`-based with configurable sentinel, loading states,
  and end-of-list detection.
- **Admin sync endpoint** — `POST /api/v1/admin/sync` as a local dev
  workaround for the Cloudflare Pages cron limitation. Processes articles
  inline after enqueuing.
- **System user** — `ensureSystemUser()` in `db/queries/users.ts` guarantees
  a `system` user row exists for feed FK ownership.
- **DB query helpers** — `db/queries/feeds.ts` (feed upsert) and
  `db/queries/articles.ts` (article upsert with `freshrss_item_id`
  conflict handling).
- **FreshRSS types** (`types/freshrss.ts`) — typed interfaces for GReader
  API subscription and stream content responses.
- **Documentation** — Articles API reference, Feed Sync architecture guide,
  Theming guide added to Starlight docs site.

### Changed

- Integration now injects 5 routes (was 1 in 0.1.0): health, articles,
  homepage, article detail, and admin sync.
- `Env` interface extended with optional `CF_ACCESS_CLIENT_ID` and
  `CF_ACCESS_CLIENT_SECRET` for Zero Trust support.

### Fixed

- FreshRSS authentication — implemented correct two-step ClientLogin flow
  (the raw API password is not a valid auth token; it must be exchanged
  for a hashed token via `/accounts/ClientLogin`).
- Foreign key constraint failure on feed upsert — resolved by creating
  the `system` user before inserting feeds.

### Known Issues

- Cloudflare Pages does not expose `scheduled` or `queue` worker exports
  in local dev (`wrangler pages dev`). The admin sync endpoint provides a
  workaround. Queue/Cron handlers are scaffolded for production deployment.
- Infinite scroll uses offset-based pagination (`page`/`limit`) rather
  than cursor-based. In an actively syncing feed, this can cause duplicate
  items when new articles shift offsets between page requests.
- DB query unit tests for `feeds.ts` and `articles.ts` are deferred —
  queries are integration-tested via sync and worker test mocks.

## [0.1.0] — 2026-02-24

### Added

- **Monorepo scaffold** — NPM Workspaces with `packages/core/` (framework),
  `playground/` (reference app), and `docs/` (Starlight documentation site).
- **Astro integration factory** — `communityRss(options?)` with Options
  pattern, injecting routes via `injectRoute` in `astro:config:setup`.
- **Public API surface** (`index.ts`) — default export, type re-exports
  (`CommunityRssOptions`, `Env`, model types), worker stubs (`scheduled`,
  `queue`).
- **Database schema** (`db/schema.ts`) — full Drizzle ORM schema with 11
  tables: `users`, `sessions`, `accounts`, `verifications`,
  `verified_domains`, `feeds`, `articles`, `followers`, `interactions`,
  `comments`, `media_cache`. Initial migration generated via `drizzle-kit`.
- **CSS design token system** (`styles/tokens.css`) — `--crss-` prefixed
  custom properties covering surface, text, brand, interaction, typography,
  spacing, radius, shadow, and transition tokens. Dark-mode defaults.
- **Base layout** (`layouts/BaseLayout.astro`) — HTML shell with global CSS
  reset and token stylesheet injection.
- **Health endpoint** — `GET /api/v1/health` stub route.
- **Worker stubs** — `scheduled` and `queue` exports (no-op, ready for
  implementation in 0.2.0).
- **Testing infrastructure** — Vitest 3.x in workspace mode, `@vitest/coverage-v8`
  with 80% thresholds, path alias resolution for test imports.
- **Code quality tooling** — ESLint 9 flat config with `typescript-eslint`
  and `eslint-plugin-astro`; Prettier with `prettier-plugin-astro`.
- **Dev Container** — `.devcontainer/devcontainer.json` wired to
  `docker-compose.yml` with port forwarding for all services.
- **Documentation site** — Starlight-based docs with Getting Started,
  API Reference, and Contributing sections (9 content pages).
- **Package exports map** — `./workers`, `./layouts/*`, `./components/*`,
  `./styles/*` subpath exports for consumer access.
- **Test fixtures** — mock data for articles, feeds, and users
  (guest, registered, author, admin).

### Changed

- `docker-compose.yml` updated with port 4322 mapping for docs dev server.
- `.gitignore` extended for Astro, Wrangler, Drizzle, and coverage artifacts.

[Unreleased]: https://github.com/community-rss/community-rss/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/community-rss/community-rss/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/community-rss/community-rss/releases/tag/v0.1.0

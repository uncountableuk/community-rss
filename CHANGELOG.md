# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] — 2026-02-28

### Added

- **Three-tier design token system** — split flat `--crss-*` tokens into
  Reference (`--crss-ref-*`), System (`--crss-sys-*`), and Component
  (`--crss-comp-*`) hierarchy. Backward-compatible flat aliases preserved
  in `system.css`.
- **CSS cascade layers** — `@layer crss-reset, crss-tokens, crss-base,
  crss-components, crss-utilities` ordering in `layers.css`. Consumer
  `theme.css` is un-layered so it always wins over framework styles.
- **Automatic token injection** — `injectScript('page-ssr')` injects
  `layers.css`, `reference.css`, `system.css`, and `components.css` into
  every page automatically. Developers no longer manually import CSS.
- **Astro Actions** — type-safe RPC layer for existing endpoints.
  Action handlers exported from `@community-rss/core/actions` with
  signature `(input, app: AppContext) => Promise<Result>`. Scaffolded
  `src/actions/index.ts` wires handlers into `defineAction()`.
- **Server Islands** — `AuthButton` and `HomepageCTA` refactored to use
  `server:defer` for auth-dependent UI. Server-side session checks
  eliminate client-side `fetch('/api/auth/get-session')` calls.
- **Container API email pipeline** — `.astro` email templates rendered
  via Astro Container API + `juice` CSS inlining. Email theming via
  `EmailThemeConfig` with direct prop interpolation (email clients don't
  support CSS custom properties). Virtual module
  `virtual:crss-email-templates` discovers developer and package templates
  at build time.
- **Proxy component pattern** — `FeedCard`, `FeedGrid`, and `TabBar`
  thin wrapper scaffolds in `src/components/`. Core owns logic;
  developer wrappers own `<style>`.
- **E2E testing with Playwright** — 7 page specs, 3 flow specs
  (auth, guest consent, article browsing). Chromium-only in dev
  container; Firefox/WebKit available for CI.
- **Email template theming** — `EmailThemeConfig` interface with Colors,
  Typography, Spacing, Branding sub-interfaces. `mergeEmailTheme()` for
  deep merge with defaults.
- **Developer-owned Astro email templates** — scaffolded `.astro` email
  templates (`SignInEmail`, `WelcomeEmail`, `EmailChangeEmail`,
  `EmailLayout`) replace HTML templates in the scaffold.
- **AI guidance for framework consumers** — scaffolded
  `.github/copilot-instructions.md` and `.cursor/rules/community-rss.mdc`
  for developers using the framework.
- **`HomepageCTA` component** — dedicated call-to-action component for
  unauthenticated visitors, using `server:defer`.
- **TabBar configurable props** — accepts `tabs` and `ariaLabel` props
  (was hardcoded).
- **Documentation** — Starlight pages for CSS tokens, styling guide,
  architecture decisions, and Astro Actions reference.

### Changed

- `tokens.css` split into `tokens/reference.css`, `tokens/system.css`,
  `tokens/components.css` (three-tier hierarchy).
- Component `<style>` blocks migrated to reference new token hierarchy.
- Email resolution chain simplified to 4 steps: custom code → Astro
  Container (virtual module) → developer HTML → code defaults.
- HTML email templates removed from core package — developers who need
  HTML templates use their own files.
- `AuthButton` performs server-side session check (was client-side fetch).
- `ConsentModal` refactored to import shared `initGuestSession()`.
- Middleware ordering set to `order: 'pre'` to populate `Astro.locals.app`
  before user-defined middleware.
- CLI scaffold template `tsconfig.json` uses `"noCheck": true` (TS 5.5+)
  to suppress diagnostics in template files.
- All `.github/` instruction files rewritten for new architecture patterns.
- `packages/core/package.json` exports map extended with `./actions`.

### Fixed

- Mailpit SMTP transport now includes HTML body field.
- Stale compiled `.js`/`.d.ts` artifacts no longer interfere with Vitest
  resolution.
- Playwright UI mode works in headless dev container via
  `--ui-host=0.0.0.0 --ui-port=8077`.

### Known Issues

- Component `<style>` blocks use Astro scoped styles
  (`[data-astro-cid-*]`) which have specificity (0,2,0) — consumer
  `.crss-*` class overrides in `theme.css` (specificity 0,1,0) are
  silently ignored without `!important`. Token overrides (Levels 1–3)
  work correctly; class-level overrides (Level 4) do not.
  *Planned fix: 0.6.0.*
- ~85% of Tier 3 component tokens (`--crss-comp-*`) are defined in
  `components.css` but not consumed by component styles — the documented
  token customisation path is partially inert. *Planned fix: 0.6.0.*
- Scaffold page templates import components directly from
  `@community-rss/core/components/*`, bypassing the scaffolded proxy
  wrappers. Proxy overrides have no effect. *Planned fix: 0.6.0.*
- Client-side `fetch()` calls in `utils/client/` not yet migrated to
  Astro Actions — `astro:actions` cannot be imported from the core
  package, only from consumer projects.

## [0.4.0] — 2026-02-27

### Added

- **Docker/VPS deployment** — full stack via `docker-compose up`:
  app (Node.js 22), FreshRSS, MinIO, Mailpit.
- **`@astrojs/node` adapter** — replaces `@astrojs/cloudflare`.
  Universal deployment to any VPS or Docker host.
- **better-sqlite3 database** — WAL mode, singleton connection factory,
  auto-migration on startup via `createDatabase()`.
- **`AppContext` runtime context** — `{ db, config, env }` injected
  into every request via Astro middleware (`context.locals.app`).
- **`EnvironmentVariables` interface** — typed `process.env` values
  replacing Cloudflare `Env` bindings.
- **Config bridge** (`config-store.ts`) — `setGlobalConfig()`/
  `getGlobalConfig()` via `globalThis.__communityRssConfig` to pass
  resolved integration config from `astro:config:setup` to middleware.
- **node-cron scheduler** — in-process cron for feed sync, replacing
  Cloudflare scheduled workers. `startScheduler()`/`stopScheduler()`.
- **File-based email templates** — `email-renderer.ts` with
  `{{variable}}` placeholders. 3-tier resolution: custom code →
  developer file → package default file → code fallback.
- **CLI scaffold command** — `npx @community-rss/core init` scaffolds
  pages, email templates, config files, and `theme.css` into developer
  projects. `--force` to overwrite, `--help` for usage.
- **Configurable component props** — all components accept `labels`/
  `messages` props; no hard-coded user-facing strings.
- **Ephemeral playground** — `scripts/reset-playground.sh` with
  `--keep-db` (default) and full wipe options. Playground is gitignored.
- **Production Dockerfile** — multi-stage build for Node.js deployment.
- **`docker-compose.prod.yml`** — production stack override.

### Changed

- **Database layer** — D1/Drizzle migrated to better-sqlite3/Drizzle.
  All query helpers accept `BetterSQLite3Database` instead of `D1Database`.
- **Route handlers** — migrated from Cloudflare Workers `Request`/`Env`
  to Astro SSR `APIContext` with `context.locals.app`.
- **Background processing** — Cloudflare Queues replaced by inline
  `processArticle()` in the sync loop.
- **Email transport** — Resend SDK + Mailpit SMTP (was Resend only).
- **Page ownership** — pages scaffolded into developer's `src/pages/`
  (was injected from package). API routes remain injected.
- **`Env` type deprecated** — replaced by `EnvironmentVariables` in
  `src/types/context.ts`. `Env` kept as alias for one release.
- Integration injects 11 API routes (was 5 in 0.3.0): health, articles,
  admin sync, admin feeds, auth catch-all, check-email, signup, profile,
  change-email, confirm-email-change, dev seed.

### Removed

- **Cloudflare Workers** — `workers/scheduled.ts`, `workers/queue.ts`,
  and `workers/index.ts` removed.
- **Wrangler** — `wrangler.toml` and `.dev.vars` removed from playground.
- **D1 database bindings** — replaced by file-based SQLite.
- **Queue/R2 bindings** — replaced by inline processing / MinIO S3.

### Fixed

- Middleware now exports `onRequest` correctly (was exporting factory
  function, causing 503 errors on all routes).
- Auto-migration runs in `createDatabase()` singleton before first query.
- JSDoc comments no longer contain literal `*/` which broke esbuild.

### Known Issues

- `vi.mock()` hoisting requires `vi.hoisted()` for all mock variable
  declarations — applies across the entire test suite.
- Docker bind mount file ownership can cascade to root-owned files;
  resolved by running container as non-root user.
- `sed`-based refactoring is error-prone for code modifications (double
  prefix bug); prefer editor find/replace.

## [0.3.0] — 2026-02-25

### Added

- **Magic-link authentication** — `better-auth` with magic-link plugin,
  Drizzle adapter for SQLite. Sign-in via email link (no passwords).
- **Guest consent flow** — `ConsentModal` component for anonymous
  interaction consent. Shadow profiles via randomly-generated UUID
  cookies. `window.__crssShowConsentModal()` API returns
  `Promise<string | null>`.
- **Guest-to-registered migration** — interactions transfer from guest
  shadow profile to registered account on sign-up.
- **Sign-up flow** — email pre-check → redirect to sign-up if
  unregistered → pending data stored in bridge table → applied after
  magic-link verification. `pendingSignups` table for transient data.
- **User profile page** — display name and bio editing with inline
  editors.
- **Email change with verification** — 24-hour one-time tokens, separate
  from magic-link tokens. `pendingEmail`, `pendingEmailToken`,
  `pendingEmailTokenExpiresAt` columns on `users` table.
- **Email service architecture** — three-layer design: templates
  (pure functions) → service (orchestration) → transports (delivery).
  `EmailTransport` interface, dual transport: Resend (production) +
  SMTP (Mailpit for dev). `EmailTypeDataMap` supports declaration
  merging for consumer-extensible email types.
- **Admin feed management** — `POST/GET/DELETE /api/v1/admin/feeds`.
  Deterministic feed IDs via djb2 hash of URL. `validateFeedUrl()`
  utility. Admin users bypass domain verification.
- **System User formalization** — `ensureSystemUser()` seeds
  `id: 'system'` with `role: 'admin'` on database setup. Defensive
  check in `syncFeeds()`.
- **Auth UI components** — `AuthButton.astro` (sign-in/sign-out toggle),
  `MagicLinkForm.astro` (email input + magic link request),
  `SignUpForm.astro` (registration with Terms consent),
  `ConsentModal.astro` (guest interaction consent).
- **Auth pages** — sign-in, sign-up, verify (magic link landing),
  verify-email-change, profile, terms of service placeholder.
- **`role` column** on `users` table — `guest`, `registered`, `author`,
  `admin` tiers.
- **Dev seed route** — `POST /api/dev/seed` for local development
  database seeding.
- **`requireAuth()`/`requireAdmin()`** helpers for route protection.
- **Documentation** — authentication guide, email setup guide, admin
  feeds guide, routes API reference.

### Changed

- `BaseLayout` header now includes `AuthButton` for session-aware
  sign-in/sign-out.
- Integration injects 5 new routes: auth catch-all, check-email,
  signup, admin feeds, dev seed.
- `users` table schema extended with `role`, `emailVerified`,
  `pendingEmail`, `pendingEmailToken`, `pendingEmailTokenExpiresAt`.

### Fixed

- Magic link sign-in flow: unapplied migration, wrong redirect URL,
  and session cookie caching issues resolved.
- Sign-out 415 error: better-auth requires `Content-Type: application/json`
  with non-empty body for POST requests.
- Drizzle migration gap: `drizzle-kit` missed 1 of 3 new columns;
  manual `ALTER TABLE` appended to migration.

### Known Issues

- `vi.mock()` factory hoisting requires `vi.hoisted()` for any variable
  referenced inside mock factories.
- better-auth `databaseHooks` do not receive request cookies — guest
  migration handled in route handler instead.
- D1 database seeding requires dev-only API route (Miniflare DB
  inaccessible from external Node.js process).

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

## [0.1.0] — 2026-02-23

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

[Unreleased]: https://github.com/community-rss/community-rss/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/community-rss/community-rss/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/community-rss/community-rss/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/community-rss/community-rss/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/community-rss/community-rss/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/community-rss/community-rss/releases/tag/v0.1.0

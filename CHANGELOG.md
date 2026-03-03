# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] — 2026-03-03

### Added

- **Progressive customization hierarchy** — four-level framework for
  customizing the framework: (1) CSS Tokens & Classes, (2) Page Layouts,
  (3) Components & Layouts (via eject), (4) API & Actions. Documented in
  guides and AI instructions.
- **Conditional page injection** — 8 pages (index, profile, terms, article
  detail, auth flows, verify-email-change) now injected by default rather
  than scaffolded. Developers who have local page files get them mapped
  automatically; no breaking change on upgrade.
- **Global layered styles for all components** — all 9 components +
  BaseLayout migrated from Astro scoped `<style>` to `<style is:global>`
  wrapped in `@layer crss-components`, fixing CSS specificity barrier that
  prevented consumer class overrides in `theme.css`.
- **Tier 3 component tokens fully wired** — added 10+ new tokens
  (`--crss-comp-cta-*`, `--crss-comp-header-*`, `--crss-comp-btn-*`,
  `--crss-comp-form-*` expansions) and consumed every defined token across
  all components. No hardcoded colour, size, or transition values remain.
- **`npx crss eject` CLI command** — take ownership of pages, components,
  layouts, and actions locally. Supports auto-ejection of dependencies
  (`eject pages/profile` also ejects layout + component proxies), re-ejection
  with content preservation, `--force` overwrites, and batch operations
  (`eject all`, `eject upgrade`).
- **Slot-based proxy component system** — all ejectable artefacts use Astro
  named slots for granular customization. Comments mark each slot with
  `SLOT: <name>` and show the default content. Developer uncomments a
  `<Fragment>` block to override. Re-eject automatically refreshes comment
  blocks while preserving active overrides (idempotent).
- **Annotation-driven ejection** — all `.astro` source files in core
  annotated with `@eject-module`, `@eject-slot`, `@eject-dependency` JSDoc
  blocks. No hand-written slot registry file — `eject.mjs` parses annotations
  at runtime and generates proxies dynamically. Consumers can also use
  `@crss-lookup/<category>/<File>.astro` virtual prefix in ejected code.
- **`coreActions` spread pattern** — 6 action definitions (`fetchArticles`,
  `checkEmail`, `submitSignup`, `updateProfile`, `changeEmail`,
  `confirmEmailChange`) exported from `@community-rss/core/actions`. Scaffolded
  `src/actions/index.ts` uses `...coreActions` instead of copying handlers.
  New actions added to core appear automatically after `npm update` (no manual
  scaffold refresh needed).
- **Minimal CLI scaffold** — `npx crss init` now produces a minimal project:
  config files, `theme.css`, `src/actions/index.ts`, and signpost READMEs
  (no page files, no component proxies). Pages are served via injection;
  proxies are created on-demand via `eject`.
- **Signpost READMEs** — three new template READMEs explain the progressive
  customization model to developers: `src/pages/README.md`, `src/components/README.md`,
  `src/layouts/README.md`. Each lists available targets and shows how to eject.
- **Enhanced `theme.css` scaffold** — now documents all four customization
  levels with practical examples: brand colour change, dark mode, sticky
  header, flat card style, pill-shaped buttons. Line count tripled from 47
  to ~130 with educational comments.
- **Article page SSR** (`/article/[id]`) — migrated from client-side rendering
  to server-side rendering. Article data fetched in Astro frontmatter via
  `Astro.locals.app`, full HTML rendered on first load, dynamic article modal
  replaced with full-page template. Proper 404 status for missing articles.
- **Homepage SSR with progressive enhancement** — articles fetched server-side
  and rendered via `FeedCard.astro`. Replaced 130-line client-side `createArticleCard()`
  function with Astro-rendered cards. Infinite scroll via `IntersectionObserver`
  uses `DOMParser` to extract server-rendered cards from next page's response.
  No-JS fallback: `#crss-load-more-link` navigates normally.
- **`getArticlesWithFeedTitle` DB query** — new `leftJoin` query in
  `src/db/queries/articles.ts` returns `ArticleWithFeedTitle[]` with joined
  feed titles. Exported from the public API.
- **Consumer `theme.css` auto-injection** — integration now auto-detects and
  injects developer's `src/styles/theme.css` after framework CSS. No manual
  import needed; token and class overrides apply automatically.
- **Cascading component override fixes** — Vite plugin (`crss-consumer-overrides`)
  scope expanded from core pages to all core `.astro` imports. Ejected `FeedCard`
  override now cascades to cards rendered on the homepage, in infinite scroll,
  everywhere the component is used internally. Plugin runs with `enforce: 'pre'`
  to intercept relative imports before Vite's default resolution phase.
- **Consumer `@crss-lookup/` virtual prefix** — developers can use
  `@crss-lookup/components/FeedCard.astro` in ejected proxy code for
  ergonomic access to sibling proxy files (same resolution semantics as
  regular eject).
- **Prismatic test coverage** — added 150+ new tests across 7 new test files:
  CSS architecture (cascading, specificity), token wiring (audit), annotation
  parsing, proxy generation, re-ejection, conditional injection, SSR article
  page, articles-with-feed-title DB query. Coverage: 87.7% statements, 88.4%
  branches, 88.4% functions.
- **Comprehensive documentation** — rewrote 3 Starlight guide pages
  (customisation, styling, CLI) and added new reference pages. Updated all
  `.github/` instruction files for AI assistants (Copilot, Cursor). Added
  framework-contributor instructions for maintaining annotations.
- **AI guidance for developers** — scaffolded `.github/copilot-instructions.md`
  and `.cursor/rules/community-rss.mdc` now explain progressive customization,
  the four-level hierarchy, and when to use eject vs theme.css.

### Changed

- **Component styles**: All 9 components + BaseLayout now use `<style is:global>`
  + `@layer crss-components` (was scoped `<style>` causing specificity conflicts).
  Removed all `:global()` wrapper blocks (now redundant).
- **Page templates**: All 8 page source files and their CLI template copies
  use global layered styles (fixed consumer CSS overrides for page-scoped styles).
- **CLI scaffold**: Removed page files and component proxy stubs. Added
  signpost READMEs explaining injection model and eject command. File count
  reduced from 22 to 14.
- **Page imports in core**: Moved from `@community-rss/core/components/*`
  (bypassing proxies) to relative imports via the `crss-consumer-overrides`
  Vite plugin, enabling consumer proxy cascading.
- **Integration route injection**: Added conditional page injection hook —
  8 page routes now injected conditionally. If developer has a local file
  at the expected path, injection is skipped and Astro's file router uses
  the developer's version automatically.
- **Actions scaffold**: Changed from full-copy of handlers (with duplicated
  Zod schemas) to `coreActions` spread pattern with wrapper. Stale action
  copy issues eliminated.
- **`zod` dependency**: Added as both `peerDependency` (forces singleton
  resolution in consumers) and `devDependency` (core's own tests).
- **Astro SSR default**: All pages now use SSR for data fetching by default.
  Homepage and individual article pages fetch data in frontmatter and render
  full HTML on initial load. Exceptions must be explicitly documented and
  approved (CSR incompatible with proxy override system).
- **AI instruction files**: Updated `.github/copilot-instructions.md`,
  `.github/instructions/implementation.instructions.md`, consumer guidance
  templates. All now reference the four-level hierarchy, conditional injection,
  annotation-driven ejection, and SSR-first page rendering.

### Fixed

- **Consumer `.crss-*` class overrides now work** — specificity barrier removed
  by switching from scoped styles (`[data-astro-cid-*]` combinator) to layered
  global styles. Consumer `theme.css` classes beat framework `@layer
  crss-components` without need for `!important`.
- **Page style scoping blocked theme overrides** — all 8 page files were using
  scoped `<style>` blocks, a 0.5.0 regression. Now using global layered styles.
- **Consumer theme.css never injected** — integration was missing auto-detection
  step. Now scans for `<astroRoot>/src/styles/theme.css` and injects it last.
- **Injected pages bypassed consumer proxy components** — relative imports from
  core pages resolved back to the core package, not the consumer's ejected
  proxies. Added `crss-consumer-overrides` Vite plugin with `enforce: 'pre'`
  to intercept and redirect to consumer files.
- **Vite plugin not running early enough** — filesystem resolver ran before
  normal `resolveId` hooks. Added `enforce: 'pre'` to ensure plugin runs in
  pre-resolution phase.
- **Layout proxy slot forwarding hiding defaults** — proxy forwarded all named
  slots (header, footer), causing condition checks in the core layout to
  detect "provided" siots and render empty wrappers instead of defaults.
  Removed header/footer slot forwarding from proxy template.

### Removed

- **`slot-registry.mjs` — superseded by annotation-driven parser.**
  `eject.mjs` now parses `@eject-module` and `@eject-slot` annotations
  directly from source files at runtime. No intermediate registry file.
- **Page scaffold entries — pages no longer scaffolded.** Framework injects
  them by default; developers use `eject` to take local ownership.
- **Component proxy scaffold entries — proxies on-demand via `eject`.**
  Minimal scaffold contains only signpost READMEs explaining how to eject.
- **Global scoped styles duplication — `:global()` wrapper blocks removed**
  from components since all styles are now global + layered.
- **Client-side article rendering — removed 130-line `createArticleCard()` JS
  builder** that duplicated FeedCard.astro markup. Articles now rendered
  server-side by Astro components.

### Known Issues

- `prettier` configurations in `.vscode/settings.json` may conflict with Astro's
  formatter on save. Playground sets `editor.formatOnSave: false` (user-driven
  formatting preferred).
- Large ejected files may cause TypeScript linting to consider them "generated"
  and suppress diagnostics. Add `// @ts-check` JSDoc to re-enable for Cursor
  IDE users.
- `@importfromN` annotation values use `@crss-lookup/` prefix which is resolved
  at consumer build time. If the prefix is not defined in the consumer's
  `astro.config.mjs` (e.g., old pre-0.6.0 projects that haven't updated), the
  import will fail. Added `crss-consumer-overrides` plugin to handle redirect
  for pages; consumers must apply similar logic if they define custom Vite
  plugins for component-level imports.

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

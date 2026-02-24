# Community RSS Framework — Full Project Plan

*First Iteration Roadmap: 0.1.0 → 0.6.0*

> **Master Requirements Document:**
> [`feature_plans/0_0_1/Community-RSS-Framework-Spec.md`](../0_0_1/Community-RSS-Framework-Spec.md)
> is the single source of truth for *what* to build.
> This plan describes *how* and *when* to implement it.
> If there is any conflict, the spec takes precedence.

## Tooling Decisions

### Testing Stack

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **Vitest** | Unit & integration test runner | Already mandated by CI & `.github` instructions. Fast, native ESM, Vite-aligned. |
| **@cloudflare/vitest-pool-workers** | Cloudflare Workers/D1/R2/Queues testing | Runs tests inside a Miniflare environment — real D1 (local SQLite), real R2, real Queues. Replaces manual Miniflare setup. |
| **vitest/coverage-v8** | Code coverage | Native V8 coverage — fast, accurate, enforces ≥80% thresholds in CI. |
| **MSW (Mock Service Worker)** | HTTP mocking (FreshRSS API, Resend) | Intercepts outgoing HTTP at the network level. Avoids coupling tests to implementation details. |
| **@testing-library/dom** | Client-side DOM interaction tests | Lightweight, accessible-first queries for testing Hearts/Stars/Comments UI. |

### Documentation Stack

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **Starlight** (Astro) | Documentation site | Stays in the Astro ecosystem. Markdown/MDX authoring. Full-text search built-in. Ships as static HTML. Runs as a third workspace (`docs/`) in the monorepo. |
| **TypeDoc** | API reference generation | Auto-generates API docs from JSDoc/TSDoc in `packages/core/`. Output is Markdown that Starlight can ingest. |

**Starlight satisfies both requirements:**
- `npm run dev` in `docs/` serves on `localhost:4322` with HMR
- `npm run build` in `docs/` produces a `dist/` folder of standalone static HTML files deployable anywhere (Netlify, S3, GitHub Pages, any HTTP server)

### Code Quality Stack

| Tool | Purpose |
|------|---------|
| **ESLint 9** (flat config) | Linting with `@typescript-eslint`, `eslint-plugin-astro` |
| **Prettier** | Formatting with `prettier-plugin-astro` |
| **TypeScript 5.x** | Strict mode, path alias support via `tsconfig.json` `paths` |

### Auth Stack

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **better-auth** | Authentication framework | Active maintenance, built-in D1/SQLite support via Drizzle adapter, magic-link plugin, session management, Cloudflare Workers compatible. |
| **Drizzle ORM** | Database layer for better-auth | Required by better-auth's Drizzle adapter. Also used for the framework's own D1 queries — provides type-safe SQL with zero runtime overhead. |

### Additional Dependencies

| Package | Purpose | Context |
|---------|---------|---------|
| **sanitize-html** | HTML sanitisation for RSS article content | Server-side (build context). Configurable allow-lists for tags/attributes. |
| **cheerio** | HTML parsing for image extraction (media caching) | Server-side (build context). jQuery-like API on the server. |
| **resend** | Transactional email (magic links, comment moderation) | Production email provider. Mailpit used locally. |
| **@aws-sdk/client-s3** | S3-compatible object storage (R2, MinIO, DigitalOcean Spaces) | Media caching pipeline. Works with R2, MinIO (local), and DO Spaces. |


---

## Local Environment Setup

### Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- VS Code with Dev Containers extension
- Git

### Step-by-Step First Run

```
1. Clone the repository
   $ git clone <repo-url> && cd community-rss

2. Start Docker infrastructure
   $ docker compose up -d
   → Starts: app (Node 22), freshrss, minio, mailpit

3. Attach VS Code to the dev container
   Ctrl+Shift+P → "Dev Containers: Attach to Running Container"
   → Select "community_rss_app"

4. Install monorepo dependencies (inside container)
   $ npm install
   → Wires workspace symlinks: packages/core ↔ playground ↔ docs

5. One-time service configuration
   a. FreshRSS: Visit http://localhost:8080 on host
      → Create admin user, note the API password
   b. MinIO: Visit http://localhost:9001 on host
      → Login with localadmin/localpassword
      → Create bucket "community-images", set Access Policy = public

6. Create playground environment file
   $ cp playground/.dev.vars.example playground/.dev.vars
   → Fill in FreshRSS password from step 5a

7. Apply database schema (from container)
   $ cd playground
   $ npx drizzle-kit generate       # generates SQL migrations from Drizzle schema
   $ npx wrangler d1 migrations apply community_db --local

8. Start the playground dev server
   $ npm run dev              # serves on http://localhost:4321

9. Start the docs dev server (separate terminal)
   $ cd docs && npm run dev   # serves on http://localhost:4322

10. Verify everything works
    - Playground: http://localhost:4321
    - Docs: http://localhost:4322
    - Emails: http://localhost:8025
    - FreshRSS: http://localhost:8080
    - MinIO Console: http://localhost:9001
```

### Docker Compose Updates Required

The existing `docker-compose.yml` needs a port mapping added to
expose the docs dev server:

```yaml
# In the "app" service, add port 4322:
ports:
  - "4321:4321"  # Astro playground
  - "4322:4322"  # Starlight docs
```

### Dev Container Configuration

Create `.devcontainer/devcontainer.json`:

```jsonc
{
  "name": "Community RSS Dev",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/app",
  "forwardPorts": [4321, 4322, 8025, 8080, 9000, 9001],
  "postCreateCommand": "npm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "astro-build.astro-vscode",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "vitest.explorer"
      ]
    }
  }
}
```

---

## Monorepo Directory Structure (Target)

```
/app (root)
├── .devcontainer/
│   └── devcontainer.json
├── .github/
│   ├── copilot-instructions.md
│   ├── instructions/
│   ├── prompts/
│   ├── skills/
│   └── workflows/ci.yml
├── docker-compose.yml
├── package.json                    # Root: workspaces, shared devDeps
├── tsconfig.base.json              # Shared TS config (path aliases)
├── vitest.config.ts                # Root Vitest config
├── eslint.config.js                # Flat ESLint config
├── .prettierrc                     # Prettier config
├── .node-version                   # Node 22
├── feature_plans/
│
├── packages/
│   └── core/
│       ├── package.json            # @community-rss/core
│       ├── index.ts                # Public API surface
│       ├── tsconfig.json           # Extends base, adds path aliases
│       ├── vitest.config.ts        # Core-specific Vitest config
│       └── src/
│           ├── integration.ts      # Astro integration factory
│           ├── types/
│           │   ├── env.d.ts        # Cloudflare bindings (Env)
│           │   ├── options.ts      # CommunityRssOptions interface
│           │   └── models.ts       # Domain model interfaces
│           ├── db/
│           │   ├── schema.ts       # Drizzle ORM schema (single source of truth)
│           │   ├── migrations/     # Auto-generated by drizzle-kit (never hand-written)
│           │   └── queries/        # Query helper modules
│           ├── utils/
│           │   ├── build/          # Node.js / Worker context
│           │   ├── client/         # Browser context
│           │   └── shared/         # Pure functions
│           ├── components/         # Astro components
│           ├── layouts/            # Astro layouts
│           ├── routes/             # Injected API routes
│           │   └── api/v1/
│           └── workers/            # Cron + Queue consumer exports
│       └── test/
│           ├── fixtures/           # Shared test data
│           ├── utils/              # Mirrors src/utils/
│           ├── db/                 # DB query tests
│           └── routes/             # Route handler tests
│
├── playground/
│   ├── package.json
│   ├── astro.config.mjs
│   ├── wrangler.toml
│   ├── .dev.vars.example
│   └── src/                        # Minimal — tests default scaffolding
│
└── docs/
    ├── package.json                # @community-rss/docs (private)
    ├── astro.config.mjs            # Starlight config
    └── src/
        └── content/
            └── docs/
                ├── getting-started/
                ├── api-reference/
                ├── guides/
                └── contributing/
```

---

## Release Roadmap

### Release 0.1.0 — Foundation & Scaffold

**Goal:** Working monorepo with integration skeleton, database schema,
design token system, testing infrastructure, and documentation site.
No user-facing functionality yet — this is the platform upon which
everything else is built.

#### Phase 1: Monorepo Scaffolding
- [ ] Create root `package.json` with workspaces (`packages/*`, `playground`, `docs`)
- [ ] Create `.node-version` file (Node 22)
- [ ] Create `tsconfig.base.json` with strict mode and path alias definitions
- [ ] Create `packages/core/package.json` (`@community-rss/core`)
- [ ] Create `packages/core/tsconfig.json` extending base with path aliases
  - `@utils/*`, `@components/*`, `@routes/*`, `@db/*`, `@core-types/*`,
    `@layouts/*`, `@fixtures/*`, `@test/*`
- [ ] Create `playground/package.json` with `@community-rss/core: "*"` dependency
- [ ] Create `playground/astro.config.mjs` consuming the integration
- [ ] Create `playground/wrangler.toml` with D1, R2, Queue bindings
- [ ] Create `playground/.dev.vars.example` with all required env vars
- [ ] Create `docs/package.json` (Starlight workspace)
- [ ] Create `docs/astro.config.mjs` with Starlight configuration
- [ ] Create `.devcontainer/devcontainer.json`
- [ ] Update `docker-compose.yml` to add port 4322

#### Phase 2: Code Quality Tooling
- [ ] Install and configure ESLint 9 (flat config) at root
  - `@typescript-eslint/eslint-plugin`
  - `eslint-plugin-astro`
  - Rules: no-unused-vars, consistent-type-imports, import-order
- [ ] Install and configure Prettier at root
  - `prettier-plugin-astro`
  - Config: single quotes, trailing commas, 100 char print width
- [ ] Add root scripts: `lint`, `lint:fix`, `format`, `format:check`
- [ ] Configure VS Code workspace settings for ESLint + Prettier

#### Phase 3: Testing Infrastructure
- [ ] Install Vitest at root
- [ ] Install `@cloudflare/vitest-pool-workers` in `packages/core`
- [ ] Create root `vitest.config.ts` (workspace mode)
- [ ] Create `packages/core/vitest.config.ts` with coverage thresholds (≥80%)
- [ ] Configure path alias resolution in Vitest
- [ ] Create initial test fixtures directory: `packages/core/test/fixtures/`
- [ ] Add root scripts: `test`, `test:run`, `test:coverage`
- [ ] Verify CI workflow (`ci.yml`) runs tests correctly

#### Phase 4: Astro Integration Skeleton
- [ ] Create `packages/core/src/types/options.ts` — `CommunityRssOptions` interface
- [ ] Create `packages/core/src/types/env.d.ts` — Cloudflare `Env` interface
- [ ] Create `packages/core/src/integration.ts` — Astro integration factory
  - Accepts `CommunityRssOptions` (Options pattern)
  - Stub route injection using `injectRoute` in `astro:config:setup` hook
  - Resolve entrypoint paths safely via
    `new URL('./routes/api/v1/articles.ts', import.meta.url).pathname`
    to prevent build-step obfuscation from breaking route resolution
  - Stub component injection
- [ ] Create `packages/core/index.ts` — public API surface
  - Default export: `communityRss()`
  - Named exports: `CommunityRssOptions` interface
  - Worker exports stub: `scheduled`, `queue`
- [ ] **Cloudflare Adapter Worker Entrypoint:**
  The default Astro Cloudflare Pages adapter builds its own `_worker.js`
  and may ignore a standalone `src/worker.ts`. To ensure Cloudflare
  recognises `scheduled` (Cron) and `queue` handlers:
  - Configure the `@astrojs/cloudflare` adapter with the `functionPerRoute`
    option or a custom worker entrypoint that re-exports the
    framework's background handlers
  - Alternatively, the integration can inject the exports into the
    Astro server entry at build time
  - Validate in the playground that `curl http://localhost:4321/__scheduled`
    triggers the Cron handler locally
- [ ] Verify playground starts with `npm run dev` and renders a shell page

#### Phase 5: Database Schema (Drizzle-First Workflow)

The canonical schema is defined in TypeScript via Drizzle ORM. SQL migration
files are **generated** by `drizzle-kit generate` — never hand-written.
This eliminates schema drift between TypeScript types and the database.

- [ ] Install `drizzle-orm` and `drizzle-kit` in `packages/core`
- [ ] Create `packages/core/src/db/schema.ts` — full Drizzle ORM schema:
  - `users` (id, email, is_guest, name, bio, avatar_url, created_at, updated_at)
  - `sessions`, `accounts`, `verifications` (better-auth — generated via
    `npx @better-auth/cli generate` and merged into the Drizzle schema)
  - `verified_domains` (id, user_id, domain_name, verified_at)
  - `feeds` (id, user_id, feed_url, title, description, category, status,
    consent_at, created_at)
  - `articles` (id, feed_id, freshrss_item_id **UNIQUE**, title, content,
    summary, original_link, author_name, published_at, synced_at,
    media_pending boolean default true)
  - `followers` (user_id, target_user_id — composite PK)
  - `interactions` (user_id, article_id, type — composite PK, created_at)
  - `comments` (id, article_id, user_id, content, status, created_at)
  - `media_cache` (id, article_id, original_url, storage_key, cached_at)
  - Indexes on foreign keys and frequently queried columns
- [ ] Create `packages/core/drizzle.config.ts` — drizzle-kit config
  pointing to `src/db/schema.ts`, outputting to `src/db/migrations/`
- [ ] Run `npx drizzle-kit generate` to produce the initial migration
- [ ] Create `packages/core/src/db/queries/` — empty query module stubs
- [ ] Test: migration applies cleanly to local D1 via
  `npx wrangler d1 migrations apply community_db --local`

#### Phase 6: CSS Design Token System
- [ ] Define CSS custom property naming convention: `--crss-{category}-{name}`
- [ ] Create `packages/core/src/styles/tokens.css` with default theme:
  - Surface colours: `--crss-surface-0` through `--crss-surface-3`
  - Text colours: `--crss-text-primary`, `--crss-text-secondary`, `--crss-text-muted`
  - Brand colours: `--crss-brand-primary`, `--crss-brand-accent`
  - Interaction colours: `--crss-heart`, `--crss-star`, `--crss-comment`
  - Typography: `--crss-font-family`, `--crss-font-size-*`
  - Spacing: `--crss-space-*`
  - Border radius: `--crss-radius-*`
- [ ] Create `packages/core/src/layouts/BaseLayout.astro` — injects token stylesheet
- [ ] Document token override mechanism in Starlight docs

#### Phase 7: Documentation Site Bootstrap
- [ ] Scaffold Starlight site in `docs/`
- [ ] Create documentation structure:
  - `docs/src/content/docs/getting-started/installation.md`
  - `docs/src/content/docs/getting-started/configuration.md`
  - `docs/src/content/docs/getting-started/local-development.md`
  - `docs/src/content/docs/api-reference/integration.md`
  - `docs/src/content/docs/api-reference/options.md`
  - `docs/src/content/docs/contributing/setup.md`
  - `docs/src/content/docs/contributing/architecture.md`
  - `docs/src/content/docs/contributing/testing.md`
- [ ] Configure TypeDoc to generate Markdown from `packages/core/index.ts`
- [ ] Add `docs:dev` and `docs:build` scripts
- [ ] Verify static build produces standalone HTML in `docs/dist/`

#### Phase 8: Tests for 0.1.0
- [ ] `test/integration/integration-factory.test.ts` — integration creates correct config
- [ ] `test/types/options.test.ts` — CommunityRssOptions defaults and validation
- [ ] `test/db/schema.integration.test.ts` — Drizzle migration applies to D1, all tables exist
- [ ] Verify ≥80% coverage of all new code
- [ ] Playground builds without errors: `npm run build --workspace=playground`

---

### Release 0.2.0 — Feed Sync & Reader Core

**Goal:** Working feed synchronisation from FreshRSS to D1, with a
browsable homepage showing articles in a masonry grid layout.

#### Phase 1: FreshRSS API Client
- [ ] Create `packages/core/src/utils/build/freshrss-client.ts`
  - `fetchFeeds()` — list subscribed feeds from GReader API
  - `fetchArticles(feedId, since?)` — fetch articles with pagination
  - Cloudflare Zero Trust headers (CF-Access-Client-Id/Secret)
  - Error handling: retries, timeouts, malformed responses
- [ ] Create `packages/core/src/types/freshrss.ts` — API response interfaces
- [ ] Test: `test/utils/build/freshrss-client.test.ts` (MSW-mocked HTTP)

#### Phase 2: Sync Worker & Queue Consumer
- [ ] Create `packages/core/src/utils/build/sync.ts`
  - `syncFeeds(env: Env)` — cron-triggered sync orchestrator
  - Polls FreshRSS, upserts feeds into D1, enqueues new articles
  - **Idempotency:** Uses `freshrss_item_id` (UNIQUE index) for upsert:
    `INSERT ... ON CONFLICT (freshrss_item_id) DO UPDATE` for modified
    articles, `DO NOTHING` for unchanged ones. Prevents duplicate
    insertion across repeated Cron runs.
- [ ] Create `packages/core/src/utils/build/article-processor.ts`
  - Queue consumer: sanitise HTML, extract metadata, store in D1
  - Uses `sanitize-html` with configurable allow-lists
  - Articles stored with `media_pending = true` and original external image URLs
    (image caching runs asynchronously in 0.6.0)
- [ ] Create `packages/core/src/workers/scheduled.ts` — exports `scheduled` handler
- [ ] Create `packages/core/src/workers/queue.ts` — exports `queue` consumer
- [ ] Create `packages/core/src/db/queries/feeds.ts` — feed CRUD (Drizzle ORM)
- [ ] Create `packages/core/src/db/queries/articles.ts` — article CRUD with
  `freshrss_item_id` upsert logic (Drizzle ORM)
- [ ] Test: `test/utils/build/sync.test.ts` (mocked D1 + MSW)
  - Must test idempotency: same article synced twice → single row in D1
- [ ] Test: `test/utils/build/article-processor.test.ts`
- [ ] Test: `test/db/queries/feeds.test.ts` (Miniflare D1)
- [ ] Test: `test/db/queries/articles.test.ts` (Miniflare D1, including upsert)

#### Phase 3: Homepage & Feed Cards
- [ ] Create `packages/core/src/components/FeedCard.astro`
  - Displays: title, source, date, summary, heart/star counts
  - CSS custom properties for all visual values
- [ ] Create `packages/core/src/components/FeedGrid.astro`
  - Masonry/grid layout with CSS Grid
  - Infinite scroll trigger (Intersection Observer)
- [ ] Create `packages/core/src/components/TabBar.astro`
  - Tabs: All Feeds (active by default for guests)
  - Stubs for: My Feed, Trending, Starred (disabled until 0.4.0)
- [ ] Create `packages/core/src/routes/api/v1/articles.ts`
  - `GET /api/v1/articles` — paginated article list
  - Query params: `page`, `limit`, `feed_id`, `sort`
- [ ] Create `packages/core/src/routes/pages/index.astro` — homepage
- [ ] Inject routes via the Astro integration
- [ ] Test: `test/routes/api/v1/articles.test.ts`
- [ ] Test: verify playground renders feed cards with seed data

#### Phase 4: Article Modal
- [ ] Create `packages/core/src/components/ArticleModal.astro`
  - Full sanitised article content display
  - Deep linking via `history.pushState` → `/article/[id]`
  - Next/Previous navigation relative to current list context
  - Close button and overlay dismiss
- [ ] Create `packages/core/src/utils/client/modal.ts`
  - `openArticleModal(articleId)` — fetch + render
  - `navigateArticle(direction)` — next/prev based on list context
  - URL state management (pushState/popState)
- [ ] Create `packages/core/src/routes/pages/article/[id].astro`
  - Server-side render for direct URL access / SEO
- [ ] Test: `test/utils/client/modal.test.ts` (JSDOM / Testing Library)

#### Phase 5: Infinite Scrolling
- [ ] Create `packages/core/src/utils/client/infinite-scroll.ts`
  - Intersection Observer for scroll-triggered loading
  - Cursor-based pagination (not offset — works with D1)
  - Loading states and end-of-list detection
- [ ] Test: `test/utils/client/infinite-scroll.test.ts`

#### Phase 6: Documentation for 0.2.0
- [ ] API reference: `GET /api/v1/articles` endpoint
- [ ] Guide: Feed synchronisation architecture
- [ ] Guide: Customising feed card appearance (CSS tokens)
- [ ] Update configuration docs with new sync-related options

#### Phase 7: Tests & Coverage for 0.2.0
- [ ] Integration test: full sync pipeline (FreshRSS → D1 → API → UI)
- [ ] Verify ≥80% coverage maintained
- [ ] Playground displays real articles from local FreshRSS

---

### Release 0.3.0 — Authentication, User System & Admin Feeds

**Goal:** Working auth system with magic-link sign-in, sign-up with
email pre-check, guest consent flow, account migration from guest to
registered user, user profile page (view + edit), formalized System
User concept, and admin feed management (bypassing domain verification).

#### Phase 1: System User Formalization & Database Updates
- [x] Formalize System User concept: seed `system` user during DB setup
  (not just lazily in `syncFeeds()`)
- [x] Add `role` column to `users` table (`'user' | 'admin' | 'system'`)
  to distinguish user types (additive migration)
- [x] Create seed helper `packages/core/src/db/seed.ts` — run after
  migrations to ensure System User exists
- [x] Update `ensureSystemUser()` to set `role: 'system'`
- [x] Run `npx drizzle-kit generate` for the migration
- [x] Test: `test/db/seed.test.ts`

#### Phase 2: better-auth Integration
- [x] Install `better-auth` and `@better-auth/client` in `packages/core`
- [x] Create `packages/core/src/utils/build/auth.ts`
- [x] Generate better-auth schema additions via CLI and merge into Drizzle schema
- [x] Create `packages/core/src/utils/build/email.ts`
- [x] Test: `test/utils/build/auth.test.ts`
- [x] Test: `test/utils/build/email.test.ts` (mocked SMTP)

#### Phase 3: Auth Routes & Guest Consent Flow
- [x] Create `packages/core/src/routes/api/auth/[...all].ts` — catch-all
- [x] Create guest utils (client + build)
- [x] Create `packages/core/src/components/ConsentModal.astro`
- [x] Test: `test/routes/api/auth/catch-all.test.ts`
- [x] Test: guest tests (client + build)
- [x] Test: `test/db/queries/users.test.ts`

#### Phase 4: Auth UI Components
- [x] Create `packages/core/src/components/AuthButton.astro`
- [x] Create `packages/core/src/components/MagicLinkForm.astro`
- [x] Create sign-in and verify pages
- [x] Update `BaseLayout.astro` with AuthButton
- [x] Inject auth routes via integration

#### Phase 5: Admin Feed Management
- [x] Create admin feed routes and utilities
- [x] Test: admin feed tests

#### Phase 6: Sign-Up Flow & Profile Page
- [ ] Add `pending_signups` table and `termsAcceptedAt` column to users
  - Database migration via `drizzle-kit generate`
- [ ] Create `GET /api/v1/auth/check-email` — returns whether email exists
- [ ] Create `POST /api/v1/auth/signup` — stores pending data, sends
  welcome magic link
- [ ] Create `packages/core/src/components/SignUpForm.astro`
  - Email (pre-filled, read-only), display name, terms checkbox
- [ ] Create `packages/core/src/routes/pages/auth/signup.astro`
- [ ] Update `MagicLinkForm.astro` — pre-check email, redirect to sign-up
  if not registered
- [ ] Update catch-all route — apply pending signup data after verification
  (set display name + terms consent, delete pending record)
- [ ] Update `sendMagicLinkEmail()` with welcome email template variant
- [ ] Create `packages/core/src/routes/pages/profile.astro` — view + edit
  name and bio
- [ ] Create `GET /api/v1/profile` and `PATCH /api/v1/profile` endpoints
- [ ] Update `AuthButton.astro` — show profile link for signed-in users
- [ ] Create placeholder `/terms` page
- [ ] Register new routes in `integration.ts`
- [ ] Test: `test/routes/api/v1/auth/check-email.test.ts`
- [ ] Test: `test/routes/api/v1/auth/signup.test.ts`
- [ ] Test: `test/routes/api/v1/profile.test.ts`
- [ ] Test: `test/db/queries/pending-signups.test.ts`

#### Phase 7: Documentation for 0.3.0
- [x] Guide: Authentication flow (magic link + guest consent)
- [x] API reference: auth endpoints
- [x] Guide: Configuring email provider (Resend setup)
- [x] Guide: Guest-to-registered migration flow
- [x] Guide: Admin feed management (adding feeds without verification)
- [x] Document System User concept and admin vs system feed ownership
- [ ] Update docs: sign-up flow and profile page

#### Phase 8: Tests & Coverage for 0.3.0
- [x] Integration test: full magic-link flow (request → email → verify → session)
- [x] Integration test: guest consent → interaction → registration → migration
- [x] Integration test: admin adds feed → feed appears in All Feeds
- [ ] Integration test: sign-up flow (pre-check → sign-up → verify → profile)
- [ ] Verify ≥80% coverage maintained
- [ ] Verify Mailpit catches magic link emails locally

---

### Release 0.4.0 — Interactions & Engagement

**Goal:** Hearts, Stars, Comments with moderation. Tabbed homepage
with My Feed, Trending, and Starred views.

#### Phase 1: Interaction API & Logic
- [ ] Create `packages/core/src/utils/shared/interactions.ts`
  - `toggleHeart(userId, articleId)` — idempotent toggle
  - `toggleStar(userId, articleId)` — idempotent toggle
  - Validation: prevent duplicate interactions per user
- [ ] Create `packages/core/src/db/queries/interactions.ts`
  - Heart/Star CRUD with composite key operations
  - Count queries for article-level aggregates
  - User interaction state queries (has user hearted/starred?)
- [ ] Create `packages/core/src/routes/api/v1/interactions.ts`
  - `POST /api/v1/interactions` — toggle heart or star
  - `GET /api/v1/interactions/:articleId` — get counts and user state
- [ ] Test: `test/utils/shared/interactions.test.ts`
- [ ] Test: `test/db/queries/interactions.test.ts`
- [ ] Test: `test/routes/api/v1/interactions.test.ts`

#### Phase 2: Comments & Moderation
- [ ] Create `packages/core/src/utils/build/comments.ts`
  - `submitComment(userId, articleId, content)` — creates pending comment
  - `moderateComment(commentId, action: 'approve' | 'reject')` — admin/author action
  - `generateModerationLinks(commentId)` — magic links for approve/reject
- [ ] Create `packages/core/src/db/queries/comments.ts`
  - Comment CRUD, status filtering, author notification queries
- [ ] Create `packages/core/src/routes/api/v1/comments.ts`
  - `POST /api/v1/comments` — submit comment (all tiers, based on config)
  - `GET /api/v1/comments/:articleId` — get approved comments
  - `POST /api/v1/comments/:id/moderate` — approve/reject (magic link endpoint)
- [ ] Wire comment submission to email notification:
  - Author receives email with Approve/Reject magic links
  - Magic links resolve without requiring login
- [ ] Test: `test/utils/build/comments.test.ts`
- [ ] Test: `test/db/queries/comments.test.ts`
- [ ] Test: `test/routes/api/v1/comments.test.ts`

#### Phase 3: Hearts/Stars/Comments UI
- [ ] Create `packages/core/src/utils/client/interactions.ts`
  - `handleHeart(articleId)` — optimistic UI toggle + API call
  - `handleStar(articleId)` — optimistic UI toggle + API call
  - Consent modal trigger for guests on first interaction
- [ ] Create `packages/core/src/components/HeartButton.astro`
- [ ] Create `packages/core/src/components/StarButton.astro`
- [ ] Create `packages/core/src/components/CommentSection.astro`
- [ ] Create `packages/core/src/components/CommentForm.astro`
- [ ] Update `FeedCard.astro` with heart/star counts and buttons
- [ ] Update `ArticleModal.astro` with comments section
- [ ] Test: `test/utils/client/interactions.test.ts` (Testing Library)

#### Phase 4: Tabbed Homepage Views
- [ ] Create `packages/core/src/utils/shared/scoring.ts`
  - `calculateTrendingScore(hearts, comments, stars, options)` — weighted score
  - Configurable weights and time window via `TrendingConfig`
- [ ] Create `packages/core/src/db/queries/trending.ts`
  - Trending articles query with configurable time window
- [ ] Create `packages/core/src/db/queries/following.ts`
  - Articles from followed feeds/authors
- [ ] Update `TabBar.astro` to activate all tabs:
  - **My Feed** — articles from followed feeds (requires auth)
  - **All Feeds** — chronological firehose (default for guests)
  - **Trending** — scored and ranked articles
  - **Starred** — user's bookmarked articles (requires auth)
- [ ] Create `packages/core/src/routes/api/v1/articles/following.ts`
  - `GET /api/v1/articles/following` — paginated following feed
- [ ] Create `packages/core/src/routes/api/v1/articles/trending.ts`
  - `GET /api/v1/articles/trending` — paginated trending feed
- [ ] Create `packages/core/src/routes/api/v1/articles/starred.ts`
  - `GET /api/v1/articles/starred` — paginated starred articles
- [ ] Test: `test/utils/shared/scoring.test.ts` (extensive — many weight combos)
- [ ] Test: `test/db/queries/trending.test.ts`
- [ ] Test: `test/db/queries/following.test.ts`

#### Phase 5: Admin Configuration
- [ ] Add to `CommunityRssOptions`:
  - `commentTier?: 'verified' | 'registered' | 'guest'` (default: `'registered'`)
  - `trending?: TrendingConfig` — weights and time window
- [ ] Enforce `commentTier` in comment submission route
- [ ] Test: `test/integration/admin-config.integration.test.ts`

#### Phase 6: Documentation for 0.4.0
- [ ] API reference: interactions, comments, trending endpoints
- [ ] Guide: Configuring comment permissions
- [ ] Guide: Customising trending algorithm weights
- [ ] Guide: Moderation workflow (author email flow)

#### Phase 6.5: Profile Page — Interaction History
- [ ] Update `/profile` page to display user's hearts, stars, and comments
- [ ] Create `GET /api/v1/profile/interactions` — paginated interaction history
- [ ] Test: `test/routes/api/v1/profile-interactions.test.ts`

#### Phase 7: Tests & Coverage for 0.4.0
- [ ] Integration test: heart → trending score update → trending tab
- [ ] Integration test: comment submit → email → magic link moderate
- [ ] Integration test: profile page shows interaction history
- [ ] Verify ≥80% coverage maintained

---

### Release 0.5.0 — Feed Submission & Author Profiles

**Goal:** Verified authors can submit and manage RSS feeds.
Author profile pages with follow functionality.

#### Phase 1: Feed Submission
- [ ] Create `packages/core/src/utils/build/feed-submission.ts`
  - `submitFeed(userId, feedUrl, category)` — validate URL, create pending feed
  - `validateFeedUrl(url)` — check URL resolves, returns valid RSS/Atom
  - `parseFeedMetadata(feedUrl)` — extract title, description, icon
- [ ] Create `packages/core/src/routes/api/v1/feeds.ts`
  - `POST /api/v1/feeds` — submit a feed (Verified Authors only)
  - `GET /api/v1/feeds` — list user's feeds
  - `DELETE /api/v1/feeds/:id` — remove feed (triggers cascading delete)
- [ ] Create `packages/core/src/components/FeedSubmitForm.astro`
- [ ] Test: `test/utils/build/feed-submission.test.ts`
- [ ] Test: `test/routes/api/v1/feeds.test.ts`

#### Phase 2: Domain Verification
- [ ] Create `packages/core/src/utils/build/verification.ts`
  - `generateVerificationCode(userId, domain)` — unique code per user+domain
  - `checkDomainVerification(domain, code)` — HTTP fetch to verify code presence
  - `markDomainVerified(userId, domain)` — update `verified_domains` table
  - Same-root-domain bypass for subsequent feeds
- [ ] Create `packages/core/src/routes/api/v1/verification.ts`
  - `POST /api/v1/verification/initiate` — start verification
  - `POST /api/v1/verification/check` — trigger verification check
  - `GET /api/v1/verification/status` — check verification status
- [ ] Create `packages/core/src/db/queries/verified-domains.ts`
- [ ] Create `packages/core/src/components/VerificationFlow.astro`
  - Step-by-step UI: show code, instruct placement, verify button
  - "Connected" badge on success
- [ ] Test: `test/utils/build/verification.test.ts` (MSW for HTTP fetch)
- [ ] Test: `test/db/queries/verified-domains.test.ts`

#### Phase 3: Author Profiles
- [ ] Create `packages/core/src/routes/pages/author/[username].astro`
  - Author avatar, bio, "Connected" badge
  - Filterable timeline of author's feed articles
  - Follow/Unfollow button
- [ ] Create `packages/core/src/routes/api/v1/authors.ts`
  - `GET /api/v1/authors/:username` — author profile data
  - `GET /api/v1/authors/:username/articles` — author's articles
- [ ] Create `packages/core/src/routes/api/v1/follow.ts`
  - `POST /api/v1/follow` — follow/unfollow an author
  - `GET /api/v1/follow/status/:authorId` — check follow state
- [ ] Create `packages/core/src/db/queries/followers.ts`
- [ ] Create `packages/core/src/components/AuthorCard.astro`
- [ ] Create `packages/core/src/components/FollowButton.astro`
- [ ] Test: `test/routes/api/v1/authors.test.ts`
- [ ] Test: `test/routes/api/v1/follow.test.ts`
- [ ] Test: `test/db/queries/followers.test.ts`

#### Phase 4: Feed Management & Cascading Deletion
- [ ] Create `packages/core/src/utils/build/feed-management.ts`
  - `removeFeed(feedId)` — orchestrates cascading deletion:
    1. Call FreshRSS API to unsubscribe
    2. Delete all comments for feed's articles from D1
    3. Delete all interactions for feed's articles from D1
    4. Delete all articles for feed from D1
    5. Delete feed record from D1
    6. Enqueue media cleanup job for R2
  - `enqueueFeedMediaCleanup(feedId)` — queue job for async image deletion
- [ ] Create `packages/core/src/utils/build/media-cleanup.ts`
  - Queue consumer: find and delete all R2 objects for a feed
- [ ] Add feed limit enforcement: `maxFeeds` from `CommunityRssOptions`
  - Default: 5 feeds per Verified Author
- [ ] Test: `test/utils/build/feed-management.test.ts` (mock FreshRSS + D1 + Queue)
- [ ] Test: verify cascading deletion removes all associated data

#### Phase 5: Legal Consent
- [ ] Create `packages/core/src/components/LegalConsent.astro`
  - Checkbox confirming domain ownership and display rights consent
  - Required before feed submission completes
- [ ] Store consent timestamp in `feeds` table

#### Phase 5.5: Profile Enhancements
- [ ] Profile page: email change with re-verification flow
  - `PATCH /api/v1/profile` with `email` field triggers verification email
  - New email only takes effect after verification
- [ ] Profile page: avatar upload via R2
  - `POST /api/v1/profile/avatar` — upload image to R2, update `avatar_url`
- [ ] Profile page: manage submitted feeds (list, remove)
- [ ] Test: email re-verification flow
- [ ] Test: avatar upload + display

#### Phase 6: Documentation for 0.5.0
- [ ] Guide: Feed submission and verification flow
- [ ] API reference: feeds, verification, authors, follow endpoints
- [ ] Guide: Configuring feed limits
- [ ] Guide: Author profile customisation

#### Phase 7: Tests & Coverage for 0.5.0
- [ ] Integration test: submit feed → verify domain → feed appears in All Feeds
- [ ] Integration test: delete feed → cascading cleanup verified
- [ ] Verify ≥80% coverage maintained

---

### Release 0.6.0 — Media Caching & Production Polish

**Goal:** Image caching pipeline, admin configuration, theme system,
and production deployment readiness.

#### Phase 1: Image Caching Pipeline

Articles are published immediately with original external image URLs
(set during 0.2.0 sync). The image caching pipeline runs asynchronously
in the background, rewriting URLs only after successful download.
If downloads fail, articles remain readable with external images.

- [ ] Create `packages/core/src/utils/build/image-cache.ts`
  - `extractImages(html)` — Cheerio-based `<img>` tag extraction
  - `downloadImage(url)` — fetch external image with timeout + 3 retries
  - `uploadToStorage(imageBuffer, key, env)` — upload to R2/S3
  - `rewriteImageUrls(html, urlMap)` — replace external URLs with media domain
- [ ] Integrate into article processing queue consumer:
  - For each article with `media_pending = true`:
    1. Extract external image URLs from `content`
    2. Download and upload each image to R2
    3. On success: `UPDATE articles SET content = rewritten_html,
       media_pending = false WHERE id = X`
    4. On partial failure: rewrite only successful images, keep
       `media_pending = true` for retry
  - **Fallback:** If an image download fails after 3 retries, the original
    external `src` URL is preserved. The article is never blocked.
- [ ] Create periodic retry job (Cron-triggered):
  - Queries articles where `media_pending = true`
  - Re-enqueues them for image processing
  - Configurable retry window (default: every 6 hours)
- [ ] Create `packages/core/src/db/queries/media.ts`
  - Track cached media: original URL → R2 key mapping (`media_cache` table)
  - Query articles with `media_pending = true`
  - Support bulk deletion for feed cleanup
- [ ] Add to `CommunityRssOptions`:
  - `mediaBaseUrl?: string` — the custom media subdomain
    (e.g., `https://media.community.com`)
  - `enableImageCaching?: boolean` — default `true`
- [ ] Test: `test/utils/build/image-cache.test.ts` (MSW + mock R2)
  - Test successful caching + URL rewrite
  - Test partial failure: some images cached, others retain original URLs
  - Test total failure: article retains all original URLs, `media_pending` stays true
- [ ] Test: `test/db/queries/media.test.ts`

#### Phase 2: Theme System
- [ ] Create `packages/core/src/utils/build/theme.ts`
  - `generateThemeStylesheet(themeConfig)` — compile consumer config to CSS
  - `mergeThemeDefaults(themeConfig)` — deep merge with framework defaults
- [ ] Add to `CommunityRssOptions`:
  - `theme?: ThemeConfig` — colour overrides, font families, spacing scales
- [ ] Create `ThemeConfig` interface with full design token mapping
- [ ] Test: `test/utils/build/theme.test.ts`

#### Phase 3: Admin Configuration Routes
- [ ] Create `packages/core/src/routes/api/v1/admin/config.ts`
  - `GET /api/v1/admin/config` — current instance configuration
  - `PATCH /api/v1/admin/config` — update runtime config (comment tier,
    trending weights, feed limits)
- [ ] Admin routes protected by role check (Admin user tier)
- [ ] Test: `test/routes/api/v1/admin/config.test.ts`

#### Phase 4: Production Deployment Guide
- [ ] Documentation: step-by-step Cloudflare Pages deployment
  - Wrangler configuration for production
  - D1 database creation and migration
  - R2 bucket setup
  - Queue bindings
  - Environment variables
  - Custom domain setup
- [ ] Documentation: Cloudflare Zero Trust setup for FreshRSS
- [ ] Documentation: Resend email configuration
- [ ] Documentation: monitoring and logging

#### Phase 5: Performance & Polish
- [ ] HTTP caching headers on static assets and API responses
- [ ] Rate limiting on interaction and auth endpoints
- [ ] Error boundary components
- [ ] Loading skeleton components
- [ ] Meta tags and Open Graph for shared article links
- [ ] Accessibility audit (WCAG 2.1 AA)

#### Phase 6: Tests & Coverage for 0.6.0
- [ ] Integration test: article sync → image extraction → R2 upload → rewritten HTML
- [ ] Integration test: theme config → generated CSS → rendered components
- [ ] Performance test: image caching pipeline with 50+ images
- [ ] Verify ≥80% coverage across entire codebase
- [ ] Full playground smoke test with all features enabled

---

## Testing Strategy (Cross-Release)

### Test Organisation

```
packages/core/test/
├── fixtures/
│   ├── articles.ts          # Mock article data
│   ├── feeds.ts             # Mock feed data
│   ├── users.ts             # Mock user data (guest + registered + author)
│   ├── interactions.ts      # Mock heart/star/comment data
│   ├── freshrss-responses.ts # Mock FreshRSS API payloads
│   └── html-content.ts      # Sample RSS HTML for sanitisation tests
├── utils/
│   ├── build/
│   │   ├── freshrss-client.test.ts
│   │   ├── sync.test.ts
│   │   ├── article-processor.test.ts
│   │   ├── auth.test.ts
│   │   ├── email.test.ts
│   │   ├── guest.test.ts
│   │   ├── comments.test.ts
│   │   ├── feed-submission.test.ts
│   │   ├── verification.test.ts
│   │   ├── feed-management.test.ts
│   │   ├── image-cache.test.ts
│   │   └── theme.test.ts
│   ├── client/
│   │   ├── modal.test.ts
│   │   ├── infinite-scroll.test.ts
│   │   ├── guest.test.ts
│   │   └── interactions.test.ts
│   └── shared/
│       ├── scoring.test.ts
│       └── interactions.test.ts
├── db/
│   └── queries/
│       ├── articles.test.ts
│       ├── feeds.test.ts
│       ├── users.test.ts
│       ├── interactions.test.ts
│       ├── comments.test.ts
│       ├── followers.test.ts
│       ├── trending.test.ts
│       ├── verified-domains.test.ts
│       └── media.test.ts
├── routes/
│   └── api/v1/
│       ├── articles.test.ts
│       ├── auth/
│       │   └── catch-all.test.ts
│       ├── interactions.test.ts
│       ├── comments.test.ts
│       ├── feeds.test.ts
│       ├── verification.test.ts
│       ├── authors.test.ts
│       ├── follow.test.ts
│       └── admin/config.test.ts
└── integration/
    ├── sync-pipeline.integration.test.ts
    ├── auth-flow.integration.test.ts
    ├── guest-migration.integration.test.ts
    ├── interaction-flow.integration.test.ts
    ├── comment-moderation.integration.test.ts
    ├── feed-lifecycle.integration.test.ts
    ├── image-caching.integration.test.ts
    ├── admin-config.integration.test.ts
    └── trending-scoring.integration.test.ts
```

### Testing Principles

| Principle | Implementation |
|-----------|---------------|
| Unit tests use fixtures only | Import from `@fixtures/`, never hit real services |
| D1 tests use Miniflare pool | `@cloudflare/vitest-pool-workers` provides real local D1 |
| HTTP calls mocked via MSW | FreshRSS, Resend, external image fetches |
| Suite-level data loading | `beforeAll` for read-only suites, transactions for mutations |
| Integration tests separated | Suffix `.integration.test.ts`, explicit timeouts |
| Coverage enforced in CI | Vitest config: 80% minimum on statements, branches, functions, lines |
| Client tests via Testing Library | `@testing-library/dom` for Heart/Star button tests |

### Vitest Configuration (Root)

```typescript
// vitest.config.ts (root — workspace mode)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    workspace: ['packages/core/vitest.config.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

---

## Documentation Strategy (Cross-Release)

### Starlight Site Structure

```
docs/src/content/docs/
├── index.mdx                         # Landing page
├── getting-started/
│   ├── installation.md               # npm install, astro.config.mjs setup
│   ├── configuration.md              # CommunityRssOptions API table
│   ├── local-development.md          # Docker Compose + Dev Container
│   └── first-deployment.md           # Cloudflare Pages deployment
├── api-reference/
│   ├── integration.md                # communityRss() factory
│   ├── options.md                    # Full options table with @since
│   ├── routes.md                     # All /api/v1/ endpoints
│   ├── workers.md                    # scheduled() and queue() exports
│   └── css-tokens.md                 # Design token reference
├── guides/
│   ├── feed-sync.md                  # FreshRSS sync architecture
│   ├── authentication.md             # Magic link + guest flow
│   ├── interactions.md               # Hearts, Stars, Comments
│   ├── moderation.md                 # Comment moderation workflow
│   ├── feed-submission.md            # Submit + verify feeds
│   ├── trending.md                   # Trending algorithm config
│   ├── image-caching.md              # Media pipeline
│   ├── theming.md                    # CSS token override guide
│   └── email-setup.md               # Resend + Mailpit
├── contributing/
│   ├── setup.md                      # Dev environment setup
│   ├── architecture.md               # Monorepo structure, contexts
│   ├── testing.md                    # Test writing guide
│   ├── coding-standards.md           # Import aliases, component rules
│   └── release-process.md           # SemVer, branching, publishing
└── reference/
    └── database-schema.md            # Full D1 schema reference
```

### Documentation Build Commands

| Command | Effect |
|---------|--------|
| `cd docs && npm run dev` | Local preview on `http://localhost:4322` |
| `cd docs && npm run build` | Produces `docs/dist/` with static HTML |
| Copy `docs/dist/` anywhere | Deployable to any static hosting |

### TypeDoc Integration

TypeDoc runs as a pre-build step to generate Markdown API docs from
JSDoc in `packages/core/index.ts`. Output is placed in
`docs/src/content/docs/api-reference/generated/` and Starlight renders it
alongside hand-written guides.

---

## `.github` Instructions Updates Required

### 1. Update `copilot-instructions.md`

| Section | Change |
|---------|--------|
| **Stack** | Add: `better-auth` (authentication), `Drizzle ORM` (D1 access), `Starlight` (docs) |
| **Monorepo Awareness** | Add `docs/` as a third workspace: "Documentation site lives in `docs/`" |
| **Architecture** | Add: "Database schema is defined in Drizzle ORM TypeScript (`src/db/schema.ts`). Migrations are generated via `drizzle-kit generate` — never hand-written." |
| **Architecture** | Add: "Authentication uses better-auth configured in `src/utils/build/auth.ts`" |
| **Imports** | Add alias: `@layouts/*` → `src/layouts/*` (already in implementation.instructions.md but missing from copilot-instructions) |
| **Anti-Patterns** | Add: "❌ Import from `docs/` in packages/core or playground — docs is independent" |
| **Anti-Patterns** | Add: "❌ Use raw SQL strings — use Drizzle ORM query builders in `src/db/`" |
| **Anti-Patterns** | Add: "❌ Hand-write SQL migration files — always generate via `drizzle-kit generate`" |

### 2. Update `instructions/implementation.instructions.md`

| Section | Change |
|---------|--------|
| **Cloudflare Bindings** | Add: "Authentication via `better-auth` — never implement custom session logic" |
| **Database** | Add: "Use Drizzle ORM for all D1 queries. SQL migration files are generated by `drizzle-kit generate` — never hand-written. The Drizzle TypeScript schema (`src/db/schema.ts`) is the single source of truth." |
| **New section: Auth** | Add rules for better-auth integration patterns (guard middleware, session access, `baseURL` must equal `PUBLIC_SITE_URL`) |

### 3. Update `instructions/documentation.instructions.md`

| Section | Change |
|---------|--------|
| **Documentation Types** | Add: "4. **Starlight Docs Site** — The `docs/` workspace contains the published documentation" |
| **New section: Starlight** | Add rules: docs live in `docs/src/content/docs/`, Markdown/MDX format, frontmatter requirements |
| **Build/Deploy** | Add: "`npm run build` in `docs/` produces standalone static HTML in `docs/dist/`" |

### 4. Update `instructions/testing.instructions.md`

| Section | Change |
|---------|--------|
| **D1 Database Testing** | Update: "Use `@cloudflare/vitest-pool-workers` instead of manual Miniflare setup" |
| **Cloudflare bindings** | Add: "better-auth sessions can be mocked via `vi.mock('better-auth')`" |

### 5. Update `instructions/api-design.instructions.md`

| Section | Change |
|---------|--------|
| **Auth Routes** | Add: "Auth routes handled by better-auth's native router via a single catch-all at `/api/auth/[...all]`. Framework business routes use `/api/v1/*`. Never create manual auth endpoint wrappers." |
| **Database Layer** | Add: "Public API that touches D1 must use Drizzle ORM — never expose raw SQL" |

### 6. New file: `instructions/documentation-site.instructions.md`

Create a new instruction file for the Starlight docs workspace:

```
---
applyTo: "docs/**/*"
---
```

- Starlight content lives in `docs/src/content/docs/`
- Frontmatter: `title`, `description`, `sidebar` fields
- No H1 in body (Starlight generates from title)
- Code examples show `@community-rss/core` imports
- API tables include `Since` column
- Cross-reference other docs via relative Markdown links
- Build: `npm run build` → `docs/dist/` (static HTML)
- Never import from `packages/core/src/` — reference published API only

### 7. Update `workflows/ci.yml`

| Change |
|--------|
| Add docs build step: `npm run build --workspace=docs` |
| Add lint step for docs workspace |
| Consider adding a docs link-checker step |

### 8. Update `pull_request_template.md`

| Section | Change |
|---------|--------|
| **Quality Checklist** | Add: "- [ ] Drizzle ORM used for database queries (no raw SQL outside generated migrations)" |
| **Quality Checklist** | Add: "- [ ] better-auth patterns followed for auth logic" |
| **Documentation** | Add: "- [ ] Starlight docs updated if user-facing feature" |

---

## Dependency Summary

### Root `devDependencies`

```json
{
  "eslint": "^9.0.0",
  "@typescript-eslint/eslint-plugin": "^8.0.0",
  "@typescript-eslint/parser": "^8.0.0",
  "eslint-plugin-astro": "^1.0.0",
  "prettier": "^3.0.0",
  "prettier-plugin-astro": "^0.14.0",
  "vitest": "^3.0.0",
  "typescript": "^5.6.0",
  "typedoc": "^0.27.0",
  "typedoc-plugin-markdown": "^4.0.0"
}
```

### `packages/core` Dependencies

```json
{
  "dependencies": {
    "better-auth": "^1.0.0",
    "@better-auth/client": "^1.0.0",
    "drizzle-orm": "^0.38.0",
    "sanitize-html": "^2.14.0",
    "cheerio": "^1.0.0",
    "@aws-sdk/client-s3": "^3.700.0",
    "resend": "^4.0.0"
  },
  "devDependencies": {
    "astro": "^5.0.0",
    "@cloudflare/vitest-pool-workers": "^0.8.0",
    "@cloudflare/workers-types": "^4.0.0",
    "drizzle-kit": "^0.30.0",
    "msw": "^2.7.0",
    "@testing-library/dom": "^10.0.0",
    "wrangler": "^4.0.0"
  }
}
```

### `playground` Dependencies

```json
{
  "dependencies": {
    "astro": "^5.0.0",
    "@community-rss/core": "*",
    "@astrojs/cloudflare": "^12.0.0"
  }
}
```

### `docs` Dependencies

```json
{
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/starlight": "^0.33.0"
  }
}
```

---

## Implementation Order & Milestones

| Release | Core Deliverable | Key Milestone |
|---------|-----------------|---------------|
| **0.1.0** | Foundation & Scaffold | `npm run dev` starts playground + docs; CI green; D1 schema applied |
| **0.2.0** | Feed Sync & Reader | Articles sync from FreshRSS and display in a grid on the homepage |
| **0.3.0** | Auth, Users & Admin Feeds | Users can sign in via magic link; guests get shadow profiles; admin can add feeds |
| **0.4.0** | Interactions | Hearts, Stars, Comments work; Trending and Following tabs active |
| **0.5.0** | Feed Submission | Authors can submit, verify, and manage their own feeds |
| **0.6.0** | Media & Polish | Image caching pipeline; production deployment guide; theme system |

Each release follows the branching model defined in the release prompt:
1. Create `release-X_Y_Z` branch from `main`
2. Feature branches squash-merge into release branch
3. Feature plans live in `feature_plans/X_Y_Z/{feature}/`
4. Version bump and CHANGELOG happen only at release finalization
5. Release branch squash-merges into `main`

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| better-auth D1 adapter edge cases | Auth failures | Integration tests with real Miniflare D1; fallback to raw Drizzle queries if adapter has issues |
| Cloudflare adapter ignores custom worker exports | Cron + Queue handlers not registered | Validate `__scheduled` endpoint in playground during 0.1.0; configure adapter entrypoint or use integration-level injection |
| better-auth `baseURL` misconfiguration in Docker | Silent auth failures (cookies/magic links break) | Enforce `baseURL: process.env.PUBLIC_SITE_URL` in auth config; document in setup guide; integration test validates cookie domain |
| FreshRSS API undocumented pagination limits | Incomplete sync | MSW tests with paginated responses; defensive polling loop with max-page guard |
| Duplicate articles from repeated Cron sync | Data corruption, inflated counts | `freshrss_item_id` UNIQUE index + idempotent upsert; integration test syncs same data twice and verifies single row |
| `import.meta.url` route resolution diverges between dev and production | Injected routes 404 in production Cloudflare build but work in Vite dev | Test production build (`npm run build && npm run preview`) in 0.2.0 when real API routes are injected; adjust path resolution if Vite/Rollup treats workspace symlinks differently from real `node_modules` |
| Package `exports` map wildcard doesn't capture `.astro` extensions | Consumers get "Package subpath not defined" errors importing components | Verify exports map resolves `.astro` extensions in 0.4.0 when components ship; consider explicit entries if wildcards fail |
| D1 `INSERT ... ON CONFLICT` with composite primary keys | Idempotent upsert SQL rejected by D1's custom SQLite parser | Test `INSERT ... ON CONFLICT (user_id, article_id) DO NOTHING` against local Miniflare in 0.4.0 before shipping `toggleHeart` |
| Monorepo test scripts only cover `packages/core` | E2E or docs-build tests have no root-level runner | Current `cd packages/core && npx vitest` works for now; may need `turbo`, `wireit`, or workspace-aware scripts if testing requirements expand to playground E2E (Playwright) or docs build validation |
| Stale `.astro/` cache breaks content discovery and type generation | "Content not found" errors, missing types, phantom build failures | Run `npm run clean` (or `rm -rf .astro`) before deep debugging; known quirk of Astro 5's Content Layer API |
| Image download failures (timeouts, 404s, anti-bot) | Broken images in articles | Articles published immediately with original URLs; `media_pending` flag + periodic retry job; partial success rewrites only successful images |
| R2 cold-start latency in image caching | Slow article processing | Queue-based async processing; article renders before images are cached |
| Drizzle schema drift from hand-written SQL | Schema mismatch between code and DB | Drizzle-first workflow: TypeScript schema is source of truth, migrations always generated via `drizzle-kit generate`, never hand-written |
| Drizzle ORM version conflicts with better-auth | Build failures | Pin compatible versions; test upgrades in CI before merging |
| CSS custom property browser support | Older browser breakage | Provide fallback values in token definitions; document minimum browser versions |
| Guest UUID cookie cleared on sign-out leaves orphaned shadow profile | Wasted DB rows | Periodic cleanup job for guest profiles with no interactions older than N days (future optimisation) |
| Offset-based pagination with active syncing | Duplicate items shown to users when new articles shift offsets between page requests | Migrate to cursor-based pagination (`WHERE published_at < ?`) before 0.4.0 — natively optimised in D1/SQLite. Flagged as high-priority tech debt from 0.2.0 review |
| Cloudflare Pages cron/queue in production | Local dev workaround (inline sync) risks breaching 30s HTTP timeout if used in production with large feeds | Before 0.6.0, deploy to a real CF Pages Preview environment to verify `scheduled` and `queue` handlers work. Do not migrate to raw Workers — keep Astro's static asset hosting |
| Admin sync endpoint used in production accidentally | 30-second Cloudflare HTTP request timeout breach with large feed syncs (500+ articles) | Mark admin sync endpoint as dev-only; add warnings in response headers and documentation |
| System/admin feed ownership ambiguity | UI confusion when 0.5.0 introduces user-submitted feeds alongside system feeds | 0.5.0 must distinguish "Global/System Feeds" (system user), "Admin Feeds" (admin user), and "Personal Feeds" (verified author) in the UI and API |

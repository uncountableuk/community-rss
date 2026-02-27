# Community RSS Framework — Full Project Plan

*Revised Roadmap: 0.1.0 → 0.7.0*

> **Master Requirements Document:**
> [`feature_plans/0_0_1/Community-RSS-Framework-Spec.md`](../0_0_1/Community-RSS-Framework-Spec.md)
> is the single source of truth for *what* to build.
> This plan describes *how* and *when* to implement it.
> If there is any conflict, the spec takes precedence.

> **Revision History:**
> - **v2 (0.4.0):** Major architecture change — Cloudflare → Docker/VPS;
>   "injected routes" → "integration with overrides". Releases 0.4.0–0.6.0
>   pushed back to 0.5.0–0.7.0. See
>   [`feature_plans/0_4_0/IMPACT_ASSESSMENT.md`](0_4_0/IMPACT_ASSESSMENT.md).

## Tooling Decisions

### Testing Stack

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **Vitest** | Unit & integration test runner | Fast, native ESM, Vite-aligned. |
| **vitest/coverage-v8** | Code coverage | Native V8 coverage — fast, accurate, enforces ≥80% thresholds in CI. |
| **MSW (Mock Service Worker)** | HTTP mocking (FreshRSS API, Resend) | Intercepts outgoing HTTP at the network level. Avoids coupling tests to implementation details. |
| **@testing-library/dom** | Client-side DOM interaction tests | Lightweight, accessible-first queries for testing Hearts/Stars/Comments UI. |
| **better-sqlite3 (in-memory)** | Database testing | Real SQLite engine for accurate query testing without file I/O. |

### Documentation Stack

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **Starlight** (Astro) | Documentation site | Markdown/MDX authoring. Full-text search built-in. Ships as static HTML. Runs as a third workspace (`docs/`) in the monorepo. |
| **TypeDoc** | API reference generation | Auto-generates API docs from JSDoc/TSDoc in `packages/core/`. |

### Code Quality Stack

| Tool | Purpose |
|------|---------|
| **ESLint 9** (flat config) | Linting with `@typescript-eslint`, `eslint-plugin-astro` |
| **Prettier** | Formatting with `prettier-plugin-astro` |
| **TypeScript 5.x** | Strict mode, path alias support via `tsconfig.json` `paths` |

### Infrastructure Stack

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **Astro SSR + @astrojs/node** | Application server | Standard Node.js server behind reverse proxy. Universal deployment — any VPS, any Docker host. |
| **SQLite (better-sqlite3)** | Primary database | Zero configuration, file-based, WAL mode for concurrent reads. Managed via Drizzle ORM. |
| **Drizzle ORM** | Database layer | Type-safe SQL with zero runtime overhead. Supports both D1 (legacy) and better-sqlite3. |
| **MinIO / S3-compatible** | Object storage | Image/media caching. S3 API via `@aws-sdk/client-s3`. MinIO in Docker for dev and production. |
| **FreshRSS** | RSS ingestion engine | Background feed polling. Accessed via GReader API from the sync scheduler. |
| **node-cron** | Task scheduling | In-process cron for feed sync. Simple, no Redis dependency. |
| **Docker Compose** | Deployment | Single `docker-compose up` for full stack (app + FreshRSS + MinIO + Mailpit). |
| **better-auth** | Authentication | Magic-link plugin, Drizzle adapter for SQLite, session management. |
| **Resend / Mailpit** | Transactional email | Resend for production; Mailpit in Docker for development. |

### Additional Dependencies

| Package | Purpose | Context |
|---------|---------|---------|
| **sanitize-html** | HTML sanitisation for RSS article content | Server-side (build context). |
| **cheerio** | HTML parsing for image extraction (media caching) | Server-side (build context). |
| **resend** | Transactional email (production) | Production email provider. |
| **@aws-sdk/client-s3** | S3-compatible object storage (MinIO) | Media caching pipeline. |
| **better-sqlite3** | SQLite database driver | Primary database driver for Node.js. |
| **node-cron** | Cron job scheduling | Feed sync scheduling. |

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
   $ cp playground/.env.example playground/.env
   → Fill in FreshRSS password from step 5a

7. Apply database schema (from container)
   $ cd playground
   $ npx drizzle-kit push    # applies schema to local SQLite

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

### Docker Compose Services

```yaml
services:
  app:        # Node.js 22 dev container
  freshrss:   # RSS ingestion engine
  minio:      # S3-compatible object storage
  mailpit:    # Local email catcher
```

### Dev Container Configuration

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

## Monorepo Directory Structure (Target — Post-0.4.0)

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
├── docker-compose.yml              # Dev stack
├── docker-compose.prod.yml         # Production stack
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
│       ├── drizzle.config.ts       # Drizzle-kit config (better-sqlite3)
│       └── src/
│           ├── integration.ts      # Astro integration factory
│           ├── middleware.ts        # Injects AppContext into locals
│           ├── cli/
│           │   ├── init.ts         # npx @community-rss/core init
│           │   └── templates/      # Scaffold templates (pages, emails, config)
│           ├── templates/
│           │   └── email/          # Default email HTML templates
│           ├── types/
│           │   ├── context.ts      # AppContext, EnvironmentVariables
│           │   ├── env.d.ts        # DEPRECATED — alias for context types
│           │   ├── options.ts      # CommunityRssOptions interface
│           │   ├── models.ts       # Domain model interfaces
│           │   └── email.ts        # Email system interfaces
│           ├── db/
│           │   ├── connection.ts   # SQLite connection factory
│           │   ├── schema.ts       # Drizzle ORM schema (single source of truth)
│           │   ├── seed.ts         # System User seeder
│           │   ├── migrations/     # Auto-generated by drizzle-kit
│           │   └── queries/        # Query modules (users, feeds, articles, etc.)
│           ├── utils/
│           │   ├── build/          # Node.js context (server-side)
│           │   │   ├── scheduler.ts      # node-cron scheduler
│           │   │   ├── sync.ts           # Feed sync (inline processing)
│           │   │   ├── freshrss-client.ts # FreshRSS GReader API client
│           │   │   ├── article-processor.ts # HTML sanitisation
│           │   │   ├── auth.ts           # better-auth config (SQLite)
│           │   │   ├── guest.ts          # Server-side guest management
│           │   │   ├── admin-feeds.ts    # Admin feed submission
│           │   │   ├── email.ts          # Email facade
│           │   │   ├── email-service.ts  # Email service factory
│           │   │   ├── email-renderer.ts # File-based template renderer
│           │   │   ├── email-templates.ts # Code-based template fallbacks
│           │   │   └── email-transports.ts # Resend + SMTP adapters
│           │   ├── client/         # Browser context
│           │   │   ├── guest.ts
│           │   │   ├── modal.ts
│           │   │   └── infinite-scroll.ts
│           │   └── shared/         # Pure functions
│           ├── components/         # Astro components (exported for consumer use)
│           ├── layouts/            # Astro layouts (exported for consumer use)
│           ├── routes/             # Injected API routes ONLY (no pages)
│           │   └── api/
│           │       ├── auth/[...all].ts
│           │       ├── dev/seed.ts
│           │       └── v1/
│           └── styles/
│               └── tokens.css      # CSS design tokens
│       └── test/
│           ├── fixtures/
│           ├── utils/
│           ├── db/
│           ├── routes/
│           ├── cli/
│           ├── integration/
│           └── middleware.test.ts
│
├── playground/
│   ├── package.json
│   ├── astro.config.mjs            # @astrojs/node + communityRss()
│   ├── .env.example
│   ├── Dockerfile                  # Multi-stage production build
│   └── src/
│       ├── pages/                  # Developer-owned pages (scaffolded)
│       │   ├── index.astro
│       │   ├── article/[id].astro
│       │   ├── auth/
│       │   ├── profile.astro
│       │   └── terms.astro
│       ├── email-templates/        # Developer-owned email templates
│       │   ├── sign-in.html
│       │   ├── welcome.html
│       │   └── email-change.html
│       └── styles/
│           └── theme.css           # CSS overrides
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

### Release 0.1.0 — Foundation & Scaffold ✅ COMPLETE

**Goal:** Working monorepo with integration skeleton, database schema,
design token system, testing infrastructure, and documentation site.

**Status:** Complete. 102 tests passing. Playground builds.

See [0.1.0 Implementation Plan](0_1_0/IMPLEMENTATION_PLAN.md).

---

### Release 0.2.0 — Feed Sync & Reader Core ✅ COMPLETE

**Goal:** Working feed synchronisation from FreshRSS to D1, with a
browsable homepage showing articles in a masonry grid layout.

**Status:** Complete. 104 tests passing. 88.84% statement coverage.

See [0.2.0 Implementation Plan](0_2_0/IMPLEMENTATION_PLAN.md).

---

### Release 0.3.0 — Authentication, User System & Admin Feeds ✅ COMPLETE

**Goal:** Working auth system with magic-link sign-in/sign-up, guest consent
flow, user profiles, email service architecture, and admin feed management.

**Status:** Complete. 309 tests passing. 86.35% statement coverage.

See [0.3.0 Implementation Plan](0_3_0/IMPLEMENTATION_PLAN.md).

---

### Release 0.4.0 — Architecture Migration (NEW)

**Goal:** Migrate from Cloudflare-specific infrastructure to self-hosted
Docker/VPS stack. Transform developer model from "injected routes" to
"integration with overrides" — package provides API routes and components,
developers own pages and email templates.

**Key Milestone:** `docker-compose up` starts full stack; developer runs
`npx @community-rss/core init` to scaffold pages; all existing tests pass;
≥80% coverage maintained; no Cloudflare-specific code remains.

**Impact Assessment:** See
[`feature_plans/0_4_0/IMPACT_ASSESSMENT.md`](0_4_0/IMPACT_ASSESSMENT.md).

#### Phase 1: Database Layer Migration
- [ ] Install `better-sqlite3` and types in `packages/core`
- [ ] Create `src/db/connection.ts` — SQLite connection factory (WAL mode, singleton)
- [ ] Update `drizzle.config.ts` — switch to `better-sqlite3` driver
- [ ] Update all `src/db/queries/*.ts` — change DB parameter types
- [ ] Update `src/db/seed.ts` — change DB parameter type
- [ ] Test: `test/db/connection.test.ts`
- [ ] Migrate all DB query tests to in-memory SQLite

#### Phase 2: Runtime Context & Middleware
- [ ] Create `src/types/context.ts` — `AppContext` and `EnvironmentVariables`
- [ ] Deprecate `src/types/env.d.ts` — add `@deprecated`, keep as alias
- [ ] Create `src/middleware.ts` — reads `process.env`, creates DB, sets `locals.app`
- [ ] Update `src/types/options.ts` — add `databasePath`, `syncSchedule`, `emailTemplateDir`
- [ ] Update `src/integration.ts` — remove page injections, add middleware, add scheduler hooks
- [ ] Update every API route handler — `context.locals.app` instead of `context.locals.runtime.env`
- [ ] Test: `test/middleware.test.ts`
- [ ] Update integration factory test (19 → 11 injected routes)
- [ ] Update all route handler tests

#### Phase 3: Background Processing Migration
- [ ] Install `node-cron` and types in `packages/core`
- [ ] Create `src/utils/build/scheduler.ts` — cron registration, start/stop lifecycle
- [ ] Update `src/utils/build/sync.ts` — inline article processing, remove queue enqueue
- [ ] Update `src/routes/api/v1/admin/sync.ts` — remove inline queue workaround
- [ ] Remove `src/workers/` directory
- [ ] Remove `playground/src/worker.ts` and `playground/wrangler.toml`
- [ ] Update `index.ts` — remove `scheduled`/`queue`, add `startScheduler`/`stopScheduler`
- [ ] Test: `test/utils/build/scheduler.test.ts`
- [ ] Update sync tests, remove worker tests

#### Phase 4: Auth & Email Migration
- [ ] Update `src/utils/build/auth.ts` — Drizzle SQLite instead of D1
- [ ] Create `src/templates/email/*.html` — default email templates
- [ ] Create `src/utils/build/email-renderer.ts` — file-based rendering
- [ ] Update `src/utils/build/email-service.ts` — file-based resolution
- [ ] Test: `test/utils/build/email-renderer.test.ts`

#### Phase 5: Component Architecture Upgrade
- [ ] Update `BaseLayout.astro` — named slots: header, footer, head
- [ ] Update form components — configurable messages/labels props
- [ ] Update interaction components — configurable labels props
- [ ] Verify all components importable from `@community-rss/core/components/*`

#### Phase 6: CLI Scaffold Command
- [ ] Create `src/cli/init.ts` — scaffold pages, templates, config, docker-compose
- [ ] Create all scaffold template files in `src/cli/templates/`
- [ ] Add `bin` field to `package.json`
- [ ] Test: `test/cli/init.test.ts`

#### Phase 7: Playground Migration
- [ ] Switch adapter to `@astrojs/node`
- [ ] Scaffold pages and email templates
- [ ] Delete wrangler.toml and worker.ts
- [ ] Verify dev server and production build work

#### Phase 8: Docker Compose & Production Deployment
- [ ] Update `docker-compose.yml` with SQLite volume
- [ ] Create `docker-compose.prod.yml` for production
- [ ] Create `playground/Dockerfile` (reference implementation)

#### Phase 9: Test Migration
- [ ] Migrate all DB tests (D1 → SQLite)
- [ ] Migrate all route tests (Env → AppContext)
- [ ] Migrate worker tests → scheduler tests
- [ ] Verify all 309+ tests pass
- [ ] Verify ≥80% coverage on all metrics

#### Phase 10: `.github` Instructions Rewrite
- [ ] Rewrite `copilot-instructions.md` — remove Cloudflare, add Docker/VPS/overrides
- [ ] Rewrite `instructions/implementation.instructions.md` — AppContext, composition
- [ ] Rewrite `instructions/api-design.instructions.md` — CLI, page/API split
- [ ] Rewrite `instructions/testing.instructions.md` — SQLite, AppContext mocks
- [ ] Update remaining instruction files

#### Phase 11: Documentation Rewrite
- [ ] Rewrite getting-started: install + init + docker-compose
- [ ] Rewrite configuration: .env + astro.config.mjs
- [ ] Create deployment guide: VPS + Docker Compose + reverse proxy
- [ ] Create customisation guide: pages, components, emails, themes
- [ ] Create CLI reference page
- [ ] Update all existing guides for new architecture

#### Phase 12: Final Verification & Coverage
- [ ] All tests pass; ≥80% coverage
- [ ] End-to-end: sign-in, sync, articles, profile, email change
- [ ] `npx @community-rss/core init` produces working project
- [ ] `docker-compose up` starts full stack
- [ ] No Cloudflare-specific code remains in packages/core

---

### Release 0.5.0 — Interactions & Engagement

> **Previously 0.4.0** — pushed back due to architecture migration.

**Goal:** Hearts, Stars, Comments with moderation. Tabbed homepage
with My Feed, Trending, and Starred views.

#### Phase 1: Interaction API & Logic
- [ ] Create `packages/core/src/utils/shared/interactions.ts`
  - `toggleHeart(userId, articleId)` — idempotent toggle
  - `toggleStar(userId, articleId)` — idempotent toggle
- [ ] Create `packages/core/src/db/queries/interactions.ts`
  - Heart/Star CRUD with composite key operations
  - Count queries for article-level aggregates
- [ ] Create `packages/core/src/routes/api/v1/interactions.ts`
  - `POST /api/v1/interactions` — toggle heart or star
  - `GET /api/v1/interactions/:articleId` — get counts and user state
- [ ] Test: interaction util, DB query, and route handler tests

#### Phase 2: Comments & Moderation
- [ ] Create `packages/core/src/utils/build/comments.ts`
  - `submitComment()`, `moderateComment()`, `generateModerationLinks()`
- [ ] Create `packages/core/src/db/queries/comments.ts`
- [ ] Create `packages/core/src/routes/api/v1/comments.ts`
  - `POST /api/v1/comments` — submit comment
  - `GET /api/v1/comments/:articleId` — get approved comments
  - `POST /api/v1/comments/:id/moderate` — approve/reject
- [ ] Wire comment submission to email notification
- [ ] Add comment moderation email template (`.html` file)
- [ ] Test: comment util, DB query, and route handler tests

#### Phase 3: Hearts/Stars/Comments UI
- [ ] Create `packages/core/src/utils/client/interactions.ts`
  - `handleHeart()`, `handleStar()` — optimistic UI + API call
- [ ] Create `HeartButton.astro`, `StarButton.astro`, `CommentSection.astro`,
  `CommentForm.astro` components with configurable props
- [ ] Update `FeedCard.astro` with heart/star counts
- [ ] Update `ArticleModal.astro` with comments section
- [ ] Update CLI scaffold templates to include new components
- [ ] Test: client interaction tests

#### Phase 4: Tabbed Homepage Views
- [ ] Create `packages/core/src/utils/shared/scoring.ts` — trending score
- [ ] Create `packages/core/src/db/queries/trending.ts`, `following.ts`
- [ ] Create articles API variants: `/following`, `/trending`, `/starred`
- [ ] Update `TabBar.astro` to activate all tabs
- [ ] Update CLI scaffold homepage template to include all tabs
- [ ] Test: scoring, trending, following tests

#### Phase 5: Admin Configuration
- [ ] Add `trending` config to `CommunityRssOptions`
- [ ] Enforce `commentTier` in comment submission route
- [ ] Test: admin config integration tests

#### Phase 6: Documentation for 0.5.0
- [ ] API reference: interactions, comments, trending endpoints
- [ ] Guide: Configuring comment permissions
- [ ] Guide: Customising trending algorithm weights
- [ ] Guide: Moderation workflow (author email flow)

#### Phase 7: Tests & Coverage for 0.5.0
- [ ] Integration tests: heart → trending, comment → email → moderate
- [ ] Verify ≥80% coverage maintained

---

### Release 0.6.0 — Feed Submission & Author Profiles

> **Previously 0.5.0** — pushed back due to architecture migration.

**Goal:** Verified authors can submit and manage RSS feeds.
Author profile pages with follow functionality.

#### Phase 1: Feed Submission
- [ ] Create `src/utils/build/feed-submission.ts`
  - `submitFeed()`, `validateFeedUrl()`, `parseFeedMetadata()`
- [ ] Create `src/routes/api/v1/feeds.ts` — CRUD
- [ ] Create `FeedSubmitForm.astro` component
- [ ] Update CLI scaffold with feed submission page template
- [ ] Test: feed submission tests

#### Phase 2: Domain Verification
- [ ] Create `src/utils/build/verification.ts`
  - `generateVerificationCode()`, `checkDomainVerification()`, `markDomainVerified()`
- [ ] Create `src/routes/api/v1/verification.ts` — initiate/check/status
- [ ] Create `src/db/queries/verified-domains.ts`
- [ ] Create `VerificationFlow.astro` component
- [ ] Test: verification tests

#### Phase 3: Author Profiles
- [ ] Create author profile API routes
- [ ] Create `AuthorCard.astro`, `FollowButton.astro` components
- [ ] Create `src/routes/api/v1/follow.ts`
- [ ] Update CLI scaffold with author profile page template
- [ ] Test: author and follow tests

#### Phase 4: Feed Management & Cascading Deletion
- [ ] Create `src/utils/build/feed-management.ts` — cascading delete
- [ ] Feed limit enforcement via `maxFeeds` option
- [ ] Media cleanup job for S3 (MinIO) objects
- [ ] Test: cascading deletion tests

#### Phase 5: Legal Consent
- [ ] Create `LegalConsent.astro` component
- [ ] Test: consent tests

#### Phase 6: Documentation for 0.6.0
- [ ] Guide: Feed submission and verification flow
- [ ] API reference: feeds, verification, authors, follow endpoints

#### Phase 7: Tests & Coverage for 0.6.0
- [ ] Integration tests: submit → verify → publish, delete → cascade
- [ ] Verify ≥80% coverage maintained

---

### Release 0.7.0 — Media Caching & Production Polish

> **Previously 0.6.0** — pushed back due to architecture migration.

**Goal:** Image caching pipeline, theme system, and production
deployment polish.

#### Phase 1: Image Caching Pipeline
- [ ] Create `src/utils/build/image-cache.ts`
  - `extractImages()` — Cheerio-based `<img>` extraction
  - `downloadImage()` — fetch with retry
  - `uploadToStorage()` — upload to S3 (MinIO)
  - `rewriteImageUrls()` — replace external URLs with media domain
- [ ] Integrate into sync pipeline (process images inline after articles)
- [ ] Create periodic retry job via node-cron
- [ ] Create `src/db/queries/media.ts` — media cache tracking
- [ ] Add `mediaBaseUrl`, `enableImageCaching` to options
- [ ] Test: image cache tests (MSW + mock S3)

#### Phase 2: Theme System
- [ ] Create `src/utils/build/theme.ts`
  - `generateThemeStylesheet()`, `mergeThemeDefaults()`
- [ ] Add `ThemeConfig` to `CommunityRssOptions`
- [ ] Test: theme tests

#### Phase 3: Production Polish
- [ ] HTTP caching headers on static assets and API responses
- [ ] Rate limiting on interaction and auth endpoints
- [ ] Error boundary components
- [ ] Loading skeleton components
- [ ] Meta tags and Open Graph for shared article links
- [ ] Accessibility audit (WCAG 2.1 AA)

#### Phase 4: Documentation for 0.7.0
- [ ] Guide: Image caching pipeline
- [ ] Guide: Advanced theming
- [ ] Guide: Production hardening (rate limiting, caching, monitoring)
- [ ] Guide: Backup and restore (SQLite + MinIO data)

#### Phase 5: Tests & Coverage for 0.7.0
- [ ] Integration tests: sync → image cache → S3 → rewritten HTML
- [ ] Performance test: image caching with 50+ images
- [ ] Verify ≥80% coverage across entire codebase
- [ ] Full end-to-end smoke test with all features

---

## Testing Strategy (Cross-Release)

### Test Organisation

```
packages/core/test/
├── fixtures/
│   ├── articles.ts          # Mock article data
│   ├── feeds.ts             # Mock feed data
│   ├── users.ts             # Mock user data
│   ├── context.ts           # Mock AppContext factory
│   ├── interactions.ts      # Mock heart/star/comment data
│   ├── freshrss-responses.ts # Mock FreshRSS API payloads
│   ├── html-content.ts      # Sample RSS HTML for sanitisation tests
│   └── email.ts             # Email template fixtures
├── utils/
│   ├── build/
│   │   ├── freshrss-client.test.ts
│   │   ├── sync.test.ts
│   │   ├── article-processor.test.ts
│   │   ├── scheduler.test.ts
│   │   ├── auth.test.ts
│   │   ├── email.test.ts
│   │   ├── email-renderer.test.ts
│   │   ├── email-service.test.ts
│   │   ├── email-templates.test.ts
│   │   ├── email-transports.test.ts
│   │   ├── guest.test.ts
│   │   ├── admin-feeds.test.ts
│   │   ├── comments.test.ts           # 0.5.0
│   │   ├── feed-submission.test.ts    # 0.6.0
│   │   ├── verification.test.ts       # 0.6.0
│   │   ├── feed-management.test.ts    # 0.6.0
│   │   ├── image-cache.test.ts        # 0.7.0
│   │   └── theme.test.ts             # 0.7.0
│   ├── client/
│   │   ├── modal.test.ts
│   │   ├── infinite-scroll.test.ts
│   │   ├── guest.test.ts
│   │   └── interactions.test.ts       # 0.5.0
│   └── shared/
│       ├── scoring.test.ts            # 0.5.0
│       └── interactions.test.ts       # 0.5.0
├── db/
│   ├── connection.test.ts
│   ├── seed.test.ts
│   └── queries/
│       ├── articles.test.ts
│       ├── feeds.test.ts
│       ├── users.test.ts
│       ├── pending-signups.test.ts
│       ├── interactions.test.ts       # 0.5.0
│       ├── comments.test.ts           # 0.5.0
│       ├── followers.test.ts          # 0.6.0
│       ├── verified-domains.test.ts   # 0.6.0
│       ├── trending.test.ts           # 0.5.0
│       └── media.test.ts             # 0.7.0
├── routes/
│   └── api/
│       ├── auth/catch-all.test.ts
│       └── v1/
│           ├── articles.test.ts
│           ├── auth/
│           │   ├── check-email.test.ts
│           │   └── signup.test.ts
│           ├── profile.test.ts
│           ├── profile/
│           │   ├── change-email.test.ts
│           │   └── confirm-email-change.test.ts
│           ├── interactions.test.ts       # 0.5.0
│           ├── comments.test.ts           # 0.5.0
│           ├── feeds.test.ts              # 0.6.0
│           ├── verification.test.ts       # 0.6.0
│           ├── authors.test.ts            # 0.6.0
│           ├── follow.test.ts             # 0.6.0
│           └── admin/
│               ├── feeds.test.ts
│               └── config.test.ts         # 0.5.0
├── cli/
│   └── init.test.ts
├── middleware.test.ts
└── integration/
    ├── integration-factory.test.ts
    ├── sync-pipeline.integration.test.ts
    ├── auth-flow.integration.test.ts
    ├── guest-migration.integration.test.ts
    ├── interaction-flow.integration.test.ts       # 0.5.0
    ├── comment-moderation.integration.test.ts     # 0.5.0
    ├── feed-lifecycle.integration.test.ts         # 0.6.0
    ├── image-caching.integration.test.ts          # 0.7.0
    └── trending-scoring.integration.test.ts       # 0.5.0
```

### Testing Principles

| Principle | Implementation |
|-----------|---------------|
| Unit tests use fixtures only | Import from `@fixtures/`, never hit real services |
| DB tests use in-memory SQLite | `better-sqlite3` in-memory mode (`:memory:`) |
| HTTP calls mocked via MSW | FreshRSS, Resend, external image fetches |
| Suite-level data loading | `beforeAll` for read-only suites, transactions for mutations |
| Integration tests separated | Suffix `.integration.test.ts`, explicit timeouts |
| Coverage enforced in CI | Vitest config: 80% minimum on statements, branches, functions, lines |
| Client tests via Testing Library | `@testing-library/dom` for Heart/Star button tests |
| Route tests mock AppContext | Standard mock factory in `@fixtures/context` |

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

### Starlight Site Structure (Post-0.4.0)

```
docs/src/content/docs/
├── index.mdx                         # Landing page
├── getting-started/
│   ├── installation.md               # npm install + npx init
│   ├── configuration.md              # .env + astro.config.mjs options
│   ├── local-development.md          # Docker Compose dev setup
│   └── deployment.md                 # Docker Compose on VPS
├── api-reference/
│   ├── integration.md                # communityRss() factory
│   ├── options.md                    # Full options table with @since
│   ├── routes.md                     # All /api/v1/ endpoints (injected)
│   ├── cli.md                        # npx @community-rss/core init
│   ├── components.md                 # Exported components reference
│   └── css-tokens.md                 # Design token reference
├── guides/
│   ├── customisation.md              # Pages, components, emails, themes
│   ├── feed-sync.md                  # node-cron sync architecture
│   ├── authentication.md             # Magic link + guest flow
│   ├── email-setup.md               # Templates + Mailpit/Resend
│   ├── interactions.md               # Hearts, Stars, Comments (0.5.0)
│   ├── moderation.md                 # Comment moderation (0.5.0)
│   ├── feed-submission.md            # Submit + verify feeds (0.6.0)
│   ├── trending.md                   # Trending algorithm config (0.5.0)
│   ├── image-caching.md              # Media pipeline (0.7.0)
│   └── theming.md                    # CSS token override guide
├── contributing/
│   ├── setup.md                      # Dev environment (Docker, no Wrangler)
│   ├── architecture.md               # AppContext, composition, overrides
│   ├── testing.md                    # SQLite, mock patterns
│   ├── coding-standards.md           # Import aliases, component rules
│   └── release-process.md           # SemVer, branching, publishing
└── reference/
    └── database-schema.md            # Full SQLite schema reference
```

---

## Implementation Order & Milestones

| Release | Core Deliverable | Key Milestone |
|---------|-----------------|---------------|
| **0.1.0** ✅ | Foundation & Scaffold | Monorepo, integration skeleton, schema, docs |
| **0.2.0** ✅ | Feed Sync & Reader | Articles sync from FreshRSS, display in grid |
| **0.3.0** ✅ | Auth, Users & Admin Feeds | Magic link, guest consent, profiles, admin feeds |
| **0.4.0** 🔄 | **Architecture Migration** | Docker/VPS, integration-with-overrides, CLI scaffold |
| **0.5.0** | Interactions & Engagement | Hearts, Stars, Comments, Trending, Following |
| **0.6.0** | Feed Submission & Author Profiles | Domain verification, author pages, follow |
| **0.7.0** | Media Caching & Production Polish | Image pipeline, themes, accessibility, hardening |

Each release follows the branching model:
1. Create `release-X_Y_Z` branch from `main`
2. Feature branches squash-merge into release branch
3. Feature plans live in `feature_plans/X_Y_Z/`
4. Version bump and CHANGELOG happen only at release finalization
5. Release branch squash-merges into `main`

---

## Architecture & Implementation Notes

These lessons and patterns were discovered during implementation and guide
future phases.

### Integration-with-Overrides Pattern (0.4.0+)

**Principle:** The package provides API routes (injected via Astro integration)
and components (imported by developer's pages). Developers own all pages and
email templates — they are scaffolded once and never overwritten by updates.

**Route split:**
- `/api/*` — Injected by the integration from `node_modules`. Updates
  automatically when the developer runs `npm update`.
- `/` (and all other page routes) — Lives in the developer's `src/pages/`.
  Created by `npx @community-rss/core init`. Never modified by package updates.

**Component composition:**
- Components use named slots and configurable props for customisation
- `BaseLayout.astro` has `header`, `footer`, `head` named slots
- Form components accept `messages` and `errorMessages` props
- All visual values use CSS custom properties (`--crss-*`)

### AppContext Pattern (replacing Cloudflare Env)

The `AppContext` interface provides runtime context to route handlers via
`context.locals.app`:

```typescript
interface AppContext {
  db: BetterSQLite3Database;    // Drizzle ORM instance
  config: ResolvedCommunityRssOptions;
  env: EnvironmentVariables;     // process.env values
}
```

Middleware creates the context once per request. Database connections are
reused (module-level singleton). Environment variables are validated on
server startup.

### Config Propagation Across Build/Runtime Boundaries

**Pattern:** Astro integration options are build-time only. For runtime
access, use `process.env` or middleware-injected `context.locals.app.config`.

**Email config priority:** (1) code-based `emailConfig.templates` function,
(2) file-based template from developer's template directory, (3) package
default HTML template.

### HTTP Redirect Handling with Session Cookies

**Pattern:** Use `redirect: 'follow'` for auth flows. `redirect: 'manual'`
loses Set-Cookie headers from intermediate responses.

### Email Transport Graceful Degradation

**Pattern:** Different transports have different failure semantics:
- **Resend (production):** Throws on error
- **SMTP (development):** Warns but doesn't throw

### SQLite Best Practices

- Enable WAL mode for concurrent read performance
- Use a single long-lived connection (module-level singleton)
- Create parent directories before opening database file
- Close connection on graceful shutdown
- For high-traffic sites, recommend read replicas (Litestream)

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| SQLite WAL mode concurrent write contention | Database locked errors under heavy write load | Use single-writer pattern; document limitation; recommend Litestream for read replicas |
| better-sqlite3 compatibility with Astro's Node adapter | Build or runtime errors | Verify in CI; better-auth explicitly supports better-sqlite3 |
| node-cron timezone issues in Docker containers | Sync runs at wrong times | Use UTC explicitly; document timezone config |
| CLI scaffold creating files in wrong directory | Developer confusion, broken project | Detect project root via package.json; extensive tests; clear error messages |
| Email template file resolution across package boundaries | Templates not found at runtime | Test resolution chain; clear fallback to package defaults; helpful errors |
| In-process queue job loss on server restart | Missed article processing | Acceptable — next cron run re-syncs all feeds; document limitation |
| FreshRSS API undocumented pagination limits | Incomplete sync | MSW tests with paginated responses; max-page guard |
| better-auth `baseURL` misconfiguration | Silent auth failures | Validate on startup; middleware checks `PUBLIC_SITE_URL` presence |
| SQLite file permissions in Docker volumes | Database inaccessible | Document volume mount; test with non-root user |
| Stale `.astro/` cache breaks content discovery | Build failures | Run `npm run clean` before debugging |
| CSS custom property browser support | Older browser breakage | Provide fallback values; document minimum versions |
| Guest UUID cookie cleared on sign-out | Orphaned shadow profiles | Periodic cleanup job (future optimisation) |
| Breaking change to `Env` type in public API | Consumer TypeScript errors | Deprecated gradually; kept as alias for one release |
| CLI scaffold file conflicts | Overwritten developer customisations | Skip existing files by default; `--force` flag opt-in |

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
    "better-sqlite3": "^11.0.0",
    "drizzle-orm": "^0.38.0",
    "sanitize-html": "^2.14.0",
    "cheerio": "^1.0.0",
    "@aws-sdk/client-s3": "^3.700.0",
    "resend": "^4.0.0",
    "node-cron": "^3.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.0.0",
    "@types/node-cron": "^3.0.0",
    "@types/sanitize-html": "^2.16.0",
    "astro": "^5.0.0",
    "drizzle-kit": "^0.30.0",
    "jsdom": "^28.0.0",
    "msw": "^2.7.0"
  }
}
```

### `playground` Dependencies

```json
{
  "dependencies": {
    "astro": "^5.0.0",
    "@community-rss/core": "*",
    "@astrojs/node": "^9.0.0"
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

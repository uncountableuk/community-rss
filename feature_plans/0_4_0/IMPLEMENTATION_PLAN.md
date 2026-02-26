# Release 0.4.0 — Architecture Migration: Implementation Plan

## Overview

**Goal:** Migrate from Cloudflare-specific infrastructure to a self-hosted
Docker/VPS stack, and transform the developer model from "injected routes"
to "integration with overrides" — where the package provides API routes,
components, and utilities while developers own their pages and email templates.

**Key Milestone:** `docker-compose up` starts a fully functional community
site; developer runs `npx @community-rss/core init` to scaffold pages;
all existing tests pass (migrated); ≥80% coverage maintained.

**Spec Reference:** Cross-cutting — affects Sections 5.1 (NPM Package),
5.2 (Infrastructure), 5.3 (Sync Flow), 5.6 (Route Injection), 7 (DX)
of the [Framework Spec](../0_0_1/Community-RSS-Framework-Spec.md).

**Impact Assessment:** See [IMPACT_ASSESSMENT.md](./IMPACT_ASSESSMENT.md).

---

## Codebase Review

### Files to Remove

| File | Reason |
|------|--------|
| `packages/core/src/workers/scheduled.ts` | Replaced by `utils/build/scheduler.ts` |
| `packages/core/src/workers/queue.ts` | Queue removed; processing inline |
| `packages/core/src/workers/index.ts` | Workers barrel no longer needed |
| `packages/core/test/workers/` (all files) | Replaced by scheduler tests |
| `playground/wrangler.toml` | No longer using Wrangler |
| `playground/src/worker.ts` | No longer exporting Workers handlers |
| `playground/.dev.vars` | Replaced by `.env` |
| `playground/.dev.vars.example` | Replaced by `.env.example` |

### Files to Create

#### Core Package — Infrastructure
| File | Purpose |
|------|---------|
| `packages/core/src/db/connection.ts` | SQLite connection factory (better-sqlite3 + Drizzle) |
| `packages/core/src/types/context.ts` | `AppContext` interface replacing `Env` |
| `packages/core/src/middleware.ts` | Astro middleware: creates AppContext, sets `locals.app` |
| `packages/core/src/utils/build/scheduler.ts` | node-cron scheduler: start, stop, register sync job |

#### Core Package — CLI Scaffold
| File | Purpose |
|------|---------|
| `packages/core/src/cli/init.ts` | CLI entry point: `npx @community-rss/core init` |
| `packages/core/src/cli/templates/pages/index.astro` | Scaffold: homepage |
| `packages/core/src/cli/templates/pages/article/[id].astro` | Scaffold: article detail |
| `packages/core/src/cli/templates/pages/auth/signin.astro` | Scaffold: sign-in |
| `packages/core/src/cli/templates/pages/auth/signup.astro` | Scaffold: sign-up |
| `packages/core/src/cli/templates/pages/auth/verify.astro` | Scaffold: magic link landing |
| `packages/core/src/cli/templates/pages/auth/verify-email-change.astro` | Scaffold: email change verify |
| `packages/core/src/cli/templates/pages/profile.astro` | Scaffold: profile page |
| `packages/core/src/cli/templates/pages/terms.astro` | Scaffold: terms of service |
| `packages/core/src/cli/templates/email-templates/sign-in.html` | Default sign-in email |
| `packages/core/src/cli/templates/email-templates/welcome.html` | Default welcome email |
| `packages/core/src/cli/templates/email-templates/email-change.html` | Default email change email |
| `packages/core/src/cli/templates/astro.config.mjs` | Pre-configured Astro config |
| `packages/core/src/cli/templates/env.example` | Environment variable template |
| `packages/core/src/cli/templates/docker-compose.yml` | Production Docker Compose |
| `packages/core/src/cli/templates/theme.css` | CSS custom property overrides |

#### Core Package — Email Templates
| File | Purpose |
|------|---------|
| `packages/core/src/templates/email/sign-in.html` | Default sign-in email template |
| `packages/core/src/templates/email/welcome.html` | Default welcome email template |
| `packages/core/src/templates/email/email-change.html` | Default email change template |
| `packages/core/src/utils/build/email-renderer.ts` | File-based template renderer |

#### Deployment
| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Production Docker Compose override |
| `playground/Dockerfile` | Multi-stage build for production Node.js app |

#### Tests
| File | Purpose |
|------|---------|
| `packages/core/test/db/connection.test.ts` | SQLite connection factory tests |
| `packages/core/test/utils/build/scheduler.test.ts` | Scheduler lifecycle tests |
| `packages/core/test/utils/build/email-renderer.test.ts` | Template rendering tests |
| `packages/core/test/cli/init.test.ts` | CLI scaffold tests |
| `packages/core/test/middleware.test.ts` | Middleware context injection tests |

### Files to Modify (Full List)

#### Types
| File | Change |
|------|--------|
| `src/types/env.d.ts` | Remove D1/R2/Queue types; add standard env var types |
| `src/types/options.ts` | Add `database`, `scheduler`, `templateDir` options |
| `src/types/models.ts` | No changes expected |
| `src/types/email.ts` | Add file-based template types |

#### Database & Queries
| File | Change |
|------|--------|
| `src/db/schema.ts` | No changes (dialect-agnostic) |
| `src/db/seed.ts` | Change DB parameter type |
| `src/db/queries/users.ts` | Change DB parameter type |
| `src/db/queries/feeds.ts` | Change DB parameter type |
| `src/db/queries/articles.ts` | Change DB parameter type |
| `src/db/queries/pending-signups.ts` | Change DB parameter type |
| `drizzle.config.ts` | Switch driver to better-sqlite3 |

#### Integration & Middleware
| File | Change |
|------|--------|
| `src/integration.ts` | Remove page injections; add middleware; add scheduler hooks |
| `index.ts` | Remove worker exports; add CLI, scheduler, AppContext exports |

#### Utils — Build
| File | Change |
|------|--------|
| `src/utils/build/sync.ts` | Process articles inline; remove queue enqueue |
| `src/utils/build/article-processor.ts` | Change DB parameter type |
| `src/utils/build/auth.ts` | Change DB creation from D1 to Drizzle SQLite |
| `src/utils/build/freshrss-client.ts` | Remove CF Zero Trust header defaults (keep as optional) |
| `src/utils/build/guest.ts` | Change DB parameter type |
| `src/utils/build/admin-feeds.ts` | Change DB parameter type |
| `src/utils/build/email.ts` | Use email-renderer for file-based templates |
| `src/utils/build/email-service.ts` | Add file-based template resolution |
| `src/utils/build/email-templates.ts` | Keep as code-based fallback; add file-based adapter |
| `src/utils/build/email-transports.ts` | No changes expected |

#### Utils — Client
| File | Change |
|------|--------|
| `src/utils/client/guest.ts` | No changes (browser-only; no Cloudflare deps) |
| `src/utils/client/modal.ts` | No changes |
| `src/utils/client/infinite-scroll.ts` | No changes |

#### Routes — API
| File | Change |
|------|--------|
| `src/routes/api/v1/health.ts` | Change env access to `context.locals.app` |
| `src/routes/api/v1/articles.ts` | Change env access to `context.locals.app` |
| `src/routes/api/v1/admin/sync.ts` | Change env access; remove inline queue workaround |
| `src/routes/api/v1/admin/feeds.ts` | Change env access to `context.locals.app` |
| `src/routes/api/auth/[...all].ts` | Change env access; update auth creation |
| `src/routes/api/v1/auth/check-email.ts` | Change env access |
| `src/routes/api/v1/auth/signup.ts` | Change env access |
| `src/routes/api/v1/profile.ts` | Change env access |
| `src/routes/api/v1/profile/change-email.ts` | Change env access |
| `src/routes/api/v1/profile/confirm-email-change.ts` | Change env access |
| `src/routes/api/dev/seed.ts` | Change env access |

#### Routes — Pages (moved to scaffold templates)
| File | Action |
|------|--------|
| `src/routes/pages/index.astro` | Move to CLI scaffold template |
| `src/routes/pages/article/[id].astro` | Move to CLI scaffold template |
| `src/routes/pages/auth/signin.astro` | Move to CLI scaffold template |
| `src/routes/pages/auth/signup.astro` | Move to CLI scaffold template |
| `src/routes/pages/auth/verify.astro` | Move to CLI scaffold template |
| `src/routes/pages/auth/verify-email-change.astro` | Move to CLI scaffold template |
| `src/routes/pages/profile.astro` | Move to CLI scaffold template |
| `src/routes/pages/terms.astro` | Move to CLI scaffold template |

#### Components
| File | Change |
|------|--------|
| `src/components/FeedCard.astro` | Add configurable props for messages/labels |
| `src/components/FeedGrid.astro` | No changes expected |
| `src/components/TabBar.astro` | No changes expected |
| `src/components/ArticleModal.astro` | Add configurable props |
| `src/components/AuthButton.astro` | Add configurable props for labels |
| `src/components/MagicLinkForm.astro` | Add configurable messages prop |
| `src/components/SignUpForm.astro` | Add configurable messages/errorMessages props |
| `src/components/ConsentModal.astro` | Add configurable messages prop |

#### Layouts
| File | Change |
|------|--------|
| `src/layouts/BaseLayout.astro` | Add named slots (header, footer); make composable |

#### Playground
| File | Change |
|------|--------|
| `playground/astro.config.mjs` | Switch to `@astrojs/node`; remove Cloudflare config |
| `playground/package.json` | Replace `@astrojs/cloudflare` with `@astrojs/node` |
| `playground/src/pages/` | Create scaffolded pages (from CLI template or manually) |

### Dependencies

#### New (`packages/core`)
| Package | Type | Purpose |
|---------|------|---------|
| `better-sqlite3` | dependency | SQLite driver for Node.js |
| `@types/better-sqlite3` | devDependency | TypeScript types |
| `node-cron` | dependency | Cron job scheduling |
| `@types/node-cron` | devDependency | TypeScript types |

#### Removed (`packages/core`)
| Package | Reason |
|---------|--------|
| `@cloudflare/workers-types` | No longer targeting Cloudflare |
| `wrangler` | No longer deploying to Cloudflare |

#### Changed (`playground`)
| Before | After |
|--------|-------|
| `@astrojs/cloudflare` ^12.0.0 | `@astrojs/node` ^9.0.0 |

### Existing Utilities to Reuse
| Utility | Location | Reuse In |
|---------|----------|----------|
| `resolveOptions()` | `types/options.ts` | Extended with new options |
| `FreshRssClient` | `utils/build/freshrss-client.ts` | Unchanged (HTTP-based) |
| `processArticle()` | `utils/build/article-processor.ts` | Called inline from sync |
| `upsertArticle()` | `db/queries/articles.ts` | Parameter type change only |
| `createEmailService()` | `utils/build/email-service.ts` | Extended with file renderer |
| `emailLayout()`, templates | `utils/build/email-templates.ts` | Kept as code-based fallback |

---

## Architecture & API Design

### New Types

```typescript
// packages/core/src/types/context.ts

/**
 * Runtime context available to all route handlers via `context.locals.app`.
 * Replaces the Cloudflare `Env` interface.
 * @since 0.4.0
 */
export interface AppContext {
  /** Drizzle ORM database instance (SQLite). @since 0.4.0 */
  db: BetterSQLite3Database;
  /** Resolved framework configuration. @since 0.4.0 */
  config: ResolvedCommunityRssOptions;
  /** Environment variables. @since 0.4.0 */
  env: EnvironmentVariables;
}

/**
 * Standard environment variables (replaces Cloudflare bindings).
 * @since 0.4.0
 */
export interface EnvironmentVariables {
  DATABASE_PATH: string;
  FRESHRSS_URL: string;
  FRESHRSS_USER: string;
  FRESHRSS_API_PASSWORD: string;
  PUBLIC_SITE_URL: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_FROM: string;
  S3_ENDPOINT: string;
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
  S3_BUCKET: string;
  MEDIA_BASE_URL: string;
  RESEND_API_KEY?: string;
  EMAIL_TRANSPORT?: string;
  [key: string]: string | undefined;
}
```

### Updated CommunityRssOptions

```typescript
export interface CommunityRssOptions {
  // Existing (unchanged)
  maxFeeds?: number;
  commentTier?: 'verified' | 'registered' | 'guest';
  email?: EmailConfig;

  // New for 0.4.0
  /** Path to SQLite database file. @default './data/community.db' @since 0.4.0 */
  databasePath?: string;

  /**
   * Cron expression for feed sync schedule.
   * @default '*/30 * * * *' (every 30 minutes)
   * @since 0.4.0
   */
  syncSchedule?: string;

  /**
   * Directory containing email template overrides.
   * Relative to the project root.
   * @default './src/email-templates'
   * @since 0.4.0
   */
  emailTemplateDir?: string;
}
```

### Updated EmailConfig

```typescript
export interface EmailConfig {
  // Existing (unchanged)
  from?: string;
  appName?: string;
  transport?: 'smtp' | 'resend' | EmailTransport;
  templates?: Partial<EmailTemplateMap>;  // Code-based overrides (unchanged)

  /**
   * Directory containing HTML email template files.
   * @default './src/email-templates'
   * @since 0.4.0
   */
  templateDir?: string;
}
```

### Updated Public API (`index.ts`)

```typescript
// Default export (unchanged)
export default function communityRss(options?: CommunityRssOptions): AstroIntegration;

// Type exports
export type { CommunityRssOptions, EmailConfig } from './src/types/options';
export type { AppContext, EnvironmentVariables } from './src/types/context';
export type { /* all existing model types */ } from './src/types/models';
export type { /* all existing email types */ } from './src/types/email';

// DEPRECATED — will be removed in next major
export type { Env } from './src/types/env';

// Email exports (unchanged)
export { signInTemplate, welcomeTemplate, emailChangeTemplate, /* ... */ } from './src/utils/build/email-templates';
export { createResendTransport, createSmtpTransport } from './src/utils/build/email-transports';
export { createEmailService } from './src/utils/build/email-service';
export { renderEmailTemplate } from './src/utils/build/email-renderer';

// Database exports (new)
export { createDatabase } from './src/db/connection';
export { seedDatabase } from './src/db/seed';

// Scheduler exports (new, replacing worker exports)
export { startScheduler, stopScheduler } from './src/utils/build/scheduler';

// REMOVED (breaking — acceptable pre-1.0.0)
// export { scheduled } from './src/workers/scheduled';
// export { queue } from './src/workers/queue';
```

### Updated Integration Route Injection

**API routes (injected — developer cannot see these in their project):**

| Method | Path | Stays Injected | Notes |
|--------|------|----------------|-------|
| ALL | `/api/auth/[...all]` | ✅ | better-auth catch-all |
| GET | `/api/v1/health` | ✅ | Health check |
| GET | `/api/v1/articles` | ✅ | Article listing |
| POST | `/api/v1/admin/sync` | ✅ | Manual sync trigger |
| ALL | `/api/v1/admin/feeds` | ✅ | Admin feed CRUD |
| GET | `/api/v1/auth/check-email` | ✅ | Email pre-check |
| POST | `/api/v1/auth/signup` | ✅ | Registration |
| ALL | `/api/v1/profile` | ✅ | Profile CRUD |
| POST | `/api/v1/profile/change-email` | ✅ | Email change request |
| GET | `/api/v1/profile/confirm-email-change` | ✅ | Email change confirm |
| GET | `/api/dev/seed` | ✅ | Dev-only DB seed |

**Page routes (moved to scaffold — developer owns these):**

| Path | Previously Injected | Now Scaffolded |
|------|--------------------|----|
| `/` | ✅ | Moved to `src/pages/index.astro` |
| `/article/[id]` | ✅ | Moved to `src/pages/article/[id].astro` |
| `/auth/signin` | ✅ | Moved to `src/pages/auth/signin.astro` |
| `/auth/signup` | ✅ | Moved to `src/pages/auth/signup.astro` |
| `/auth/verify` | ✅ | Moved to `src/pages/auth/verify.astro` |
| `/auth/verify-email-change` | ✅ | Moved to `src/pages/auth/verify-email-change.astro` |
| `/profile` | ✅ | Moved to `src/pages/profile.astro` |
| `/terms` | ✅ | Moved to `src/pages/terms.astro` |

### Error Contracts (New)

```typescript
'TEMPLATE_NOT_FOUND'   // Email template file not found in project or package
'DATABASE_ERROR'       // SQLite connection or query failure
'SCHEDULER_ERROR'      // Cron job registration or execution failure
```

---

## Phase 1: Database Layer Migration

**Objective:** Replace D1 with better-sqlite3 while keeping Drizzle ORM
as the query builder. All DB query tests must pass.

- [x] Install `better-sqlite3` and `@types/better-sqlite3` in `packages/core`
- [x] Create `packages/core/src/db/connection.ts`
  - `createDatabase(path: string): BetterSQLite3Database` — connection factory
  - Enables WAL mode for concurrent read performance
  - Creates parent directories if database path doesn't exist
  - Singleton pattern for connection reuse
  - `closeDatabase()` — cleanup for graceful shutdown
- [x] Update `packages/core/drizzle.config.ts` — switch to `better-sqlite3` driver
- [x] Update all `src/db/queries/*.ts` files:
  - Change parameter from `D1Database` to Drizzle `BetterSQLite3Database`
  - `users.ts`, `feeds.ts`, `articles.ts`, `pending-signups.ts`
- [x] Update `src/db/seed.ts` — change DB parameter type
- [x] Test: `test/db/connection.test.ts` (file creation, WAL mode, singleton)
- [x] Update all DB query test files to use in-memory SQLite instead of D1 mocks
- [x] Verify all existing DB tests pass

## Phase 2: Runtime Context & Middleware

**Objective:** Replace Cloudflare `Env` with `AppContext` accessible via
Astro middleware at `context.locals.app`.

- [x] Create `packages/core/src/types/context.ts` — `AppContext` and
  `EnvironmentVariables` interfaces
- [x] Deprecate `packages/core/src/types/env.d.ts` — add `@deprecated` JSDoc;
  keep as type alias for one release
- [x] Create `packages/core/src/middleware.ts`
  - Reads `process.env` for environment variables
  - Creates/reuses database connection via `createDatabase()`
  - Sets `context.locals.app` with `AppContext`
  - Handles errors (missing env vars → 503 with helpful message)
- [x] Update `packages/core/src/types/options.ts` — add `databasePath`,
  `syncSchedule`, `emailTemplateDir` options
- [x] Update `packages/core/src/integration.ts`:
  - Register middleware via `addMiddleware()` in `astro:config:setup`
  - Remove all page route injections (8 pages)
  - Keep all API route injections (11 routes)
  - Add `astro:server:start`/`astro:server:done` hooks for scheduler lifecycle
- [x] Update every route handler (`src/routes/api/**/*.ts`) to access
  `context.locals.app` instead of `context.locals.runtime.env`
- [ ] Test: `test/middleware.test.ts` (context creation, env validation) — *deferred; middleware tested implicitly via integration-factory hooks*
- [x] Update `test/integration/integration-factory.test.ts` (now expects 11
  injected API routes instead of 19)
- [x] Update all route handler tests to mock `context.locals.app`

## Phase 3: Background Processing Migration

**Objective:** Replace Cloudflare Workers (Cron Triggers + Queues) with
node-cron and inline article processing.

- [x] Install `node-cron` and `@types/node-cron` in `packages/core`
- [x] Create `packages/core/src/utils/build/scheduler.ts`
  - `startScheduler(app)` — registers cron job calling `syncFeeds`
  - `stopScheduler()` — stops all cron tasks
  - Uses `node-cron` with configurable schedule expression
  - Defaults to `*/30 * * * *` (every 30 minutes)
  - Logs sync results (feeds processed, articles processed)
- [x] Update `packages/core/src/utils/build/sync.ts`:
  - Remove `env.ARTICLE_QUEUE.send()` calls
  - After upserting articles, call `processArticle()` inline for each
  - Update `syncFeeds()` signature: accept `AppContext` instead of `Env`
  - Return enhanced result: `{ feedsProcessed, articlesProcessed }`
- [x] Update `packages/core/src/routes/api/v1/admin/sync.ts`:
  - Remove inline queue workaround
  - Call `syncFeeds()` with AppContext directly
  - Remove queue-related code and comments
- [x] Remove `packages/core/src/workers/` directory entirely
- [x] Remove `playground/src/worker.ts`
- [x] Remove worker-related entries from `playground/wrangler.toml`
  (file will be deleted entirely in Phase 7)
- [x] Update `packages/core/index.ts` — remove `scheduled`/`queue` exports;
  add `startScheduler`/`stopScheduler`
- [x] Update `packages/core/package.json` — remove `./workers` export path
- [x] Test: `test/utils/build/scheduler.test.ts` (cron registration, execution, cleanup)
- [x] Update `test/utils/build/sync.test.ts` (inline processing, no queue)
- [x] Remove `test/workers/` and create equivalent scheduler tests

## Phase 4: Auth & Email Migration

**Objective:** Update better-auth to use SQLite directly and migrate email
templates to file-based rendering.

### Auth
- [x] Update `packages/core/src/utils/build/auth.ts`:
  - Change `drizzle(env.DB)` to accept Drizzle instance from AppContext
  - `createAuth(app)` instead of `createAuth(env)` with D1
  - better-auth natively supports `better-sqlite3` — use its built-in adapter
  - Verify `baseURL` sourced from `env.PUBLIC_SITE_URL` (unchanged)
- [x] Update `packages/core/src/routes/api/auth/[...all].ts` — use AppContext
- [x] Update auth-related test mocks

### File-Based Email Templates
- [x] Create `packages/core/src/templates/email/sign-in.html`
  - Variables: `{{appName}}`, `{{greeting}}`, `{{url}}`, `{{email}}`
  - Subject in HTML comment: `<!-- subject: Sign in to {{appName}} -->`
- [x] Create `packages/core/src/templates/email/welcome.html`
  - Variables: `{{appName}}`, `{{greeting}}`, `{{url}}`, `{{email}}`, `{{name}}`
- [x] Create `packages/core/src/templates/email/email-change.html`
  - Variables: `{{appName}}`, `{{greeting}}`, `{{url}}`, `{{email}}`, `{{newEmail}}`
- [x] Create `packages/core/src/utils/build/email-renderer.ts`:
  - `renderEmailTemplate(name, data, developerDir?)` — resolves and renders
  - Template resolution: developer dir → package defaults
  - Subject extraction from `<!-- subject: ... -->` comment
  - `{{variable}}` replacement
  - Plain text generation (strip HTML tags)
  - Error handling for missing templates
- [x] Update `packages/core/src/utils/build/email-service.ts`:
  - Check for file-based template first (via renderer)
  - Fall back to code-based template functions (existing)
  - Code-based `emailConfig.templates` overrides take highest priority
- [x] Test: `test/utils/build/email-renderer.test.ts`
  - Template file resolution (developer dir, fallback to package)
  - Variable substitution
  - Subject extraction
  - Plain text generation
  - Missing template error handling
- [x] Update `test/utils/build/email-service.test.ts` for new resolution order
- [x] Update `test/utils/build/email.test.ts` for file-based templates

## Phase 5: Component Architecture Upgrade

**Objective:** Make all components composable with configurable props,
named slots, and message overrides. Components must work identically
when imported by developer-owned pages.

- [x] Update `packages/core/src/layouts/BaseLayout.astro`:
  - Add named slots: `head`, `header`, `footer`
  - Default header includes `AuthButton`, overridable via slot
  - Default footer, overridable via slot
  - Accept `title` and `description` props
- [x] Update `packages/core/src/components/SignUpForm.astro`:
  - Add `messages` prop (all copy/labels configurable)
  - Add `errorMessages` prop (all error strings configurable)
  - Default messages match current behaviour
- [x] Update `packages/core/src/components/MagicLinkForm.astro`:
  - Add `messages` prop (submit label, success text, error texts)
- [x] Update `packages/core/src/components/AuthButton.astro`:
  - Add `labels` prop (signIn, signOut, profile link text)
- [x] Update `packages/core/src/components/ConsentModal.astro`:
  - Add `messages` prop (title, body, accept/decline labels)
- [x] Update `packages/core/src/components/ArticleModal.astro`:
  - Add `labels` prop (close, next, previous)
- [x] Update `packages/core/src/components/FeedCard.astro`:
  - Add `labels` prop (read more, heart, star)
- [x] Verify all components use CSS custom properties exclusively (no hard-coded values)
- [x] Verify all components are importable from `@community-rss/core/components/*`

## Phase 6: CLI Scaffold Command

**Objective:** Create `npx @community-rss/core init` that scaffolds a
working project for the developer.

- [x] Create `packages/core/src/cli/init.mjs`:
  - Detect project root (look for `package.json`)
  - Create `src/pages/` with default pages importing package components
  - Create `src/email-templates/` with default HTML email templates
  - Create `src/styles/theme.css` with CSS custom property overrides
  - Create `.env.example` with all required environment variables
  - Create `docker-compose.yml` for production deployment
  - Create/update `astro.config.mjs` with `@astrojs/node` + `communityRss()`
  - Skip existing files (warn, don't overwrite)
  - Support `--force` flag to overwrite
  - Output summary of created files
- [x] Create all scaffold template files in `src/cli/templates/`:
  - Pages import components from `@community-rss/core/components/*`
  - Pages use `BaseLayout` from `@community-rss/core/layouts/BaseLayout.astro`
  - Pages pass through slot overrides where appropriate
- [x] Add `bin` field to `packages/core/package.json`:
  ```json
  "bin": {
    "community-rss": "./src/cli/init.mjs"
  }
  ```
- [x] Test: `test/cli/init.test.ts`
  - Files created in correct locations
  - Existing files not overwritten (without --force)
  - Generated pages contain correct imports
  - Generated astro.config.mjs is valid
  - Generated docker-compose.yml contains all services

## Phase 7: Playground Migration

**Objective:** Transform the playground from a Cloudflare Pages project to
a standard Node.js project demonstrating the new developer experience.

- [x] Update `playground/package.json`:
  - Replace `@astrojs/cloudflare` with `@astrojs/node`
  - Remove `wrangler:dev` script
  - Add `start` script: `node dist/server/entry.mjs`
- [x] Update `playground/astro.config.mjs`:
  - Switch adapter from `cloudflare` to `node`
  - Configure `communityRss()` with new options
  - Remove Cloudflare-specific config (`platformProxy`, `workerEntryPoint`)
- [x] Delete `playground/wrangler.toml`
- [x] Rename `playground/.dev.vars.example` → `playground/.env.example`
  - Update variable names (remove CF-specific ones, add `DATABASE_PATH`)
- [x] Rename `playground/.dev.vars` → `playground/.env`
- [x] Create `playground/src/pages/` with scaffolded pages (copied from CLI templates)
- [x] Create `playground/src/email-templates/` with default templates
- [x] Create `playground/src/styles/theme.css` with design token overrides

## Phase 8: Docker Compose & Production Deployment

**Objective:** docker-compose supports both dev and production modes.

- [x] Update `docker-compose.yml`:
  - App service: Node.js 22 dev container (unchanged for dev)
  - Add SQLite volume mount for data persistence
  - Remove wrangler/Miniflare references from comments
  - Add `DATABASE_PATH` env var pointing to volume-mounted path
- [x] Create `docker-compose.prod.yml`:
  - App service: production build (`node dist/server/entry.mjs`)
  - FreshRSS, MinIO dependencies
  - SQLite volume for data persistence
  - Appropriate restart policies
- [x] Create `playground/Dockerfile`:
  - Multi-stage: build stage (npm install + astro build) → production stage
  - Runs `node dist/server/entry.mjs`
  - Documents the build process for consumers

## Phase 9: Test Migration

**Objective:** All existing tests pass with the new architecture. New tests
cover new functionality. ≥80% coverage maintained.

- [x] Migrate all DB query tests:
  - Replace D1Database mocks with in-memory SQLite (better-sqlite3)
  - Or keep as Drizzle-level mocks if test structure allows
- [x] Migrate all route handler tests:
  - Replace `context.locals.runtime.env` mocks with `context.locals.app`
  - Update `Env` references to `AppContext`
- [x] Migrate worker tests → scheduler tests:
  - Test cron job registration and callback
  - Test scheduler start/stop lifecycle
- [x] Migrate sync tests:
  - Remove queue enqueue assertions
  - Add inline processArticle assertions
- [x] Update integration factory test:
  - Now expects 11 injected routes (API only, no pages)
- [x] Update all auth tests for new DB access pattern
- [x] Update email tests for file-based template resolution
- [x] Verify no test references `D1Database`, `R2Bucket`, `Queue`,
  `wrangler`, or `@cloudflare/` types
- [x] Run full test suite and verify all pass
- [x] Run coverage report and verify ≥80% on all metrics

## Phase 10: `.github` Instructions Rewrite

**Objective:** All instruction files reflect the new architecture.

- [x] Rewrite `copilot-instructions.md`:
  - **Stack:** Replace "Astro SSR + Cloudflare" with "Astro SSR + Node.js + Docker/VPS"
  - **Stack:** Remove D1, R2, Queues, Workers, Pages. Add SQLite, MinIO, node-cron
  - **Architecture:** Document integration-with-overrides pattern
  - **Architecture:** Document API routes (injected) vs pages (developer-owned)
  - **Architecture:** Document AppContext replacing Env
  - **Architecture:** Document email template file resolution
  - **Architecture:** Document CLI scaffold
  - **Anti-Patterns:** Remove Cloudflare-specific anti-patterns
  - **Anti-Patterns:** Add: "❌ Inject page routes from the package"
  - **Anti-Patterns:** Add: "❌ Hard-code messages in components — use props"
  - Remove all `wrangler`, Cloudflare, Workers, Pages references
- [x] Rewrite `instructions/implementation.instructions.md`:
  - Replace Cloudflare Bindings section with AppContext section
  - Replace D1 references with SQLite/Drizzle
  - Add Component Composition Rules section
  - Add Email Template Rules section
  - Update import examples
- [x] Rewrite `instructions/api-design.instructions.md`:
  - Remove worker exports documentation
  - Add CLI design rules
  - Document page vs API route split
  - Add AppContext interface rules
- [x] Rewrite `instructions/testing.instructions.md`:
  - Replace D1/Miniflare references with SQLite in-memory
  - Update mock patterns for AppContext
  - Remove Cloudflare pool workers references
- [x] Rewrite `instructions/test-performance.instructions.md`:
  - Replace D1 transaction pattern with SQLite in-memory pattern
  - Update seed data strategy for file-based SQLite
- [x] Update `instructions/feature-plan.instructions.md`:
  - Update template sections to reflect new architecture
  - Add CLI scaffold section
  - Add email template section
- [x] Update `instructions/documentation.instructions.md`:
  - Reorient from contributor-facing to developer-user-facing
  - Add CLI scaffold documentation requirements
  - Add email template documentation requirements
  - Remove Cloudflare deployment references

## Phase 11: Documentation Rewrite

**Objective:** Starlight docs reoriented for developer-users deploying
on VPS/Docker.

- [ ] Rewrite `docs/src/content/docs/getting-started/installation.md`:
  - `npm install @community-rss/core` + `npx @community-rss/core init`
  - Docker Compose setup
  - Verify with `docker-compose up`
- [ ] Rewrite `docs/src/content/docs/getting-started/configuration.md`:
  - `.env` file reference (not `wrangler.toml`)
  - `astro.config.mjs` with `@astrojs/node` + `communityRss()` options
  - All environment variables documented
- [ ] Rewrite `docs/src/content/docs/getting-started/local-development.md`:
  - Docker Compose (dev mode)
  - No wrangler; SQLite file; Mailpit
  - Dev workflow: edit pages → auto-reload
- [ ] Create `docs/src/content/docs/getting-started/deployment.md`:
  - Docker Compose on VPS
  - Production docker-compose.prod.yml explanation
  - Reverse proxy (Caddy/nginx) recommendation
  - SSL/TLS setup with Let's Encrypt
  - Backup strategy for SQLite + MinIO data
- [ ] Update `docs/src/content/docs/guides/feed-sync.md`:
  - node-cron instead of Cloudflare Cron Triggers
  - Inline processing instead of Queues
  - `syncSchedule` option in config
- [ ] Update `docs/src/content/docs/guides/authentication.md`:
  - Same flow, remove Cloudflare context
  - Update env var references
- [ ] Update `docs/src/content/docs/guides/email-setup.md`:
  - File-based template customisation
  - Template directory structure
  - Variable reference per template
  - Mailpit for dev, Resend for production
- [ ] Create `docs/src/content/docs/guides/customisation.md`:
  - How to customise pages (edit scaffolded files)
  - How to customise components (props and slots)
  - How to customise email templates (edit HTML files)
  - How to customise themes (CSS custom properties)
- [ ] Create `docs/src/content/docs/api-reference/cli.md`:
  - `npx @community-rss/core init` command reference
  - Flags: `--force`
  - Generated file reference
- [ ] Update `docs/src/content/docs/api-reference/integration.md`:
  - Updated `CommunityRssOptions` with new options
  - Document middleware injection
  - Document API-only route injection
- [ ] Update `docs/src/content/docs/api-reference/routes.md`:
  - Clarify injected API routes vs scaffolded pages
  - Remove page routes from injected list
- [ ] Update `docs/src/content/docs/api-reference/options.md`:
  - New options: `databasePath`, `syncSchedule`, `emailTemplateDir`
- [ ] Update `docs/src/content/docs/contributing/architecture.md`:
  - Docker/VPS stack description
  - AppContext pattern
  - Component composition rules
  - Integration-with-overrides pattern
- [ ] Update `docs/src/content/docs/contributing/setup.md`:
  - Docker Compose development (no wrangler)
  - SQLite instead of D1
- [ ] Update `docs/astro.config.mjs` sidebar with new pages

## Phase 12: Final Verification & Coverage

**Objective:** Everything works end-to-end. All tests pass. Coverage ≥80%.

- [ ] Run `npm run test:coverage` from root — all tests pass, ≥80% coverage
- [ ] Run `npm run build --workspace=playground` — builds successfully
- [ ] Run `npm run build --workspace=docs` — builds successfully
- [ ] Start `docker-compose up -d` — all services healthy
- [ ] Run `npm run dev --workspace=playground` — homepage renders articles
- [ ] Test sign-in/sign-up/sign-out flow end-to-end via Mailpit
- [ ] Test manual sync: `POST /api/v1/admin/sync` → articles appear
- [ ] Test admin feed add: `POST /api/v1/admin/feeds` → feed created
- [ ] Test profile edit → profile updates
- [ ] Test email change flow end-to-end
- [ ] Verify `npx @community-rss/core init` scaffolds correctly
- [ ] Verify no Cloudflare-specific code remains in `packages/core/`
- [ ] Verify no references to `wrangler`, `D1Database`, `R2Bucket`, `Queue`
  remain in source (test mocks are acceptable during migration)
- [ ] Update `packages/core/package.json` keywords (remove "cloudflare")
- [ ] Verify playground demonstrates the new developer experience correctly

---

## Implementation Notes

### Phase 1: Database Layer Migration

**Commit:** `81ab4c9` — 318 tests passing

**Completed:**
- Created `src/db/connection.ts` with singleton pattern, WAL mode, foreign keys
  enabled, and auto-creation of parent directories via `mkdirSync`
- Added `_resetDatabaseSingleton()` export for test isolation
- Changed all 4 DB query files (`users.ts`, `feeds.ts`, `articles.ts`,
  `pending-signups.ts`) from `D1Database` param + `drizzle(db)` wrapping to
  accepting `BetterSQLite3Database` directly (Drizzle instance passed in)
- Updated `seed.ts` param type
- Updated `drizzle.config.ts` to `better-sqlite3` driver
- Created 7 unit tests for connection factory
- Removed `@cloudflare/workers-types` and `wrangler` dev dependencies

**Decisions:**
- DB query functions accept Drizzle `BetterSQLite3Database` directly instead of
  raw `better-sqlite3` Database. This avoids redundant `drizzle()` wrapping at
  every call site — the connection factory creates the Drizzle instance once.
- The `_resetDatabaseSingleton()` function is prefixed with underscore to signal
  it's test-only. It's needed because the singleton pattern would otherwise leak
  state between test files.

**Issues:** None.

---

### Phase 2: Runtime Context & Middleware

**Commit:** `d416802` — 318 tests passing

**Completed:**
- Created `src/types/context.ts` with `AppContext` and `EnvironmentVariables`
  interfaces
- Created `src/middleware.ts` using Astro `defineMiddleware`
- Updated `src/types/options.ts` with `databasePath`, `syncSchedule`,
  `emailTemplateDir` options and `ResolvedCommunityRssOptions` type
- Updated `integration.ts`: removed 8 page route injections (kept 11 API
  routes), added `registerMiddleware()`, added `astro:server:start` and
  `astro:server:done` hooks
- Updated all 11 route handlers to use `(locals as { app?: AppContext }).app`
  pattern
- Updated all route and utility test files to mock `context.locals.app`
- Auth migrated: `createAuth(app)`, `requireAuth(request, app)`,
  `requireAdmin(request, app)` — all accept `AppContext`
- Email service migrated: `createEmailService(app)` reads config from
  `app.config.email`
- Updated `index.ts` exports: added `AppContext`, `EnvironmentVariables`,
  `ResolvedCommunityRssOptions`, `createDatabase`, `closeDatabase`

**Decisions:**
- Route handlers use `(locals as { app?: AppContext }).app` casting because
  Astro's `locals` type is `Record<string, unknown>` and the framework can't
  modify the consumer's type declarations. The `as` cast is safe since the
  middleware always sets `locals.app`.
- `test/middleware.test.ts` was deferred — middleware is tested implicitly via
  the integration factory test's lifecycle hook tests. A dedicated middleware
  test would require mocking Astro's `defineMiddleware` virtual module.
- `syncFeeds()` signature changed to `syncFeeds(app: AppContext)`. The return
  type changed from `{ feedsProcessed, articlesEnqueued }` to
  `{ feedsProcessed, articlesProcessed }` to reflect inline processing.

**Issues:**
1. **JSDoc `*/` in comment breaks esbuild** — The `@default '*/30 * * * *'`
   JSDoc tag in `options.ts` was interpreted by esbuild as closing the JSDoc
   comment block, causing a build error. Fixed by rewording to descriptive
   text: `"Defaults to every 30 minutes (STAR/30 STAR STAR STAR STAR)"`.
   **Lesson:** Avoid literal `*/` inside JSDoc comments; use descriptive text
   or escape the asterisk.
2. **`astro:middleware` virtual module unavailable in Vitest** — Importing
   `defineMiddleware` from `astro:middleware` in `integration.ts` caused the
   integration-factory test to fail because Vitest cannot resolve Astro virtual
   modules. Fixed by removing the import — the middleware file is registered
   via file path (`addMiddleware({ entrypoint, order })`) not direct import.
   **Lesson:** Never import Astro virtual modules (`astro:middleware`,
   `astro:content`, etc.) in files that are also imported by test code. Use
   file-path-based registration instead.

---

### Phase 3: Background Processing Migration

**Commit:** `0246818` — 326 tests passing (8 new tests)

**Completed:**
- Created `src/utils/build/scheduler.ts` with `startScheduler(app)`,
  `stopScheduler()`, `isSchedulerRunning()`
- Scheduler validates cron expression via `node-cron.validate()` and uses
  singleton active-task pattern
- Removed `src/workers/` directory (3 files), `test/workers/` directory,
  and `playground/src/worker.ts`
- Updated `sync.ts` to process articles inline with `processArticle()` +
  `upsertArticle()`
- Updated `admin/sync.ts` route to call `syncFeeds(app)` directly
- Removed `./workers` export path from `package.json`
- Added `startScheduler`, `stopScheduler`, `isSchedulerRunning` exports
- Created 11 scheduler unit tests

**Decisions:**
- `startScheduler` accepts full `AppContext` (not separate params) for
  consistency with the rest of the codebase.
- Scheduler uses `isSchedulerRunning()` guard to prevent double-start, which
  is important during dev server HMR restarts.
- `wrangler.toml` was NOT deleted in this phase (plan said Phase 6, but Phase 7
  is more appropriate since playground migration is Phase 7).

**Issues:**
1. **Vitest hoisting with `vi.mock()` factories** — The scheduler test initially
   declared `const mockSchedule = vi.fn()` before the `vi.mock()` call. Even
   though `vi.mock()` is hoisted to the top of the file, the variable
   declarations are not, causing the mock factory to reference `undefined`.
   Fixed by using the `vi.hoisted()` pattern — wrapping all mock references
   in a `const mocks = vi.hoisted(() => ({ ... }))` block that is hoisted
   alongside `vi.mock()`.
   **Lesson:** Always use `vi.hoisted()` when mock factories need to reference
   variables. Never declare mock variables with `const`/`let` outside the
   hoisted block.
2. **Sed double-prefix during refactor** — While renaming `mockSchedule` →
   `mocks.mockSchedule` via `sed`, the substitution also affected the
   `vi.hoisted` block itself, creating `mocks.mocks.mockSchedule`. This
   required a manual correction pass.
   **Lesson:** When using `sed` to rename variables, exclude the declaration
   site (e.g., use line-range restrictions or more specific patterns).

---

### Phase 4: File-Based Email Template Renderer

**Commit:** `7dd81de` — 348 tests passing (22 new tests)

**Completed:**
- Created `src/utils/build/email-renderer.ts` with 5 exported functions:
  `renderEmailTemplate()`, `resolveTemplatePath()`, `extractSubject()`,
  `substituteVariables()`, `htmlToPlainText()`
- Created 3 default email templates in `src/templates/email/`:
  `sign-in.html`, `welcome.html`, `email-change.html`
- Updated `email-service.ts` with 3-tier template resolution:
  1. Code-based custom templates (`emailConfig.templates`) — highest priority
  2. File-based templates (developer dir → package defaults via renderer)
  3. Code-based default templates (built-in fallback)
- Added `renderEmailTemplate` export to `index.ts`
- Created 22 unit tests covering all renderer functions

**Decisions:**
- Template resolution uses a two-stage file lookup: developer's project dir
  first, then the package's built-in `src/templates/email/` directory. This
  lets developers override individual templates without copying all of them.
- `htmlToPlainText()` uses regex-based HTML stripping rather than a full DOM
  parser. This keeps the dependency tree small and is sufficient for the simple
  email templates used.
- Subject is extracted from an HTML comment (`<!-- subject: ... -->`) rather
  than a separate metadata file, keeping templates self-contained.

**Issues:**
1. **Multi-line anchor tags in `htmlToPlainText()`** — The initial regex
   `<a[^>]*href="([^"]*?)"[^>]*>(.*?)</a>` used `(.*?)` which does not match
   newlines. The email templates had multi-line `<a>` tags (href on one line,
   text on the next), causing the regex to fail silently and output raw HTML.
   Fixed by replacing `(.*?)` with `([\s\S]*?)` and using a callback function
   for `String.replace()` to trim the matched text content.
   **Lesson:** When writing regex to match HTML content, always account for
   newlines in tag bodies. Use `[\s\S]*?` instead of `.*?` or use the `s`
   (dotAll) flag.

---

### Phase 5: Component Architecture Upgrade

**Commit:** `bdd2200` — 348 tests passing (no new tests)

**Completed:**
- Updated `BaseLayout.astro`: added named slots (`head`, `header`, `footer`),
  conditional header rendering (only shown when no `header` slot override)
- Updated `AuthButton.astro`: added `labels` prop (`signIn`, `signOut`,
  `profileLink`)
- Updated `ArticleModal.astro`: added `labels` prop (`close`, `next`,
  `previous`, `readOriginal`)
- Updated `FeedCard.astro`: added `labels` prop (`hearts`, `stars`)
- Updated `ConsentModal.astro`: added `messages` prop (`title`, `body`,
  `detail`, `acceptLabel`, `declineLabel`)
- Updated `MagicLinkForm.astro`: added `messages` prop (`emailLabel`,
  `submitLabel`, `successText`, `errorText`, `networkErrorText`); uses
  `data-*` attributes for passing strings to client-side JS
- Updated `SignUpForm.astro`: added `messages` + `errorMessages` props;
  uses `data-*` attributes for client-side strings

**Decisions:**
- Components with client-side JavaScript (`MagicLinkForm`, `SignUpForm`) pass
  configurable strings via `data-*` attributes on the form element, which the
  `<script>` block reads at runtime. This avoids the need for a separate i18n
  runtime or global variable injection.
- No new tests were added for component changes because Astro components
  cannot be unit-tested in Vitest without a full Astro build pipeline. The
  components are tested via the playground's manual/visual testing. Future
  consideration: add E2E tests with Playwright.
- `BaseLayout.astro` uses `Astro.slots.has('header')` to conditionally render
  the default header, allowing full header replacement via slot override.

**Issues:** None.

---

### Phase 6: CLI Scaffold Command

**Commit:** *(pending)* — 360 tests passing (12 new tests)

**Completed:**
- Created `src/cli/init.mjs` with `scaffold()` function, `findProjectRoot()`,
  `FILE_MAP` (15 template→target mappings), `--force` and `--help` flags
- Created 15 template files in `src/cli/templates/`:
  - 8 page templates (`index.astro`, `article/[id].astro`, `auth/signin.astro`,
    `auth/signup.astro`, `auth/verify.astro`, `auth/verify-email-change.astro`,
    `profile.astro`, `terms.astro`)
  - 3 email templates (`sign-in.html`, `welcome.html`, `email-change.html`)
  - 4 config templates (`astro.config.mjs`, `env.example`, `docker-compose.yml`,
    `theme.css`)
- Added `"bin": { "community-rss": "./src/cli/init.mjs" }` to `package.json`
- Added `@cli` path alias to `vitest.config.ts`
- Excluded `src/cli/**` from coverage (standalone script, not library code)
- Created 12 unit tests covering file creation, skip/force, error handling,
  content validation for pages, emails, config, and docker-compose

**Decisions:**
- CLI entry point is `.mjs` (not `.ts`) to avoid requiring a TypeScript build
  step for `npx` execution. The `scaffold()` function is exported so tests
  can import it directly.
- Scaffold pages use client-side API fetching (`/api/v1/articles`) rather than
  SSR database queries. This is intentional — the DB query functions are not
  exported from the package's public API, so scaffold pages should only use
  the public API surface (routes, components, layouts).
- `init.mjs` detects direct execution via `process.argv[1]` comparison rather
  than `import.meta.main` (which is not universally supported in Node.js ESM).
- The `docker-compose.yml` template includes FreshRSS, MinIO, and Mailpit but
  NOT the Node.js app itself — the developer runs `npm run dev` or `node
  dist/server/entry.mjs` on the host.
- `findProjectRoot()` walks up from `cwd` looking for `package.json`, which
  correctly handles invocation from subdirectories.

**Issues:** None.

---

### Phase 7: Playground Migration

**Commit:** *(pending)* — 360 tests passing (no new tests)

**Completed:**
- Replaced `@astrojs/cloudflare` with `@astrojs/node` in `playground/package.json`
- Removed `wrangler:dev` script, added `start` script
- Updated `playground/astro.config.mjs`: switched to `node({ mode: 'standalone' })`,
  removed `platformProxy` and `workerEntryPoint` config
- Deleted `playground/wrangler.toml` (Cloudflare Workers config)
- Renamed `.dev.vars.example` → `.env.example`, `.dev.vars` → `.env`
- Added `DATABASE_PATH` to env files, removed CF-specific vars
  (`CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`)
- Copied all 15 scaffold template files to playground:
  8 pages, 3 email templates, theme.css (via `cp` from `src/cli/templates/`)

**Decisions:**
- `better-sqlite3` is NOT added as a direct playground dependency — it's
  already a dependency of `@community-rss/core` and is available transitively
  through the workspace symlink. Adding it would create version conflicts.
- `worker.ts` was already deleted in Phase 3 — Phase 7 only needed to delete
  `wrangler.toml`.
- Playground pages are exact copies of scaffold templates rather than
  customized versions. This ensures the playground demonstrates the exact
  developer experience a consumer would get from `npx @community-rss/core init`.
- Dev server verification and build verification deferred to Phase 12
  (Final Verification) since they require live Docker services.

**Issues:** None.

---

### Phase 8: Docker Compose & Production Deployment

**Commit:** *(pending)* — 360 tests passing (no new tests)

**Completed:**
- Updated `docker-compose.yml`: added `app_data` volume mount for SQLite
  persistence, added `DATABASE_PATH` env var, removed wrangler comments
- Created `docker-compose.prod.yml` as production override:
  builds from `playground/Dockerfile`, overrides dev container with production
  Node.js app, sets `restart: unless-stopped`, adds `depends_on` for freshrss
  and minio
- Created `playground/Dockerfile` with multi-stage build:
  Stage 1 (build): `npm ci` + `npm run build`
  Stage 2 (production): `npm ci --omit=dev` + copy `dist/` + `CMD node dist/server/entry.mjs`

**Decisions:**
- Caddy reverse proxy was omitted from docker-compose.prod.yml — it's
  infrastructure-specific and better documented as an optional guide rather
  than bundled in the scaffold. Consumers can add their own reverse proxy.
- Mailpit is NOT included in docker-compose.prod.yml — production should use
  Resend or a real SMTP server. Mailpit comes from the base compose file for
  dev only.
- The production Dockerfile lives in `playground/` rather than the repo root
  because it's specific to the playground/consumer app, not the core package.
- Docker service tests deferred to Phase 12 since they require live Docker
  daemon access.

**Issues:** None.

---

### Phase 9: Test Migration

**Commit:** *(pending)* — 360 tests passing (no new tests)

**Completed:**
- Updated `src/utils/build/guest.ts`: `D1Database` → `BetterSQLite3Database`
  (imports from `drizzle-orm/better-sqlite3`)
- Updated `src/utils/build/admin-feeds.ts`: `D1Database` → `BetterSQLite3Database`
- Renamed `itemToQueueMessage` → `mapFreshRssItem` in `src/utils/build/sync.ts`;
  renamed `ArticleQueueMessage` → `ArticlePayload`
- Updated JSDoc comments to remove D1/queue terminology
- Updated `test/utils/build/guest.test.ts`: added `BetterSQLite3Database` import
- Updated `test/utils/build/admin-feeds.test.ts`: added `BetterSQLite3Database`
  import
- Updated `test/utils/build/sync.test.ts`: renamed imports
- Removed dead `src/routes/pages/` directory (8 .astro files no longer injected
  since Phase 2, still containing D1 references)
- Verified zero grep hits for `D1Database`, `R2Bucket`, `Queue`, `wrangler`,
  `@cloudflare`, `locals.runtime` across `test/`
- Coverage: Statements 87%, Branches 89%, Functions 95%, Lines 87% (all ≥80%)

**Decisions:**
- `src/types/env.d.ts` was NOT deleted — it's marked `@deprecated` and exported
  from `index.ts` as `Env` for one more release. Will be removed in the next
  major version.
- The bulk of test migration was already done in Phases 1-5 alongside the code
  changes. Phase 9 caught the remaining stragglers (`guest.ts`, `admin-feeds.ts`,
  `sync.ts`) and dead page route files.

**Issues:** None.

---

### Phase 10: `.github` Instructions Rewrite — ✅ Completed

**Commit:** *(pending)* — 360 tests passing (no new tests)

**Completed:**
- Rewrote all 7 instruction files listed in the plan:
  - `copilot-instructions.md` — full rewrite with Docker/VPS stack, AppContext,
    CLI scaffold, email templates, component `messages`/`labels` props,
    route architecture (injected API vs scaffolded pages)
  - `instructions/implementation.instructions.md` — replaced "Cloudflare Bindings"
    section with "Runtime Context (AppContext)", added Email Templates, Route
    Architecture, and Background Processing sections; updated component standards
    with `messages`/`labels` props; added `@cli/*` path alias
  - `instructions/api-design.instructions.md` — removed Cloudflare Worker exports,
    added CLI Surface section, added Route Architecture section documenting
    injected API routes vs scaffolded pages, updated DB layer to reference
    `BetterSQLite3Database`
  - `instructions/testing.instructions.md` — replaced D1/Miniflare with in-memory
    SQLite via better-sqlite3, added `vi.hoisted()` rule, added CLI and email
    template test expectations
  - `instructions/test-performance.instructions.md` — replaced D1/Miniflare
    examples with `BetterSQLite3Database` + `Database(':memory:')` patterns
  - `instructions/feature-plan.instructions.md` — updated all template examples
    (Drizzle instead of raw SQL, SQLite instead of D1), added CLI scaffold phase
    and email template phase to template, added review checklist items for
    component props and page route scaffolding
  - `instructions/documentation.instructions.md` — added CLI Documentation and
    Deployment Documentation sections
- Also discovered and rewrote 4 additional files with Cloudflare references:
  - `skills/feature-implementation/SKILL.md` — updated capabilities, workflow
    steps, and standards compliance sections
  - `prompts/plan.prompt.md` — replaced D1 references, added CLI scaffold checks
  - `prompts/test.prompt.md` — replaced Cloudflare-specific testing section with
    database testing and mock patterns
  - `prompts/implement.prompt.md` — replaced Cloudflare bindings rules with
    AppContext, relative imports, and CLI patterns
  - `prompts/maintenance.prompt.md` — removed wrangler.toml validation, added
    AppContext and CLI scaffold validation
  - `pull_request_template.md` — replaced Cloudflare binding checks with AppContext,
    component props, page scaffolding, and SQLite test checks
- Verified zero Cloudflare references remain across all `.github/` files
  (only contextual "not D1/Miniflare" clarifications in testing files)

**Decisions:**
- The plan listed 7 files but grep revealed 6 additional files (4 prompts, 1
  skill, 1 PR template) containing Cloudflare references. All were rewritten
  for consistency rather than doing minimal search-and-replace.
- Each file was fully rewritten rather than patched, ensuring no stale context
  remains. This is a documentation-only change with no code impact.

**Issues:** None.

---

### Cross-Phase Lessons Learned

1. **Mock hoisting is the #1 Vitest footgun** — Always use `vi.hoisted()` for
   any variable referenced inside a `vi.mock()` factory. This came up in
   Phase 3 and would have been avoided with a consistent pattern from the start.
2. **Astro virtual modules break tests** — Files that import from `astro:*`
   virtual modules cannot be directly imported in Vitest. Design modules to
   be registered by file path rather than direct import when they use Astro
   virtual modules.
3. **JSDoc and `*/`** — Never put literal `*/` in JSDoc tags (e.g., cron
   expressions). Bundlers and parsers interpret it as end-of-comment.
4. **Regex and HTML** — Always use `[\s\S]*?` (or the `s` flag) when matching
   HTML content that may span multiple lines. The `.` character class does not
   match newlines by default.
5. **Sed is fragile for code refactoring** — Prefer editor-based find/replace
   or purpose-built AST tools over `sed` for renaming variables in code.
   Line-level text substitution easily causes double-replacements or misses.
6. **Test count is a useful progress signal** — Tracking test count at each
   phase commit (318 → 318 → 326 → 348 → 348) helps catch accidental test
   deletion or regression.

---

## Test Strategy

### Test Files (New and Modified)

| File | Type | Key Tests |
|------|------|-----------|
| `test/db/connection.test.ts` | Unit | Connection creation, WAL mode, singleton, close |
| `test/middleware.test.ts` | Unit | Context creation, env validation, error handling |
| `test/utils/build/scheduler.test.ts` | Unit | Cron registration, callback, start/stop |
| `test/utils/build/email-renderer.test.ts` | Unit | Template resolution, variable substitution, subject extraction |
| `test/cli/init.test.ts` | Unit | File creation, skip existing, force flag |
| All existing `test/db/queries/*.test.ts` | Migration | D1 mocks → SQLite mocks |
| All existing `test/routes/**/*.test.ts` | Migration | Env → AppContext mocks |
| `test/utils/build/sync.test.ts` | Migration | Remove queue, add inline processing |
| `test/integration/integration-factory.test.ts` | Migration | 19 → 11 injected routes |

### Fixtures Changes

| File | Change |
|------|--------|
| `test/fixtures/context.ts` (new) | Mock `AppContext` factory for route tests |
| `test/fixtures/users.ts` | No changes (data, not infra) |
| `test/fixtures/articles.ts` | No changes |
| `test/fixtures/feeds.ts` | No changes |
| `test/fixtures/auth.ts` | No changes |
| `test/fixtures/email.ts` | Add file-based template fixtures |

### Coverage Targets

| Metric | Pre-0.4.0 | Target |
|--------|-----------|--------|
| Statements | 85.8% | ≥80% |
| Branches | ~83% | ≥80% |
| Functions | ~93% | ≥80% |
| Lines | ~85% | ≥80% |

---

## Forward Compatibility Notes

- `Env` type is deprecated but kept as a re-export for one release
- Worker exports (`scheduled`, `queue`) are removed — acceptable
  breaking change pre-1.0.0
- `CommunityRssOptions` gains new optional fields with defaults —
  existing consumers unaffected
- Page route injection removed — consumers who relied on injected pages
  must run `npx @community-rss/core init` to scaffold pages. This is
  a breaking change but acceptable pre-1.0.0.
- Component props are additive (new optional props with defaults) — no
  breaking change for existing component usage

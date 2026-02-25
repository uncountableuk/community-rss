# Release 0.4.0 — Architecture Migration: Impact Assessment

## Executive Summary

Release 0.4.0 is a foundational refactor that makes two architectural changes
before further feature work proceeds:

1. **Infrastructure: Cloudflare → Docker/VPS** — Replace all Cloudflare-specific
   services (D1, R2, Queues, Workers, Pages) with standard self-hosted
   equivalents (SQLite file, MinIO/S3, in-process queue, Node.js server).
2. **Developer Model: Injected Routes → Integration with Overrides** — Shift
   page ownership from the package to the developer. The package provides API
   routes, components, utilities, and email templates. Developers scaffold their
   own pages, import package components, and customise freely. Package updates
   don't overwrite developer files.

**All 309 existing tests must pass (or be migrated) and ≥80% coverage must be
maintained when 0.4.0 is complete.** No user-facing functionality is added or
removed — this release is purely structural.

---

## 1. Motivation

### 1.1 Moving Away from Cloudflare

The current architecture is deeply coupled to Cloudflare's proprietary
platform (D1, R2, Queues, Cron Triggers, Workers, Pages). This causes:

- **Cron Triggers don't work on Cloudflare Pages.** The project has already
  worked around this with an inline sync endpoint, but this is a dev-only
  hack with a 30-second timeout risk in production.
- **Queue consumers don't work with `wrangler pages dev`.** Another documented
  limitation — articles are processed inline as a workaround.
- **Vendor lock-in.** Developers who install `@community-rss/core` must deploy
  to Cloudflare. A VPS/Docker deployment is more universal and accessible.
- **Complex local development.** Wrangler, Miniflare, and the Pages/Workers
  distinction add cognitive overhead for contributors and consumers.

A standard Docker Compose deployment (Node.js server + SQLite + MinIO +
FreshRSS + Mailpit) removes all of these constraints while keeping the
architecture simple and portable.

### 1.2 Changing the Developer Model

The current "injected routes" model injects **all** pages (homepage, article
detail, auth pages, profile, terms) into the developer's project. Developers
override pages by creating files at the same path (Astro shadowing). This has
problems:

- **Tight coupling.** Developers can't customise page structure without
  understanding the entire injected page implementation.
- **Fragile upgrades.** When the package updates an injected page, developers
  who have shadowed it must manually diff and re-apply their customisations.
- **Opaque flow.** Developers can't see what pages exist in their project
  because they're hidden in `node_modules`.

The new model:

- **API routes remain injected** — backend endpoints (`/api/v1/*`,
  `/api/auth/*`) ship with the package and update automatically.
- **Pages are scaffolded into the developer's project** — `npx @community-rss/core init`
  creates pages that import package components. Developers own these pages.
- **Components are exported** — developers import and compose them in their
  pages. Package updates bring new component features without touching pages.
- **Email templates are file-based** — HTML files with `{{variable}}` placeholders.
  Developers copy defaults to their project and customise freely.

---

## 2. Infrastructure Changes

### 2.1 Database: D1 → SQLite (file-based)

| Aspect | Before (D1) | After (SQLite file) |
|--------|-------------|---------------------|
| Driver | Cloudflare D1 binding | `better-sqlite3` |
| Drizzle dialect | `drizzle-orm/d1` | `drizzle-orm/better-sqlite3` |
| Access pattern | `env.DB` (Cloudflare binding) | Drizzle instance via middleware |
| Migrations | `wrangler d1 migrations apply` | `drizzle-kit migrate` (or push) |
| Schema file | `src/db/schema.ts` (unchanged) | `src/db/schema.ts` (unchanged) |
| Test driver | Miniflare local D1 / mocks | `better-sqlite3` in-memory / mocks |

**Impact:** The Drizzle schema (`schema.ts`) is dialect-agnostic for SQLite
and requires **no changes**. The migration is in the driver initialisation and
query execution layer. All `db/queries/*.ts` files use Drizzle's query builder,
which generates valid SQLite SQL for both D1 and better-sqlite3.

**Files affected:**
- `src/types/env.d.ts` — Remove `D1Database` type, add `DATABASE_PATH` string
- `src/db/connection.ts` (new) — Database connection factory
- `src/db/queries/*.ts` — Change `D1Database` parameter to Drizzle DB instance
- `drizzle.config.ts` — Update driver config
- All test files that mock `D1Database`

### 2.2 Object Storage: R2 → S3-compatible (MinIO)

| Aspect | Before (R2) | After (MinIO/S3) |
|--------|-------------|------------------|
| Binding | `env.MEDIA_BUCKET: R2Bucket` | `@aws-sdk/client-s3` S3Client |
| Access pattern | R2 API (`put`, `get`, `delete`) | S3 API (`PutObject`, `GetObject`) |
| Local dev | MinIO (already in docker-compose) | MinIO (unchanged) |
| Production | Cloudflare R2 | MinIO in docker-compose |

**Impact:** The codebase already has `@aws-sdk/client-s3` as a dependency
(added in 0.1.0 for the media caching pipeline planned for 0.6.0). R2 is
S3-compatible, so the API is virtually identical. The `R2Bucket` binding
type is the only Cloudflare-specific part. Since the media caching pipeline
hasn't been implemented yet (planned for post-0.4.0), the actual code change
is just removing the `MEDIA_BUCKET` binding from `Env` and ensuring the S3
client configuration is standard.

**Files affected:**
- `src/types/env.d.ts` — Remove `MEDIA_BUCKET: R2Bucket`, add S3 config vars
- Future media caching code (0.6.0+) will use S3Client directly

### 2.3 Background Processing: Cloudflare Queues/Cron → node-cron + In-Process

| Aspect | Before | After |
|--------|--------|-------|
| Scheduling | Cloudflare Cron Triggers | `node-cron` (npm package) |
| Queue | Cloudflare Queues | In-process async task runner |
| Worker exports | `scheduled()`, `queue()` | `startScheduler()`, `processArticles()` |
| Reliability | Platform-managed retries | Process-lifetime (lost on restart, re-synced on next cron) |

**Impact:** This is the most significant behavioural change. Currently:
1. Cron → `syncFeeds()` → enqueues articles to `ARTICLE_QUEUE`
2. Queue consumer → `processArticle()` → sanitises and stores

New flow:
1. node-cron → `syncFeeds()` → processes articles inline (no queue needed)

Since the VPS process is long-lived (Node.js server), there's no execution
time limit. Articles can be processed synchronously within `syncFeeds()`.
The queue abstraction is removed — it was a Cloudflare-specific concern.

**Files affected:**
- `src/workers/scheduled.ts` — Replace with `src/utils/build/scheduler.ts`
- `src/workers/queue.ts` — Remove (logic merged into sync)
- `src/workers/index.ts` — Remove or replace with scheduler exports
- `src/utils/build/sync.ts` — Process articles inline instead of enqueuing
- `index.ts` — Remove `scheduled`/`queue` exports, add `startScheduler`
- `playground/src/worker.ts` — Remove entirely
- `playground/wrangler.toml` — Remove entirely

### 2.4 Astro Adapter: Cloudflare → Node.js

| Aspect | Before | After |
|--------|--------|-------|
| Adapter | `@astrojs/cloudflare` | `@astrojs/node` |
| Runtime | Cloudflare Workers | Node.js 22 |
| Env access | `context.locals.runtime.env` | `process.env` + middleware |
| Build output | `dist/_worker.js/` | `dist/server/` (standalone) |
| Dev server | `astro dev` (Vite) | `astro dev` (Vite) — unchanged |
| Production | `wrangler pages deploy` | `node dist/server/entry.mjs` |

**Impact:** Routes currently access Cloudflare bindings via
`context.locals.runtime.env`. With `@astrojs/node`, there is no `runtime`
local. The integration must register middleware that populates
`context.locals` with the database instance, S3 client, and config.

**Files affected:**
- `src/integration.ts` — Add middleware registration, remove Cloudflare assumptions
- `src/middleware.ts` (new) — Creates and injects runtime context
- All route handlers that access `context.locals.runtime.env`
- `playground/astro.config.mjs` — Switch adapter
- `playground/package.json` — Switch adapter dependency

### 2.5 Docker Compose: Dev → Dev + Production

| Aspect | Before | After |
|--------|--------|-------|
| Purpose | Local development only | Dev + production deployment |
| App container | sleep infinity (dev shell) | `node dist/server/entry.mjs` (prod) |
| Reverse proxy | None | Caddy or nginx (recommended in docs) |
| Database | Miniflare local D1 | SQLite file in Docker volume |
| Wrangler | Required for local D1/R2 | Not needed |

**Files affected:**
- `docker-compose.yml` — Add production mode configuration
- `docker-compose.prod.yml` (new) — Production override
- `Dockerfile` (new, in playground/docs for reference) — Multi-stage build

---

## 3. Developer Model Changes

### 3.1 What the Package Provides (Injected Automatically)

These are backend routes that update when the developer runs `npm update`:

| Category | Routes | Purpose |
|----------|--------|---------|
| Auth API | `/api/auth/[...all]` | better-auth catch-all |
| Articles API | `/api/v1/articles` | Article listing + pagination |
| Profile API | `/api/v1/profile`, `/api/v1/profile/*` | Profile CRUD |
| Auth API | `/api/v1/auth/check-email`, `/api/v1/auth/signup` | Sign-up flow |
| Admin API | `/api/v1/admin/sync`, `/api/v1/admin/feeds` | Admin operations |
| Health | `/api/v1/health` | Health check |

### 3.2 What the Developer Owns (Scaffolded)

These are pages created by `npx @community-rss/core init` in the developer's
`src/pages/` directory. They import package components:

| Page | What it renders | Package components used |
|------|----------------|------------------------|
| `src/pages/index.astro` | Homepage | `FeedGrid`, `TabBar`, `BaseLayout` |
| `src/pages/article/[id].astro` | Article detail | `ArticleModal`, `BaseLayout` |
| `src/pages/auth/signin.astro` | Sign-in | `MagicLinkForm`, `BaseLayout` |
| `src/pages/auth/signup.astro` | Sign-up | `SignUpForm`, `BaseLayout` |
| `src/pages/auth/verify.astro` | Magic link landing | `BaseLayout` |
| `src/pages/profile.astro` | User profile | `AuthButton`, `BaseLayout` |
| `src/pages/terms.astro` | Terms of Service | `BaseLayout` |
| `src/email-templates/sign-in.html` | Sign-in email | — |
| `src/email-templates/welcome.html` | Welcome email | — |
| `src/email-templates/email-change.html` | Email change | — |

### 3.3 What the Developer Imports (Package Exports)

```typescript
// Integration factory
import communityRss from '@community-rss/core';

// Layout & components
import BaseLayout from '@community-rss/core/layouts/BaseLayout.astro';
import FeedGrid from '@community-rss/core/components/FeedGrid.astro';
import FeedCard from '@community-rss/core/components/FeedCard.astro';
import TabBar from '@community-rss/core/components/TabBar.astro';
import ArticleModal from '@community-rss/core/components/ArticleModal.astro';
import AuthButton from '@community-rss/core/components/AuthButton.astro';
import MagicLinkForm from '@community-rss/core/components/MagicLinkForm.astro';
import SignUpForm from '@community-rss/core/components/SignUpForm.astro';
import ConsentModal from '@community-rss/core/components/ConsentModal.astro';

// CSS tokens
import '@community-rss/core/styles/tokens.css';

// Email utilities (for custom email integrations)
import { createEmailService } from '@community-rss/core';
```

### 3.4 Upgrade Flow

When a developer runs `npm update @community-rss/core`:

1. **API routes update automatically** — they live in `node_modules`
2. **Components update automatically** — imported from `node_modules`
3. **Utility functions update automatically** — called from components
4. **Pages are untouched** — they live in the developer's `src/pages/`
5. **Email templates are untouched** — they live in the developer's project
6. **New features** are documented in release notes with instructions on
   how to adopt them (e.g., "Add `<FollowButton />` to your author page")

### 3.5 CLI Scaffold Command

```bash
npx @community-rss/core init
```

Creates:
```
src/
├── pages/
│   ├── index.astro
│   ├── article/[id].astro
│   ├── auth/
│   │   ├── signin.astro
│   │   ├── signup.astro
│   │   └── verify.astro
│   ├── profile.astro
│   └── terms.astro
├── email-templates/
│   ├── sign-in.html
│   ├── welcome.html
│   └── email-change.html
├── styles/
│   └── theme.css          # CSS custom property overrides
astro.config.mjs            # Pre-configured with communityRss()
.env.example                # All required environment variables
docker-compose.yml          # Full production stack
```

### 3.6 Email Template System

Email templates change from TypeScript functions to HTML files with
`{{variable}}` placeholders:

**Default template (`sign-in.html`):**
```html
<!--
  subject: Sign in to {{appName}}
-->
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>{{greeting}}</h2>
  <p>Click the button below to sign in to {{appName}}.</p>
  <a href="{{url}}" style="display:inline-block; padding:12px 24px;
    background:#4f46e5; color:#fff; text-decoration:none; border-radius:6px;">
    Sign In
  </a>
  <p style="color:#666; font-size:12px; margin-top:32px;">
    If you didn't request this, you can safely ignore this email.
  </p>
</body>
</html>
```

**Resolution order:**
1. Developer's `src/email-templates/sign-in.html` (if exists)
2. Package default template

**Available variables per template type:**

| Template | Variables |
|----------|-----------|
| `sign-in` | `{{appName}}`, `{{greeting}}`, `{{url}}`, `{{email}}` |
| `welcome` | `{{appName}}`, `{{greeting}}`, `{{url}}`, `{{email}}`, `{{name}}` |
| `email-change` | `{{appName}}`, `{{greeting}}`, `{{url}}`, `{{email}}`, `{{newEmail}}` |

Plain text versions are auto-generated by stripping HTML tags, or a
companion `.txt` file can be provided.

---

## 4. Codebase Impact Analysis

### 4.1 Files to Remove

| File | Reason |
|------|--------|
| `playground/wrangler.toml` | No longer using Wrangler/Cloudflare |
| `playground/src/worker.ts` | No longer exporting Workers handlers |
| `packages/core/src/workers/scheduled.ts` | Replaced by scheduler utility |
| `packages/core/src/workers/queue.ts` | Queue removed (inline processing) |
| `packages/core/src/workers/index.ts` | Workers barrel removed |
| `packages/core/test/workers/` | Replace with scheduler tests |

### 4.2 Files to Create

| File | Purpose |
|------|---------|
| `packages/core/src/db/connection.ts` | SQLite connection factory via better-sqlite3 |
| `packages/core/src/utils/build/scheduler.ts` | node-cron scheduler setup |
| `packages/core/src/middleware.ts` | Astro middleware injecting runtime context |
| `packages/core/src/types/context.ts` | `AppContext` interface (replaces `Env`) |
| `packages/core/src/cli/init.ts` | CLI scaffold command |
| `packages/core/src/cli/templates/` | Scaffold template files |
| `packages/core/src/templates/email/` | Default email HTML templates |
| `packages/core/src/utils/build/email-renderer.ts` | HTML template renderer with `{{var}}` |
| `docker-compose.prod.yml` | Production Docker Compose override |

### 4.3 Files to Modify (Major)

| File | Change |
|------|--------|
| `packages/core/src/types/env.d.ts` | Remove Cloudflare types, add standard env vars |
| `packages/core/src/types/options.ts` | Add `templateDir`, `databasePath`, scheduler options |
| `packages/core/src/integration.ts` | Remove page route injection, add middleware, add scheduler |
| `packages/core/index.ts` | Remove worker exports, add CLI and scheduler exports |
| `packages/core/package.json` | Add `better-sqlite3`, `node-cron`; remove CF deps; add `bin` |
| `packages/core/src/utils/build/sync.ts` | Process articles inline, remove queue enqueue |
| `packages/core/src/utils/build/auth.ts` | Change DB access from D1 to Drizzle SQLite |
| `packages/core/src/utils/build/email-service.ts` | Use file-based template renderer |
| `packages/core/src/utils/build/email-templates.ts` | Convert to HTML file reading + rendering |
| `packages/core/src/db/queries/*.ts` | Change parameter types from D1Database to Drizzle DB |
| `packages/core/src/routes/api/**/*.ts` | Change env access to `context.locals` |
| `playground/astro.config.mjs` | Switch to `@astrojs/node` adapter |
| `playground/package.json` | Replace `@astrojs/cloudflare` with `@astrojs/node` |
| `docker-compose.yml` | Add production app service, remove Wrangler concerns |

### 4.4 Files to Modify (Minor)

| File | Change |
|------|--------|
| `packages/core/src/db/schema.ts` | No changes (dialect-agnostic) |
| `packages/core/src/components/*.astro` | Minimal changes (mostly style/slot adjustments) |
| `packages/core/src/styles/tokens.css` | No changes |
| `packages/core/drizzle.config.ts` | Update driver from D1 to better-sqlite3 |

### 4.5 Test Impact

| Test Category | Count | Migration Need |
|---------------|-------|---------------|
| DB query tests (mocked D1) | ~50 | Re-mock with Drizzle SQLite |
| Route handler tests (mocked env) | ~60 | Change env access pattern |
| Auth tests (mocked better-auth) | ~20 | Minimal change (auth layer stable) |
| Email tests | ~80 | Template rendering changes |
| Client tests (jsdom) | ~20 | No change |
| Worker tests | ~10 | Replace with scheduler tests |
| Integration factory test | 1 | Update expected injected routes |
| **Total** | **~241** | |

Estimated test files requiring changes: **~20 of 24** (most need env access
pattern updates, even if the core logic is unchanged).

---

## 5. Component Architecture for Customisation

### 5.1 Composition Over Inheritance

Components must be designed for composition. A page assembles components;
components assemble sub-components. Each layer can be replaced independently.

**Example: Sign-Up Page**
```astro
---
// Developer's src/pages/auth/signup.astro
import BaseLayout from '@community-rss/core/layouts/BaseLayout.astro';
import SignUpForm from '@community-rss/core/components/SignUpForm.astro';
---
<BaseLayout title="Sign Up">
  <main>
    <h1>Join Our Community</h1>
    <SignUpForm />
  </main>
</BaseLayout>
```

Developer can customise by:
1. Wrapping `<SignUpForm>` with their own markup
2. Replacing `<SignUpForm>` entirely with their own form that POSTs to
   `/api/v1/auth/signup`
3. Using sub-components: `<SignUpForm.EmailField />`, `<SignUpForm.TermsCheckbox />`
4. Overriding messages via props: `<SignUpForm errorMessages={customMessages} />`

### 5.2 Sub-Component Pattern for Messages

Forms with complex flows (sign-in, sign-up, verification) must expose their
messaging as configurable props or named slots:

```astro
---
// SignUpForm.astro — package component
interface Props {
  messages?: {
    submitLabel?: string;
    termsLabel?: string;
    successMessage?: string;
    errorMessages?: {
      emailExists?: string;
      invalidEmail?: string;
      termsRequired?: string;
      serverError?: string;
    };
  };
}
const { messages = {} } = Astro.props;
const defaults = {
  submitLabel: 'Create Account',
  termsLabel: 'I accept the Terms of Service',
  successMessage: 'Check your email to verify your account!',
  errorMessages: {
    emailExists: 'This email is already registered. Try signing in instead.',
    invalidEmail: 'Please enter a valid email address.',
    termsRequired: 'You must accept the Terms of Service.',
    serverError: 'Something went wrong. Please try again.',
  },
};
const msgs = { ...defaults, ...messages, errorMessages: { ...defaults.errorMessages, ...messages.errorMessages } };
---
```

### 5.3 Slot-Based Layout Customisation

`BaseLayout` uses Astro named slots for structural customisation:

```astro
---
// BaseLayout.astro — package component
interface Props {
  title: string;
  description?: string;
}
---
<html>
<head>
  <slot name="head" />
  <link rel="stylesheet" href="@community-rss/core/styles/tokens.css" />
</head>
<body>
  <slot name="header">
    <!-- Default header with AuthButton -->
    <header><AuthButton /></header>
  </slot>

  <slot />  <!-- Main content -->

  <slot name="footer">
    <!-- Default footer -->
    <footer>Powered by Community RSS</footer>
  </slot>
</body>
</html>
```

Developer overrides the header:
```astro
<BaseLayout title="Home">
  <nav slot="header">
    <img src="/logo.png" alt="My Community" />
    <AuthButton />
  </nav>

  <FeedGrid />
</BaseLayout>
```

---

## 6. Email Template Architecture

### 6.1 Template Resolution

```
Developer's project          Package defaults
src/email-templates/    →    packages/core/src/templates/email/
  sign-in.html                 sign-in.html
  welcome.html                 welcome.html
  email-change.html            email-change.html
```

The email renderer checks the developer's directory first. If a template
is not found, it falls back to the package default. This means:
- Developers who don't customise emails get sensible defaults
- Developers who override one template keep defaults for everything else
- Package updates to non-overridden templates take effect automatically

### 6.2 Template Rendering

A simple `{{variable}}` replacement engine (no logic, no conditionals).
If developers need conditional logic, they override the template entirely.

```typescript
// packages/core/src/utils/build/email-renderer.ts
export function renderEmailTemplate(
  templateName: string,
  data: Record<string, string>,
  templateDir?: string,
): EmailContent {
  // 1. Resolve template file (developer's dir → package default)
  // 2. Read .html file
  // 3. Extract subject from <!--subject: ... --> comment
  // 4. Replace all {{variable}} placeholders
  // 5. Generate plain text by stripping HTML
  // 6. Return { subject, html, text }
}
```

### 6.3 Backward Compatibility

The existing `EmailTemplateFunction` type and `emailConfig.templates` override
mechanism will be preserved as an alternative to file-based templates. Developers
can choose either:
- **File-based:** Drop `.html` files in their template directory
- **Code-based:** Pass template functions via `emailConfig.templates` (existing API)

Code-based templates take priority over file-based if both exist for the same
email type.

---

## 7. Key Design Considerations

### 7.1 Runtime Context (Replacing Cloudflare Env)

The `Env` interface is deeply embedded in the codebase. Every route handler,
every DB query, every utility function references it. The migration strategy:

1. **Define `AppContext`** — a new interface replacing `Env`:
   ```typescript
   export interface AppContext {
     db: DrizzleSQLiteDatabase;
     env: EnvironmentVariables;  // string env vars
   }
   ```

2. **Astro middleware** creates the context once per request and sets
   `context.locals.app`:
   ```typescript
   // middleware.ts
   const db = createDatabase(process.env.DATABASE_PATH);
   context.locals.app = { db, env: process.env };
   ```

3. **Route handlers** access `context.locals.app` instead of
   `context.locals.runtime.env`.

4. **Utility functions** accept `AppContext` (or specific parts) instead of `Env`.

### 7.2 Database Connection Lifecycle

SQLite connections should be long-lived (unlike D1 which creates per-request).
The connection is created once when the server starts and reused across requests.
This is handled by the middleware or a module-level singleton.

### 7.3 Scheduler Lifecycle

The node-cron scheduler must start when the Astro server starts and stop
gracefully on shutdown. The integration hooks into Astro's `astro:server:start`
and `astro:server:done` hooks:

```typescript
'astro:server:start': () => {
  startScheduler(config);  // Registers cron jobs
},
'astro:server:done': () => {
  stopScheduler();  // Cleans up cron jobs
},
```

In production (built output), the scheduler is started by the Node.js entry point.

### 7.4 Route Handler Migration Pattern

Every route handler needs the same change:

**Before:**
```typescript
const env = context.locals.runtime.env as Env;
const db = drizzle(env.DB);
```

**After:**
```typescript
const { db, env } = context.locals.app as AppContext;
```

This is a mechanical change across ~15 route files.

### 7.5 Preserving the `Env` Type for Backward Compatibility

The `Env` interface is exported from `index.ts` as a public type. To avoid
a breaking change:
- **Deprecate** `Env` with a JSDoc `@deprecated` tag pointing to `AppContext`
- **Keep** `Env` as a type alias for one more release
- **Remove** in the next major version

### 7.6 CLI Scaffold Must Be Idempotent

`npx @community-rss/core init` must:
- Skip files that already exist (with a warning)
- Never overwrite developer files
- Support a `--force` flag for initial setup or reset
- Output a summary of created files

---

## 8. Risk Register (0.4.0-Specific)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Drizzle ORM D1→better-sqlite3 driver incompatibility | Query failures, data corruption | Test every query helper against in-memory SQLite before finalising |
| better-auth D1 adapter → SQLite adapter edge cases | Auth failures | better-auth natively supports better-sqlite3; CI tests verify full auth flow |
| In-process queue job loss on server restart | Missed article processing | Acceptable — next cron run re-syncs. Document this limitation. |
| Email template file resolution across package/project boundaries | Templates not found at runtime | Extensive tests for resolution logic; clear error messages when templates missing |
| CLI scaffold creating files in wrong directory | Developer confusion | Use `process.cwd()` detection; verify package.json exists; integration tests |
| SQLite concurrent write contention under load | Database locked errors | Use WAL mode; document single-writer pattern; recommend read replicas for high-traffic |
| node-cron timezone issues in Docker | Sync runs at wrong times | Use UTC explicitly; document timezone config; test in Docker |
| breaking change to `Env` type in public API | Consumers' TypeScript fails | Deprecate gradually; keep as alias; document migration path |

---

## 9. Dependency Changes

### 9.1 New Dependencies

| Package | Type | Purpose |
|---------|------|---------|
| `better-sqlite3` | dependency | SQLite driver for Node.js |
| `@types/better-sqlite3` | devDependency | TypeScript types |
| `node-cron` | dependency | Cron job scheduling |
| `@types/node-cron` | devDependency | TypeScript types |
| `@astrojs/node` | peerDependency | Astro Node.js adapter |

### 9.2 Removed Dependencies

| Package | Reason |
|---------|--------|
| `@cloudflare/workers-types` | No longer targeting Cloudflare |
| `@cloudflare/vitest-pool-workers` | No longer needed (was never fully used) |
| `wrangler` | No longer deploying to Cloudflare |
| `@astrojs/cloudflare` | Replaced by `@astrojs/node` (playground) |

### 9.3 Unchanged Dependencies

| Package | Status |
|---------|--------|
| `drizzle-orm` | ✅ Supports better-sqlite3 |
| `drizzle-kit` | ✅ Supports SQLite |
| `better-auth` | ✅ Supports better-sqlite3 natively |
| `sanitize-html` | ✅ No platform dependency |
| `cheerio` | ✅ No platform dependency |
| `@aws-sdk/client-s3` | ✅ Already used; works with MinIO |
| `msw` | ✅ Test-only, platform-agnostic |

---

## 10. `.github` Instructions Rewrite Summary

All instruction files must be updated to reflect the new architecture. Key
changes are detailed in the Implementation Plan but summarised here:

| File | Key Changes |
|------|-------------|
| `copilot-instructions.md` | Remove all Cloudflare references; add Docker/VPS context; document integration-with-overrides pattern; update anti-patterns |
| `implementation.instructions.md` | Remove Cloudflare bindings section; add AppContext pattern; add component composition rules; add email template rules |
| `api-design.instructions.md` | Remove worker exports; add CLI design rules; document page vs. API route split |
| `testing.instructions.md` | Remove D1/Miniflare references; add SQLite testing; update mock patterns |
| `test-performance.instructions.md` | Remove D1 transaction pattern; add SQLite in-memory pattern |
| `feature-plan.instructions.md` | Update template to reflect new architecture sections |
| `documentation.instructions.md` | Update to reflect developer-user focus; add CLI scaffold docs; add email template docs |

---

## 11. Documentation Rewrite Summary

The Starlight docs site must be reoriented from "contributor extending a
Cloudflare app" to "developer installing a package on a VPS":

| Section | Key Changes |
|---------|-------------|
| Getting Started / Installation | `npm install` + `npx init` + `docker-compose up` |
| Getting Started / Configuration | `.env` file instead of `wrangler.toml`; `astro.config.mjs` with `@astrojs/node` |
| Getting Started / Local Development | Docker Compose (no Wrangler); SQLite file; Mailpit |
| Getting Started / First Deployment | Docker Compose on VPS instead of Cloudflare Pages deploy |
| Guides / Feed Sync | node-cron instead of Cloudflare Cron; inline processing |
| Guides / Authentication | Same flow but without Cloudflare context |
| Guides / Email Setup | File-based templates + Mailpit/Resend |
| Guides / Theming | CSS custom properties (unchanged) + page-level customisation |
| API Reference / Integration | Updated options; no worker exports |
| API Reference / Routes | Clarify injected API vs. scaffolded pages |
| API Reference / CLI | New section for `npx @community-rss/core init` |
| Contributing / Architecture | Docker/VPS stack; no Cloudflare |

---

## 12. Release Roadmap Impact

0.4.0 absorbs the architectural refactor. All subsequent releases are pushed
back by one version number. The functionality previously planned for 0.4.0
(Interactions & Engagement) moves to 0.5.0.

| Version | Before | After |
|---------|--------|-------|
| **0.4.0** | Interactions & Engagement | **Architecture Migration** (this release) |
| **0.5.0** | Feed Submission & Author Profiles | Interactions & Engagement |
| **0.6.0** | Media Caching & Production Polish | Feed Submission & Author Profiles |
| **0.7.0** | — | Media Caching & Production Polish |

---

## 13. Success Criteria

0.4.0 is complete when:

- [ ] All 309+ existing tests pass (migrated to new architecture)
- [ ] ≥80% code coverage maintained
- [ ] `npx @community-rss/core init` scaffolds a working project
- [ ] `docker-compose up` starts the full stack (app + FreshRSS + MinIO + Mailpit)
- [ ] Sign-in/sign-up/sign-out flow works end-to-end
- [ ] Feed sync from FreshRSS works via node-cron
- [ ] Homepage displays articles
- [ ] Article modal opens with deep linking
- [ ] Admin can add feeds via API
- [ ] Email templates render correctly (file-based)
- [ ] Developer can override any page by editing scaffolded files
- [ ] Developer can override email template by editing scaffolded HTML
- [ ] `npm update @community-rss/core` updates API routes and components
   without touching developer's pages or templates
- [ ] All `.github` instruction files reflect new architecture
- [ ] All Starlight docs updated for developer-user audience
- [ ] No Cloudflare-specific code remains in `packages/core/`
- [ ] Playground demonstrates the new developer experience

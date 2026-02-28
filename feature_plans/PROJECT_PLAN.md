# Community RSS Framework — Full Project Plan

*Revised Roadmap: 0.1.0 → 0.9.0*

> **Master Requirements Document:**
> [`feature_plans/0_0_1/Community-RSS-Framework-Spec.md`](../0_0_1/Community-RSS-Framework-Spec.md)
> is the single source of truth for *what* to build.
> This plan describes *how* and *when* to implement it.
> If there is any conflict, the spec takes precedence.

> **Revision History:**
> - **v1 (0.1.0):** Initial project plan.
> - **v2 (0.4.0):** Major architecture change — Cloudflare → Docker/VPS;
>   "injected routes" → "integration with overrides". Releases 0.4.0–0.6.0
>   pushed back to 0.5.0–0.7.0. See
>   [`feature_plans/0_4_0/IMPACT_ASSESSMENT.md`](0_4_0/IMPACT_ASSESSMENT.md).
> - **v3 (0.5.0):** Architecture refinement — three-tier design tokens,
>   CSS cascade layers, Astro Actions, Server Islands, Container API email
>   pipeline, Proxy Component pattern, E2E testing with Playwright.
>   Feature releases pushed back: 0.5.0→0.6.0, 0.6.0→0.7.0, 0.7.0→0.8.0.
> - **v4 (0.6.0):** Developer Experience & Progressive Customization —
>   completes CSS overridability, introduces injected pages with
>   shadow/eject model, wires proxy pattern end-to-end, adds `eject` CLI
>   command. Feature releases pushed back: 0.6.0→0.7.0, 0.7.0→0.8.0,
>   0.8.0→0.9.0. See
>   [`feature_plans/0_6_0/IMPLEMENTATION_PLAN.md`](0_6_0/IMPLEMENTATION_PLAN.md).

## Tooling Decisions

### Testing Stack

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **Vitest** | Unit & integration test runner | Fast, native ESM, Vite-aligned. |
| **vitest/coverage-v8** | Code coverage | Native V8 coverage — fast, accurate, enforces ≥80% thresholds in CI. |
| **MSW (Mock Service Worker)** | HTTP mocking (FreshRSS API, Resend) | Intercepts outgoing HTTP at the network level. Avoids coupling tests to implementation details. |
| **@testing-library/dom** | Client-side DOM interaction tests | Lightweight, accessible-first queries for testing Hearts/Stars/Comments UI. |
| **better-sqlite3 (in-memory)** | Database testing | Real SQLite engine for accurate query testing without file I/O. |
| **Playwright** | End-to-end (E2E) testing | Multi-browser (Chromium/Firefox/WebKit), headless Docker/CI, full user-flow validation of the reference app. *(Added 0.5.0)* |

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
| **Drizzle ORM** | Database layer | Type-safe SQL with zero runtime overhead. Supports better-sqlite3. |
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
| **juice** | CSS style inlining for email HTML | Inlines CSS into element style attributes for email client compatibility. *(Added 0.5.0)* |

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
        "vitest.explorer",
        "ms-playwright.playwright"
      ]
    }
  }
}
```

---

## Monorepo Directory Structure (Target — Post-0.5.0)

```
/app (root)
 .devcontainer/
   └── devcontainer.json
 .github/
   ├── copilot-instructions.md
   ├── instructions/
   ├── prompts/
   ├── skills/
   └── workflows/ci.yml
 docker-compose.yml              # Dev stack
 docker-compose.prod.yml         # Production stack
 package.json                    # Root: workspaces, shared devDeps
 tsconfig.base.json              # Shared TS config (path aliases)
 vitest.config.ts                # Root Vitest config
 playwright.config.ts            # E2E test config (Added 0.5.0)
 eslint.config.js                # Flat ESLint config
 .prettierrc                     # Prettier config
 .node-version                   # Node 22
 feature_plans/

 e2e/                            # End-to-end tests (Added 0.5.0)
   ├── fixtures/                   # Playwright test fixtures
   ├── pages/
   │   ├── homepage.spec.ts
   │   ├── article-modal.spec.ts
   │   ├── signin.spec.ts
   │   ├── signup.spec.ts
   │   ├── verify.spec.ts
   │   ├── profile.spec.ts
   │   └── terms.spec.ts
   ├── flows/
   │   ├── auth-flow.spec.ts
   │   ├── guest-consent.spec.ts
   │   └── article-browsing.spec.ts
   └── helpers/
       ├── seed.ts                 # E2E database seeding
       └── auth.ts                 # E2E auth helpers

 packages/
   └── core/
       ├── package.json            # @community-rss/core
       ├── index.ts                # Public API surface
       ├── tsconfig.json           # Extends base, adds path aliases
       ├── vitest.config.ts        # Core-specific Vitest config
       ├── drizzle.config.ts       # Drizzle-kit config (better-sqlite3)
       └── src/
           ├── integration.ts      # Astro integration factory
           ├── middleware.ts        # Injects AppContext into locals
           ├── config-store.ts     # GlobalThis config bridge
           ├── actions/            # Astro Action handler exports (Added 0.5.0)
           │   └── index.ts        # Action definitions for articles, auth, profile
           ├── cli/
           │   ├── init.ts         # npx @community-rss/core init
           │   └── templates/      # Scaffold templates (pages, emails, config, actions)
           ├── templates/
           │   └── email/          # Default email .astro components (Added 0.5.0)
           ├── types/
           │   ├── context.ts      # AppContext, EnvironmentVariables
           │   ├── env.d.ts        # DEPRECATED — alias for context types
           │   ├── options.ts      # CommunityRssOptions interface
           │   ├── models.ts       # Domain model interfaces
           │   └── email.ts        # Email system interfaces
           ├── db/
           │   ├── connection.ts   # SQLite connection factory
           │   ├── schema.ts       # Drizzle ORM schema (single source of truth)
           │   ├── seed.ts         # System User seeder
           │   ├── migrations/     # Auto-generated by drizzle-kit
           │   └── queries/        # Query modules (users, feeds, articles, etc.)
           ├── utils/
           │   ├── build/          # Node.js context (server-side)
           │   │   ├── scheduler.ts
           │   │   ├── sync.ts
           │   │   ├── freshrss-client.ts
           │   │   ├── article-processor.ts
           │   │   ├── auth.ts
           │   │   ├── guest.ts
           │   │   ├── admin-feeds.ts
           │   │   ├── email.ts
           │   │   ├── email-service.ts
           │   │   ├── email-renderer.ts     # Container API renderer (Refactored 0.5.0)
           │   │   ├── email-templates.ts     # Fallback code-based templates
           │   │   └── email-transports.ts
           │   ├── client/         # Browser context
           │   │   ├── guest.ts
           │   │   ├── modal.ts
           │   │   └── infinite-scroll.ts
           │   └── shared/         # Pure functions
           ├── components/         # Astro components (exported for consumer use)
           ├── layouts/            # Astro layouts (exported for consumer use)
           ├── routes/             # Injected API routes ONLY (no pages)
           │   └── api/
           │       ├── auth/[...all].ts
           │       ├── dev/seed.ts
           │       └── v1/
           └── styles/             # Refactored 0.5.0
               ├── layers.css      # @layer declarations and base resets
               └── tokens/
                   ├── reference.css    # Raw values (palette, scale, typography)
                   ├── system.css       # Semantic mappings (primary, bg, success)
                   └── components.css   # Component-scoped overrides
       └── test/
           ├── fixtures/
           ├── utils/
           ├── db/
           ├── routes/
           ├── cli/
           ├── integration/
           └── middleware.test.ts

 playground/
   ├── package.json
   ├── astro.config.mjs            # @astrojs/node + communityRss()
   ├── .env.example
   ├── Dockerfile                  # Multi-stage production build
   └── src/
       ├── actions/                # Scaffolded Astro Actions (Added 0.5.0)
       │   └── index.ts
       ├── pages/                  # Developer-owned pages (scaffolded)
       │   ├── index.astro
       │   ├── article/[id].astro
       │   ├── auth/
       │   ├── profile.astro
       │   └── terms.astro
       ├── email-templates/        # Developer-owned email templates
       │   ├── sign-in.html
       │   ├── welcome.html
       │   └── email-change.html
       └── styles/
           └── theme.css           # CSS overrides

 docs/
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

### Release 0.4.0 — Architecture Migration ✅ COMPLETE

**Goal:** Migrate from Cloudflare-specific infrastructure to self-hosted
Docker/VPS stack. Transform developer model from "injected routes" to
"integration with overrides" — package provides API routes and components,
developers own pages and email templates.

**Key Milestone:** `docker-compose up` starts full stack; developer runs
`npx @community-rss/core init` to scaffold pages; all existing tests pass;
80% coverage maintained; no Cloudflare-specific code remains.

**Impact Assessment:** See
[`feature_plans/0_4_0/IMPACT_ASSESSMENT.md`](0_4_0/IMPACT_ASSESSMENT.md).

See [0.4.0 Implementation Plan](0_4_0/IMPLEMENTATION_PLAN.md).

---

### Release 0.5.0 — Architecture Refinement (NEW)

**Goal:** Adopt best-of-breed architectural principles without adding new
user-facing functionality. Refactor styling to a three-tier design token
system with CSS cascade layers. Introduce Astro Actions, Server Islands,
and Container API email pipeline. Add comprehensive E2E testing with
Playwright. Update AI guidance files and documentation.

**Key Milestone:** The application looks and behaves identically to 0.4.0.
All existing unit tests pass (updated for new patterns). New E2E test suite
validates every page and user flow. ≥80% unit coverage maintained.

**Spec Reference:** Sections 5.8–5.14, 7.1, 8.1–8.3 of the
[Framework Spec](0_0_1/Community-RSS-Framework-Spec.md).

See [0.5.0 Implementation Plan](0_5_0/IMPLEMENTATION_PLAN.md).

#### Phase 1: Three-Tier Design Token System
- [ ] Split `tokens.css` into `tokens/reference.css`, `tokens/system.css`,
      `tokens/components.css`
- [ ] Create `layers.css` with `@layer` declarations
- [ ] Migrate all component `<style>` blocks to reference new token hierarchy
- [ ] Use `injectScript('page-ssr')` to inject token CSS into every page
      automatically via the Integration API
- [ ] Set middleware `order: 'pre'` so auth and `Astro.locals.app` are
      populated before user-defined code runs
- [ ] Update `theme.css` scaffold template for consumers
- [ ] Test: visual regression — pages render identically
- [ ] Update documentation: CSS token reference

#### Phase 2: CSS Cascade Layers
- [ ] Define layer order: crss-reset, crss-tokens, crss-base,
      crss-components, crss-utilities
- [ ] Wrap framework styles in appropriate `@layer` blocks
- [ ] Ensure `injectScript('page-ssr')` injects layers.css before token CSS
- [ ] Verify consumer `theme.css` overrides work without specificity issues
- [ ] Test: layer cascade ordering

#### Phase 3: Astro Actions
- [ ] Create action handler exports in `packages/core/src/actions/`
- [ ] Define actions: `fetchArticles`, `checkEmail`, `submitSignup`,
      `updateProfile`, `changeEmail`, `confirmEmailChange`
- [ ] Add `src/actions/index.ts` to CLI scaffold templates
- [ ] Refactor client-side `fetch()` calls in `utils/client/` to use
      Actions where applicable
- [ ] Update scaffolded pages to use Actions
- [ ] Test: Action handler unit tests
- [ ] Maintain backward-compatible API routes

#### Phase 4: Server Islands
- [ ] Refactor `AuthButton.astro` to use `server:defer` directive
- [ ] Add server island fallback/placeholder for auth-dependent UI
- [ ] Update homepage CTA to use server island pattern
- [ ] Test: pages load with auth-dependent UI streaming
- [ ] Verify SSR fallback works correctly

#### Phase 5: Container API Email Pipeline
- [ ] Create `.astro` email template components in `packages/core/src/templates/email/`
- [ ] Implement Container API renderer in `email-renderer.ts`
- [ ] Add CSS style inlining via `juice` post-processing
- [ ] Add token-to-value resolution: parse CSS custom properties and replace
      `var()` references with concrete values before inlining (email clients
      do not support CSS custom properties)
- [ ] Use `@{{ }}` escape syntax in `.astro` templates for Handlebars-style
      placeholders to prevent Astro compiler evaluation
- [ ] Use Wrapper component pattern (single default slot) to avoid nested
      slot stripping by the Container API
- [ ] Update email resolution chain: developer .astro → package .astro →
      developer .html → package .html → code fallback
- [ ] Update CLI scaffold email templates to use `.astro` format
- [ ] Test: email rendering produces valid inlined HTML
- [ ] Verify: all three email types render correctly (sign-in, welcome,
      email-change)

#### Phase 6: Proxy Component Architecture Refinement
- [ ] Audit all 8 components for logic-vs-presentation separation
- [ ] Extract inline logic to `utils/` where found
- [ ] Ensure all components use CSS custom properties exclusively
- [ ] Add component-scoped tokens (`--crss-comp-*`) for each component
- [ ] Verify all components work with default and overridden tokens
- [ ] Update scaffold templates to demonstrate thin wrapper pattern:
      import core component, own `<style>`, pass messages — no business
      logic in scaffold wrappers

#### Phase 7: E2E Testing with Playwright
- [ ] Install Playwright and configure `playwright.config.ts`
- [ ] Create E2E fixtures (seed data, auth helpers)
- [ ] Write page tests: homepage, article modal, sign-in, sign-up, verify,
      profile, terms
- [ ] Write flow tests: auth flow, guest consent, article browsing
- [ ] Configure CI workflow for Playwright (headless, multi-browser)
- [ ] Add `npm run test:e2e` script

#### Phase 8: AI Guidance Updates
- [ ] Rewrite `.github/copilot-instructions.md` with new architecture
      patterns (tokens, layers, Actions, Server Islands)
- [ ] Update all `.github/instructions/*.md` files
- [ ] Add "Protected Areas" rules to all AI guidance: never modify
      `node_modules/`, never fork core package, never hand-edit injected
      API routes
- [ ] Create framework-user AI guidance for GitHub Copilot:
      scaffold `src/cli/templates/.github/copilot-instructions.md`
- [ ] Create framework-user AI guidance for Cursor IDE:
      scaffold `src/cli/templates/.cursor/rules/community-rss.mdc`
      (`.mdc` format with `globs:` file-pattern scoping)
- [ ] Update `.github/skills/feature-implementation/SKILL.md`

#### Phase 9: Documentation Updates
- [ ] Update CSS token reference docs with three-tier system
- [ ] Create architecture decisions guide (adopted vs deferred)
- [ ] Update customisation guide for new token hierarchy
- [ ] Document Astro Actions usage for consumers
- [ ] Update contributing docs with new patterns
- [ ] Update email template guide for Container API

#### Phase 10: Test Migration & Coverage
- [ ] Update all existing Vitest tests for new token/style patterns
- [ ] Verify all 309+ unit/integration tests pass
- [ ] Verify ≥80% coverage on all metrics
- [ ] E2E tests pass on Chromium, Firefox, WebKit
- [ ] Full end-to-end smoke test: pages render, auth works, articles load

---

### Release 0.6.0 — Developer Experience & Progressive Customization (NEW)

**Goal:** Complete the framework's customization architecture by fixing
CSS overridability, implementing progressive customization (injected
pages with shadow/eject), wiring the proxy component pattern end-to-end,
redesigning the actions scaffold, and shipping an `eject` CLI command.

**Key Milestone:** A freshly-initialized project consists of
`astro.config.mjs`, `.env`, `theme.css`, signpost READMEs, and
`src/actions/index.ts`. The framework injects all pages by default.
CSS class-level overrides work without `!important`. All Tier 3
component tokens are functional. All existing tests pass. ≥80% coverage.

**Consolidates:**
[`css-overridability/IMPACT_ASSESSMENT.md`](0_6_0/css-overridability/IMPACT_ASSESSMENT.md),
[`progressive-customisation/Progressive Customization Strategy.md`](0_6_0/progressive-customisation/Progressive%20Customization%20Strategy.md),
[`scaffold-shadow-proxies/IMPACT_ASSESSMENT.md`](0_6_0/scaffold-shadow-proxies/IMPACT_ASSESSMENT.md).

See [0.6.0 Implementation Plan](0_6_0/IMPLEMENTATION_PLAN.md).

#### Phase 0: Technical Spikes
- [ ] Actions spike: test `coreActions` spread with standard `zod` vs `astro:schema`
- [ ] Document decision for Phase 7

#### Phase 1: CSS Overridability — Global Layered Styles
- [ ] Migrate all 8 component `<style>` blocks to `<style is:global>` + `@layer crss-components`
- [ ] Remove FeedCard `:global()` duplicate block
- [ ] Visual regression: pages render identically

#### Phase 2: Wire Tier 3 Component Tokens
- [ ] Replace hardcoded/flat-token values with `--crss-comp-*` tokens in all components
- [ ] Add missing tokens to `components.css` (CTA, header, nav, form max-width)
- [ ] Token audit: every defined token consumed, no dead tokens

#### Phase 3: Remove Hardcoded Values
- [ ] Replace all hardcoded colours, opacities, widths, transitions with token references

#### Phase 4: Conditional Page Injection
- [ ] Move page templates into core `src/pages/` (injectable route entrypoints)
- [ ] Implement conditional `injectRoute()` with `fs.existsSync()` check
- [ ] Add `./pages/*` to `package.json` exports

#### Phase 5: CLI Scaffold Redesign (`init`)
- [ ] Remove page and component entries from `FILE_MAP`
- [ ] Add signpost README templates for `src/pages/`, `src/components/`, `src/layouts/`
- [ ] Minimal scaffold: config, theme.css, actions, email templates, READMEs, AI guidance

#### Phase 6: `eject` CLI Command
- [ ] Create `eject` command: `pages/<name>`, `components/<name>`, `layouts/<name>`, `actions`
- [ ] Import rewriting for ejected files
- [ ] Register CLI entry point (`npx crss eject`)

#### Phase 7: Actions Redesign
- [ ] Spike result → `coreActions` spread (7a) or improved copy (7b)
- [ ] Update scaffold template with extension point for custom actions

#### Phase 8: Theme.css Improvements
- [ ] Add Level 4 (class-level) override examples
- [ ] Improve token override examples

#### Phase 9: Testing for 0.6.0
- [ ] CSS specificity tests (consumer CSS beats layered framework CSS)
- [ ] Token wiring tests (automated `components.css` audit)
- [ ] Conditional injection tests (mock filesystem)
- [ ] CLI `init` tests (minimal scaffold verification)
- [ ] CLI `eject` tests (all targets, import rewriting, force flag)
- [ ] E2E regression: all pages via injection, ejected page works
- [ ] Verify ≥80% coverage maintained

#### Phase 10: Documentation for 0.6.0
- [ ] Progressive Customization guide (4-level hierarchy)
- [ ] Updated CSS Overrides / Styling guide
- [ ] Updated CLI reference (eject command)
- [ ] Component tokens reference (complete Tier 3 inventory)

#### Phase 11: `.github` Instruction & AI Guidance Updates
- [ ] Update `copilot-instructions.md` with progressive customization patterns
- [ ] Update `instructions/*.instructions.md` files
- [ ] Update scaffolded AI guidance (Copilot + Cursor) for framework consumers

#### Phase 12: Playground Reset & Smoke Test
- [ ] Update reset script for new minimal scaffold
- [ ] Full regression: all pages, eject workflow, CSS overrides, E2E suite

---

### Release 0.7.0 — Interactions & Engagement

> **Previously 0.6.0** — pushed back due to DX & progressive customization release.

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
- [ ] Create Astro Actions for interactions
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
- [ ] Add comment moderation email template (`.astro` component)
- [ ] Test: comment util, DB query, and route handler tests

#### Phase 3: Hearts/Stars/Comments UI
- [ ] Create `packages/core/src/utils/client/interactions.ts`
  - `handleHeart()`, `handleStar()` — optimistic UI + API call
- [ ] Create `HeartButton.astro`, `StarButton.astro`, `CommentSection.astro`,
  `CommentForm.astro` components with configurable props
- [ ] Update `FeedCard.astro` with heart/star counts
- [ ] Update `ArticleModal.astro` with comments section
- [ ] Update CLI scaffold templates to include new components
- [ ] Test: client interaction tests + E2E tests

#### Phase 4: Tabbed Homepage Views
- [ ] Create `packages/core/src/utils/shared/scoring.ts` — trending score
- [ ] Create `packages/core/src/db/queries/trending.ts`, `following.ts`
- [ ] Create articles API variants: `/following`, `/trending`, `/starred`
- [ ] Update `TabBar.astro` to activate all tabs
- [ ] Update CLI scaffold homepage template to include all tabs
- [ ] Test: scoring, trending, following tests + E2E tab tests

#### Phase 5: Admin Configuration
- [ ] Add `trending` config to `CommunityRssOptions`
- [ ] Enforce `commentTier` in comment submission route
- [ ] Test: admin config integration tests

#### Phase 6: Documentation for 0.7.0
- [ ] API reference: interactions, comments, trending endpoints
- [ ] Guide: Configuring comment permissions
- [ ] Guide: Customising trending algorithm weights
- [ ] Guide: Moderation workflow (author email flow)

#### Phase 7: Tests & Coverage for 0.7.0
- [ ] Integration tests: heart → trending, comment → email → moderate
- [ ] E2E tests: interaction flows, comment submission, tab navigation
- [ ] Verify ≥80% coverage maintained

---

### Release 0.8.0 — Feed Submission & Author Profiles

> **Previously 0.7.0** — pushed back due to DX & progressive customization release.

**Goal:** Verified authors can submit and manage RSS feeds.
Author profile pages with follow functionality.

#### Phase 1: Feed Submission
- [ ] Create `src/utils/build/feed-submission.ts`
  - `submitFeed()`, `validateFeedUrl()`, `parseFeedMetadata()`
- [ ] Create `src/routes/api/v1/feeds.ts` — CRUD
- [ ] Create Astro Actions for feed operations
- [ ] Create `FeedSubmitForm.astro` component
- [ ] Update CLI scaffold with feed submission page template
- [ ] Test: feed submission tests

#### Phase 2: Domain Verification
- [ ] Create `src/utils/build/verification.ts`
  - `generateVerificationCode()`, `checkDomainVerification()`,
    `markDomainVerified()`
- [ ] Create `src/routes/api/v1/verification.ts` — initiate/check/status
- [ ] Create `src/db/queries/verified-domains.ts`
- [ ] Create `VerificationFlow.astro` component
- [ ] Test: verification tests

#### Phase 3: Author Profiles
- [ ] Create author profile API routes
- [ ] Create `AuthorCard.astro`, `FollowButton.astro` components
- [ ] Create `src/routes/api/v1/follow.ts`
- [ ] Update CLI scaffold with author profile page template
- [ ] Test: author and follow tests + E2E tests

#### Phase 4: Feed Management & Cascading Deletion
- [ ] Create `src/utils/build/feed-management.ts` — cascading delete
- [ ] Feed limit enforcement via `maxFeeds` option
- [ ] Media cleanup job for S3 (MinIO) objects
- [ ] Test: cascading deletion tests

#### Phase 5: Legal Consent
- [ ] Create `LegalConsent.astro` component
- [ ] Test: consent tests

#### Phase 6: Documentation for 0.8.0
- [ ] Guide: Feed submission and verification flow
- [ ] API reference: feeds, verification, authors, follow endpoints

#### Phase 7: Tests & Coverage for 0.8.0
- [ ] Integration tests: submit → verify → publish, delete → cascade
- [ ] E2E tests: feed submission flow, author profile, follow
- [ ] Verify ≥80% coverage maintained

---

### Release 0.9.0 — Media Caching & Production Polish

> **Previously 0.8.0** — pushed back due to DX & progressive customization release.

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

#### Phase 4: Documentation for 0.9.0
- [ ] Guide: Image caching pipeline
- [ ] Guide: Advanced theming
- [ ] Guide: Production hardening (rate limiting, caching, monitoring)
- [ ] Guide: Backup and restore (SQLite + MinIO data)

#### Phase 5: Tests & Coverage for 0.9.0
- [ ] Integration tests: sync → image cache → S3 → rewritten HTML
- [ ] Performance test: image caching with 50+ images
- [ ] E2E tests: image rendering, theme switching
- [ ] Verify ≥80% coverage across entire codebase
- [ ] Full end-to-end smoke test with all features

---

## Testing Strategy (Cross-Release)

### Test Organisation

```
packages/core/test/
 fixtures/
   ├── articles.ts          # Mock article data
   ├── feeds.ts             # Mock feed data
   ├── users.ts             # Mock user data
   ├── context.ts           # Mock AppContext factory
   ├── interactions.ts      # Mock heart/star/comment data
   ├── freshrss-responses.ts # Mock FreshRSS API payloads
   ├── html-content.ts      # Sample RSS HTML for sanitisation tests
   └── email.ts             # Email template fixtures
 utils/
   ├── build/
   │   ├── freshrss-client.test.ts
   │   ├── sync.test.ts
   │   ├── article-processor.test.ts
   │   ├── scheduler.test.ts
   │   ├── auth.test.ts
   │   ├── email.test.ts
   │   ├── email-renderer.test.ts
   │   ├── email-service.test.ts
   │   ├── email-templates.test.ts
   │   ├── email-transports.test.ts
   │   ├── guest.test.ts
   │   ├── admin-feeds.test.ts
   │   ├── comments.test.ts           # 0.7.0
   │   ├── feed-submission.test.ts    # 0.8.0
   │   ├── verification.test.ts       # 0.8.0
   │   ├── feed-management.test.ts    # 0.8.0
   │   ├── image-cache.test.ts        # 0.9.0
   │   └── theme.test.ts             # 0.9.0
   ├── client/
   │   ├── modal.test.ts
   │   ├── infinite-scroll.test.ts
   │   ├── guest.test.ts
   │   └── interactions.test.ts       # 0.7.0
   └── shared/
       ├── scoring.test.ts            # 0.7.0
       └── interactions.test.ts       # 0.7.0
 actions/                           # 0.5.0
   └── index.test.ts
 db/
   ├── connection.test.ts
   ├── seed.test.ts
   └── queries/
       ├── articles.test.ts
       ├── feeds.test.ts
       ├── users.test.ts
       ├── pending-signups.test.ts
       ├── interactions.test.ts       # 0.7.0
       ├── comments.test.ts           # 0.7.0
       ├── followers.test.ts          # 0.8.0
       ├── verified-domains.test.ts   # 0.8.0
       ├── trending.test.ts           # 0.7.0
       └── media.test.ts             # 0.9.0
 routes/
   └── api/
       ├── auth/catch-all.test.ts
       └── v1/
           ├── articles.test.ts
           ├── auth/
           │   ├── check-email.test.ts
           │   └── signup.test.ts
           ├── profile.test.ts
           ├── profile/
           │   ├── change-email.test.ts
           │   └── confirm-email-change.test.ts
           ├── interactions.test.ts       # 0.7.0
           ├── comments.test.ts           # 0.7.0
           ├── feeds.test.ts              # 0.8.0
           ├── verification.test.ts       # 0.8.0
           ├── authors.test.ts            # 0.8.0
           ├── follow.test.ts             # 0.8.0
           └── admin/
               ├── feeds.test.ts
               └── config.test.ts         # 0.7.0
 cli/
   └── init.test.ts
 middleware.test.ts
 integration/
    ├── integration-factory.test.ts
    ├── sync-pipeline.integration.test.ts
    ├── auth-flow.integration.test.ts
    ├── guest-migration.integration.test.ts
    ├── interaction-flow.integration.test.ts       # 0.7.0
    ├── comment-moderation.integration.test.ts     # 0.7.0
    ├── feed-lifecycle.integration.test.ts         # 0.8.0
    ├── image-caching.integration.test.ts          # 0.9.0
    └── trending-scoring.integration.test.ts       # 0.7.0

e2e/                                               # 0.5.0
 fixtures/
   ├── seed.ts
   └── auth.ts
 pages/
   ├── homepage.spec.ts
   ├── article-modal.spec.ts
   ├── signin.spec.ts
   ├── signup.spec.ts
   ├── verify.spec.ts
   ├── profile.spec.ts
   └── terms.spec.ts
 flows/
    ├── auth-flow.spec.ts
    ├── guest-consent.spec.ts
    └── article-browsing.spec.ts
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
| E2E tests via Playwright | Full user-flow validation in real browser *(Added 0.5.0)* |
| E2E tests complement unit tests | E2E validates assembled app; unit validates logic in isolation *(Added 0.5.0)* |

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

### Playwright Configuration *(Added 0.5.0)*

```typescript
// playwright.config.ts (root)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev -w playground',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Documentation Strategy (Cross-Release)

### Starlight Site Structure (Post-0.5.0)

```
docs/src/content/docs/
 index.mdx                         # Landing page
 getting-started/
   ├── installation.md               # npm install + npx init
   ├── configuration.md              # .env + astro.config.mjs options
   ├── local-development.md          # Docker Compose dev setup
   └── deployment.md                 # Docker Compose on VPS
 api-reference/
   ├── integration.md                # communityRss() factory
   ├── options.md                    # Full options table with @since
   ├── routes.md                     # All /api/v1/ endpoints (injected)
   ├── actions.md                    # Astro Actions reference (0.5.0)
   ├── cli.md                        # npx @community-rss/core init
   ├── components.md                 # Exported components reference
   └── css-tokens.md                 # Three-tier design token reference
 guides/
   ├── customisation.md              # Pages, components, emails, themes
   ├── progressive-customisation.md  # 4-level hierarchy, eject workflow (0.6.0)
   ├── feed-sync.md                  # node-cron sync architecture
   ├── authentication.md             # Magic link + guest flow
   ├── email-setup.md               # Templates + Mailpit/Resend
   ├── architecture.md               # Adopted/deferred principles (0.5.0)
   ├── styling.md                    # Token tiers, @layer, overrides (0.5.0)
   ├── interactions.md               # Hearts, Stars, Comments (0.7.0)
   ├── moderation.md                 # Comment moderation (0.7.0)
   ├── feed-submission.md            # Submit + verify feeds (0.8.0)
   ├── trending.md                   # Trending algorithm config (0.7.0)
   ├── image-caching.md              # Media pipeline (0.9.0)
   └── theming.md                    # CSS token override guide
 contributing/
   ├── setup.md                      # Dev environment (Docker)
   ├── architecture.md               # AppContext, composition, overrides
   ├── testing.md                    # Vitest + Playwright patterns
   ├── coding-standards.md           # Import aliases, component rules
   └── release-process.md           # SemVer, branching, publishing
 reference/
    └── database-schema.md            # Full SQLite schema reference
```

---

## Implementation Order & Milestones

| Release | Core Deliverable | Key Milestone |
|---------|-----------------|---------------|
| **0.1.0** ✅ | Foundation & Scaffold | Monorepo, integration skeleton, schema, docs |
| **0.2.0** ✅ | Feed Sync & Reader | Articles sync from FreshRSS, display in grid |
| **0.3.0** ✅ | Auth, Users & Admin Feeds | Magic link, guest consent, profiles, admin feeds |
| **0.4.0** ✅ | Architecture Migration | Docker/VPS, integration-with-overrides, CLI scaffold |
| **0.5.0** 🔄 | **Architecture Refinement** | Three-tier tokens, @layer, Actions, Server Islands, Container API emails, Playwright E2E |
| **0.6.0** | **DX & Progressive Customization** | CSS overridability, injected pages, eject CLI, proxy wiring, actions redesign |
| **0.7.0** | Interactions & Engagement | Hearts, Stars, Comments, Trending, Following |
| **0.8.0** | Feed Submission & Author Profiles | Domain verification, author pages, follow |
| **0.9.0** | Media Caching & Production Polish | Image pipeline, themes, accessibility, hardening |

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

### Three-Tier Token System (0.5.0+)

**Principle:** CSS custom properties follow a Reference → System → Component
hierarchy (see Spec §5.8). This allows consumers to theme at three
granularity levels:

- Override a reference token to change a colour globally: `--crss-ref-indigo-500`
- Override a system token to remap brand meaning: `--crss-sys-color-primary`
- Override a component token for surgical adjustment: `--crss-comp-btn-bg`

**Automatic Injection:** Token and layer CSS is injected into every page via
`injectScript('page-ssr')` in the Integration API — developers never need
to manually import CSS files into their layouts.

### CSS Cascade Layers (0.5.0+)

**Principle:** Consumer stylesheets always win over framework styles. The
`@layer` directive ensures this without requiring `!important` or specificity
hacks (see Spec §5.9).

### Astro Actions Pattern (0.5.0+)

**Principle:** Client-side code calls typed Actions instead of constructing
fetch URLs manually. The API routes remain as the HTTP interface; Actions
provide a type-safe wrapper. Actions are scaffolded (developer-owned) and
delegate to core handler exports.

### Server Islands Pattern (0.5.0+)

**Principle:** Auth-dependent UI uses `server:defer` to avoid blocking the
initial page load. The static HTML shell loads instantly; personalised
content streams in asynchronously. See Spec §5.11.

### Container API Email Pipeline (0.5.0+)

**Principle:** Email templates are `.astro` components rendered to static
HTML via the Container API, then post-processed with `juice` for CSS
inlining. This replaces the `{{variable}}` HTML template system for
new templates while maintaining backward compatibility with existing
HTML templates. See Spec §5.12.

**Implementation Caveats:**
- Use `@{{ }}` escape syntax to prevent Astro compiler from evaluating
  Handlebars-style placeholders as JavaScript expressions.
- CSS custom properties (`var(--crss-*)`) must be resolved to concrete
  values before inlining — email clients do not support `var()`.
- Use a single default slot in `EmailLayout.astro` to avoid nested slot
  stripping by the Container API's `renderToString()`.

### Middleware Ordering (0.5.0+)

**Principle:** The integration’s middleware runs with `order: 'pre'` to
ensure that authentication state and `Astro.locals.app` (providing `db`,
`env`, `config`) are populated before any user-defined middleware or page
code executes. This guarantees that consumer pages can always rely on
`context.locals.app` being available.

### Progressive Customization Model (0.6.0+)

**Principle:** The framework injects all pages by default via Astro's
`injectRoute()`. A `fs.existsSync()` check in `astro:config:setup`
skips injection when a developer has a local file at the expected path.
Developers "eject" specific files via `npx crss eject <target>` to take
ownership — the CLI copies the source from the package, rewrites imports
to point to local proxies, and places it in the developer's `src/`.

**Customization hierarchy:** CSS tokens/classes (Level 1) → Page shadows
(Level 2) → Component proxies (Level 3) → Custom API/Actions (Level 4).
Levels 1–3 are safe and documented. Level 4 is the "bespoke" threshold.

**Minimal scaffold:** `npx @community-rss/core init` produces only:
config files, `theme.css`, `src/actions/index.ts`, email templates,
signpost READMEs, and AI guidance. No page files — pages are injected.

### CLI Scaffold Upgrade Strategy

**Principle:** As the framework evolves, scaffolded files may need updates.
The `npx crss eject <target>` command (0.6.0+) gives developers a safe
mechanism to refresh ejected files while preserving customizations.
Post-1.0.0, a `diff` / `update` CLI command will be implemented (similar
to shadcn/ui's approach) to let developers compare their local
modifications against the latest version before selectively applying
changes.

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
| Astro Container API experimental stability | API changes in Astro minor versions | Pin Astro version; wrap Container API in adapter layer; fallback to HTML templates *(Added 0.5.0)* |
| CSS @layer browser support gaps | Older browsers ignore layers | 97%+ support as of 2026; provide unlayered fallback guidance *(Added 0.5.0)* |
| Astro Actions API changes | Breaking changes in Astro minor versions | Actions are scaffolded (developer-owned); easy to update *(Added 0.5.0)* |
| Server Islands performance overhead | Additional server round-trip per island | Minimal — auth check is fast; cache session lookups *(Added 0.5.0)* |
| Three-tier token migration complexity | Component styles break during refactor | Phase incrementally; visual regression testing via Playwright *(Added 0.5.0)* |
| Container API nested slot stripping | Email HTML structure corrupted | Use Wrapper component with single default slot; test rendered output *(Added 0.5.0)* |
| CSS custom properties in email clients | `var()` not supported by most email clients | Resolve tokens to concrete values before `juice` inlining *(Added 0.5.0)* |
| Scaffold file drift after updates | Developer's scaffolded files diverge from latest templates | `eject` CLI (0.6.0+) lets developers refresh ejected files; plan CLI `diff`/`update` command pre-1.0.0 *(Updated 0.6.0)* |
| Injected page route collisions | Astro warns when local file shadows injected route | `fs.existsSync()` check prevents injection when local file exists *(Added 0.6.0)* |
| `eject` import rewriting edge cases | Ejected file has broken imports if regex misses a pattern | Comprehensive regex tests; manual fixup documented for edge cases *(Added 0.6.0)* |
| Pre-0.6.0 projects confused by new model | Developer uncertainty on upgrade path | Clear migration guide; existing scaffolded files shadow injected routes automatically (no breakage) *(Added 0.6.0)* |
| `coreActions` spread `astro:schema` compat | Actions redesign may be blocked | Early spike; improved-copy fallback ready *(Added 0.6.0)* |
| Global component styles class name collision | Style bleed between components | BEM naming with `crss-` prefix; same as Bootstrap/Tailwind *(Added 0.6.0)* |

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
  "@playwright/test": "^1.50.0",
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
    "node-cron": "^3.0.0",
    "juice": "^11.0.0"
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

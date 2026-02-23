# Release 0.1.0 — Foundation & Scaffold

## Overview

**Goal:** Working monorepo with integration skeleton, database schema, design
token system, testing infrastructure, and documentation site. No user-facing
functionality yet — this is the platform upon which everything else is built.

**Key Milestone:** `npm run dev` starts playground + docs; CI green; D1 schema
applied; `npm run test` passes with ≥80% coverage on all new code.

**Spec Reference:** Sections 5.1 (NPM Package), 5.2 (Infrastructure), 5.5
(Database Schema), 5.6 (Route Injection), 6 (Data Model), 7 (Developer
Experience) of the [Framework Spec](../0_0_1/Community-RSS-Framework-Spec.md).

## Codebase Review

### Existing Files
- `/app/docker-compose.yml` — needs port 4322 added for docs
- `/app/.github/workflows/ci.yml` — needs docs build step added
- `/app/.github/copilot-instructions.md` — needs Drizzle, better-auth, Starlight references
- `/app/.gitignore` — needs Astro/Wrangler/Drizzle ignores

### New Files to Create

#### Root
- `package.json` — workspaces config, shared devDeps, scripts
- `.node-version` — Node 22
- `tsconfig.base.json` — shared TS config with strict mode
- `vitest.config.ts` — root workspace-mode config
- `eslint.config.js` — flat ESLint 9 config
- `.prettierrc` — Prettier config
- `.prettierignore` — Prettier ignore patterns
- `.devcontainer/devcontainer.json` — Dev Container configuration

#### `packages/core/`
- `package.json` — `@community-rss/core` with dependencies
- `index.ts` — public API surface
- `tsconfig.json` — extends base, adds path aliases
- `vitest.config.ts` — core-specific Vitest config
- `drizzle.config.ts` — drizzle-kit configuration
- `src/integration.ts` — Astro integration factory
- `src/types/options.ts` — `CommunityRssOptions` interface
- `src/types/env.d.ts` — Cloudflare `Env` interface
- `src/types/models.ts` — domain model interfaces
- `src/db/schema.ts` — full Drizzle ORM schema
- `src/db/queries/` — empty query module stubs
- `src/styles/tokens.css` — CSS design tokens
- `src/layouts/BaseLayout.astro` — base layout with token stylesheet
- `src/routes/api/v1/health.ts` — health check stub route
- `src/workers/scheduled.ts` — stub `scheduled` handler
- `src/workers/queue.ts` — stub `queue` consumer
- `test/fixtures/articles.ts` — mock article data
- `test/fixtures/feeds.ts` — mock feed data
- `test/fixtures/users.ts` — mock user data
- `test/integration/integration-factory.test.ts`
- `test/types/options.test.ts`
- `test/db/schema.test.ts`

#### `playground/`
- `package.json` — with `@community-rss/core: "*"` dependency
- `astro.config.mjs` — consuming the integration
- `wrangler.toml` — D1, R2, Queue bindings
- `.dev.vars.example` — env vars template
- `src/pages/index.astro` — minimal shell page
- `tsconfig.json` — TypeScript config

#### `docs/`
- `package.json` — `@community-rss/docs` (private)
- `astro.config.mjs` — Starlight configuration
- `tsconfig.json` — TypeScript config
- `src/content/docs/index.mdx` — landing page
- `src/content/docs/getting-started/installation.md`
- `src/content/docs/getting-started/configuration.md`
- `src/content/docs/getting-started/local-development.md`
- `src/content/docs/api-reference/integration.md`
- `src/content/docs/api-reference/options.md`
- `src/content/docs/contributing/setup.md`
- `src/content/docs/contributing/architecture.md`
- `src/content/docs/contributing/testing.md`

### Dependencies

#### Root `devDependencies`
| Package | Purpose |
|---------|---------|
| `eslint` ^9.0.0 | Linting |
| `@typescript-eslint/eslint-plugin` ^8.0.0 | TS linting rules |
| `@typescript-eslint/parser` ^8.0.0 | TS parser for ESLint |
| `eslint-plugin-astro` ^1.0.0 | Astro-specific lint rules |
| `prettier` ^3.0.0 | Code formatting |
| `prettier-plugin-astro` ^0.14.0 | Astro formatting support |
| `vitest` ^3.0.0 | Test runner |
| `typescript` ^5.6.0 | TypeScript compiler |

#### `packages/core` Dependencies
| Package | Purpose |
|---------|---------|
| `drizzle-orm` ^0.38.0 | Database ORM (D1/SQLite) |
| `drizzle-kit` ^0.30.0 (dev) | Migration generation |
| `astro` ^5.0.0 (dev/peer) | Astro framework |
| `@cloudflare/workers-types` ^4.0.0 (dev) | Worker type definitions |
| `wrangler` ^4.0.0 (dev) | Local D1/R2/Queue emulation |

#### `playground` Dependencies
| Package | Purpose |
|---------|---------|
| `astro` ^5.0.0 | Astro framework |
| `@community-rss/core` `*` | Framework (workspace link) |
| `@astrojs/cloudflare` ^12.0.0 | Cloudflare adapter |

#### `docs` Dependencies
| Package | Purpose |
|---------|---------|
| `astro` ^5.0.0 | Astro framework |
| `@astrojs/starlight` ^0.33.0 | Documentation theme |

## Architecture & API Design

### Public API Surface (`packages/core/index.ts`)

```typescript
// Default export — Astro integration factory
export default function communityRss(
  options?: CommunityRssOptions
): AstroIntegration;

// Named exports — public interfaces
export type { CommunityRssOptions } from './src/types/options';
export type { Env } from './src/types/env';

// Worker exports (stubs in 0.1.0)
export { scheduled } from './src/workers/scheduled';
export { queue } from './src/workers/queue';
```

### Key Interfaces

```typescript
export interface CommunityRssOptions {
  /** Maximum feeds per verified author. @since 0.1.0 */
  maxFeeds?: number;
  /** Comment permission level. @since 0.1.0 */
  commentTier?: 'verified' | 'registered' | 'guest';
}
```

### Database Schema (Drizzle ORM)
All tables from Spec Section 6: `users`, `sessions`, `accounts`,
`verifications`, `verified_domains`, `feeds`, `articles`, `followers`,
`interactions`, `comments`, `media_cache`. Defined in
`packages/core/src/db/schema.ts`, migrations generated via `drizzle-kit`.

### Route Injection
- `GET /api/v1/health` — stub health check (validates integration wiring)
- Routes resolved via `new URL('./routes/...', import.meta.url).pathname`

### CSS Token Convention
- Prefix: `--crss-{category}-{name}`
- Categories: surface, text, brand, heart, star, comment, font, space, radius

## Phase 1: Monorepo Scaffolding
- [x] Create root `package.json` with workspaces (`packages/*`, `playground`, `docs`)
- [x] Create `.node-version` file (Node 22)
- [x] Create `tsconfig.base.json` with strict mode and path alias definitions
- [x] Create `packages/core/package.json` (`@community-rss/core`)
- [x] Create `packages/core/tsconfig.json` extending base with path aliases
- [x] Create `playground/package.json` with `@community-rss/core: "*"` dependency
- [x] Create `playground/tsconfig.json`
- [x] Create `playground/astro.config.mjs` consuming the integration
- [x] Create `playground/wrangler.toml` with D1, R2, Queue bindings
- [x] Create `playground/.dev.vars.example` with all required env vars
- [x] Create `playground/src/pages/index.astro` — minimal shell page
- [x] Create `docs/package.json` (Starlight workspace)
- [x] Create `docs/astro.config.mjs` with Starlight configuration
- [x] Create `docs/tsconfig.json`
- [x] Create `.devcontainer/devcontainer.json`
- [x] Update `docker-compose.yml` to add port 4322
- [x] Update `.gitignore` for Astro/Wrangler/Drizzle artifacts
- [x] Run `npm install` — verify workspace symlinks resolve

## Phase 2: Code Quality Tooling
- [x] Install and configure ESLint 9 (flat config) at root
- [x] Install and configure Prettier at root with `prettier-plugin-astro`
- [x] Add root scripts: `lint`, `lint:fix`, `format`, `format:check`
- [x] Configure VS Code workspace settings (`.vscode/settings.json`)

## Phase 3: Testing Infrastructure
- [x] Install Vitest at root
- [x] Create root `vitest.config.ts` (workspace mode)
- [x] Create `packages/core/vitest.config.ts` with coverage thresholds (≥80%)
- [x] Configure path alias resolution in Vitest
- [x] Create initial test fixtures directory: `packages/core/test/fixtures/`
- [x] Add root scripts: `test`, `test:run`, `test:coverage`

## Phase 4: Astro Integration Skeleton
- [x] Create `packages/core/src/types/options.ts` — `CommunityRssOptions` interface
- [x] Create `packages/core/src/types/env.d.ts` — Cloudflare `Env` interface
- [x] Create `packages/core/src/types/models.ts` — domain model interfaces
- [x] Create `packages/core/src/integration.ts` — Astro integration factory
- [x] Create `packages/core/src/routes/api/v1/health.ts` — stub health check
- [x] Create `packages/core/src/workers/scheduled.ts` — stub scheduled handler
- [x] Create `packages/core/src/workers/queue.ts` — stub queue consumer
- [x] Create `packages/core/index.ts` — public API surface
- [x] Verify playground starts with `npm run dev` and renders shell page

## Phase 5: Database Schema (Drizzle-First Workflow)
- [x] Install `drizzle-orm` and `drizzle-kit` in `packages/core`
- [x] Create `packages/core/src/db/schema.ts` — full Drizzle ORM schema
- [x] Create `packages/core/drizzle.config.ts` — drizzle-kit config
- [x] Run `npx drizzle-kit generate` to produce the initial migration
- [x] Create `packages/core/src/db/queries/` — empty query module stubs

## Phase 6: CSS Design Token System
- [x] Create `packages/core/src/styles/tokens.css` with default theme
- [x] Create `packages/core/src/layouts/BaseLayout.astro` — injects token stylesheet

## Phase 7: Documentation Site Bootstrap
- [x] Create documentation structure in `docs/src/content/docs/`
- [x] Verify docs site builds and serves on localhost:4322

## Phase 8: Tests for 0.1.0
- [x] Create test fixtures (`packages/core/test/fixtures/`)
- [x] `test/integration/integration-factory.test.ts` — integration creates correct config
- [x] `test/types/options.test.ts` — CommunityRssOptions defaults and validation
- [x] `test/db/schema.test.ts` — Drizzle schema exports all expected tables
- [x] `test/routes/api/v1/health.test.ts` — health endpoint returns correct response
- [x] `test/workers/workers.test.ts` — worker stubs execute without error
- [x] Verify ≥80% coverage of all new code
- [x] Playground builds without errors: `npm run build --workspace=playground`
- [x] Docs site builds without errors: `npm run build --workspace=docs`

## Test Strategy

### Test Files
| File | Type | Tests |
|------|------|-------|
| `test/integration/integration-factory.test.ts` | Unit | Integration factory returns valid config, accepts options |
| `test/types/options.test.ts` | Unit | Default values, type validation |
| `test/db/schema.test.ts` | Unit | All table schemas exported, column types correct |

### Fixtures
| File | Contents |
|------|----------|
| `test/fixtures/articles.ts` | Mock article data (5 articles) |
| `test/fixtures/feeds.ts` | Mock feed data (3 feeds) |
| `test/fixtures/users.ts` | Mock user data (guest, registered, author, admin) |

## Documentation Updates
- Starlight landing page with project overview
- Getting started: installation, configuration, local development
- API reference: integration factory, options
- Contributing: setup, architecture, testing

## Implementation Notes

### Phase 1: Monorepo Scaffolding
- All scaffolding files created successfully. NPM workspaces resolve correctly.
- `@astrojs/cloudflare` v12.5.1 installed for playground; `@astrojs/starlight` v0.33.2 for docs.
- Dev Container config points at `docker-compose.yml` service; ports 4321 (playground), 4322 (docs), 8080 (FreshRSS), 9000/9001 (MinIO), 8025 (Mailpit).
- `.gitignore` updated for Astro (`dist/`, `.astro/`), Wrangler (`.wrangler/`, `.dev.vars`), Drizzle (`drizzle/meta/`), and coverage (`coverage/`).

### Phase 2: Code Quality Tooling
- ESLint 9 flat config with `@eslint/js`, `typescript-eslint` ^8.x, `eslint-plugin-astro` ^1.x.
- Rules: `no-unused-vars` ignores `_`-prefixed params; `consistent-type-imports` enforced.
- Prettier with `prettier-plugin-astro`, single quotes, trailing commas, 100-char width.
- VS Code workspace settings auto-format on save with ESLint + Prettier.

### Phase 3: Testing Infrastructure
- Vitest 3.2.4 in workspace mode; root config references `packages/core/vitest.config.ts`.
- `@vitest/coverage-v8` for coverage; thresholds set at 80% for statements, branches, functions, lines.
- Path aliases (`@utils/`, `@components/`, `@db/`, `@core-types/`, `@fixtures/`, `@test/`) resolved via Vitest's `resolve.alias` config.
- Coverage excludes declarative/re-export files: `schema.ts`, `models.ts`, `workers/index.ts`, `db/queries/**`, `db/migrations/**`, `*.d.ts`.

### Phase 4: Astro Integration Skeleton
- **Key decision:** Source files in `packages/core/src/` use **relative imports** (not path aliases) because the package is consumed as a workspace dependency via Astro/Vite, which doesn't resolve the core package's internal tsconfig path aliases. Path aliases are used only in test files (resolved by Vitest).
- `CommunityRssOptions` interface with `maxFeeds` (default 10) and `commentTier` (default `'registered'`); `resolveOptions()` applies defaults.
- `Env` interface types all Cloudflare bindings: `DB` (D1Database), `MEDIA_BUCKET` (R2Bucket), `ARTICLE_QUEUE` (Queue), plus env vars (`FRESHRSS_API_URL`, `FRESHRSS_API_KEY`, `JWT_SECRET`).
- Integration factory (`createIntegration`) injects `GET /api/v1/health` route via `injectRoute` in `astro:config:setup`.
- Worker stubs (`scheduled`, `queue`) accept `Env` and log placeholder messages; ready for real implementations in later releases.
- Public API surface (`index.ts`): default export `communityRss()`, re-exports all types and worker handlers.
- Package exports map expanded to include `"./workers"`, `"./layouts/*"`, `"./components/*"`, `"./styles/*"` for consumer access.

### Phase 5: Database Schema
- Full Drizzle ORM schema with 11 tables matching Spec Section 6: `users`, `sessions`, `accounts`, `verifications`, `verified_domains`, `feeds`, `articles`, `followers`, `interactions`, `comments`, `media_cache`.
- `articles` table has unique index on `freshrss_item_id` for upsert deduplication.
- `followers` and `interactions` use composite primary keys.
- All tables include `created_at` timestamps; mutable tables add `updated_at`.
- Initial migration generated: `0000_daily_longshot.sql` (auto-named by drizzle-kit).
- Query stubs created for `articles.ts`, `feeds.ts`, `users.ts` — implementation deferred to 0.2.0+.

### Phase 6: CSS Design Token System
- Tokens use `--crss-` prefix across categories: surface, text, brand, interactions, typography, spacing, radius, shadows, transitions.
- Dark mode defaults with neutral grays; brand primary `#6366f1` (indigo), accent `#f59e0b` (amber).
- `BaseLayout.astro` provides HTML shell with global CSS reset, importing `tokens.css`.

### Phase 7: Documentation Site Bootstrap
- Starlight 0.33.2 configured with 3 sidebar sections: Getting Started, API Reference, Contributing.
- 9 content pages created covering installation, configuration, local dev, integration API, options API, contributor setup, architecture, and testing.
- Content collection uses Starlight's `docsLoader()` with Astro 5's content layer API (`src/content.config.ts`).
- **Issue encountered:** Stale `.astro/` cache caused content-modules.mjs to only include `index.mdx`. Resolved by clearing `.astro/` and re-running `astro sync`.

### Phase 8: Tests & Verification
- **61 tests** across 5 test files, all passing.
- **100% coverage** on measured files (declarative files excluded from threshold).
- Test files added beyond original plan: `health.test.ts` (health endpoint response validation), `workers.test.ts` (worker handler execution).
- Playground builds successfully (`npm run build --workspace=playground`).
- Docs site builds successfully (`npm run build --workspace=docs`) — 10 pages generated with Pagefind search indexing.

### Decisions Log
1. **Relative imports in source, aliases in tests** — Astro/Vite in consumer packages cannot resolve the core package's tsconfig path aliases. Source code must use relative imports for cross-directory references.
2. **Coverage exclusions** — Drizzle schema (`$defaultFn` callbacks), type re-export files, and worker barrel exports are declarative code that cannot meaningfully be covered. Excluded from coverage thresholds to avoid artificial inflation of uncoverable code.
3. **Extra test files** — Added `health.test.ts` and `workers.test.ts` beyond the original plan to ensure all runtime code has test coverage.
4. **Package exports expansion** — Added `./layouts/*`, `./components/*`, `./styles/*` to exports map so playground (and consumers) can import layouts and styles directly.
5. **Root test scripts use `cd packages/core &&`** — NPM 10 propagates `npm run` to all workspaces by default. Using `cd packages/core && npx vitest` instead of `vitest --project core` avoids workspace propagation issues and ensures coverage scoping is correct. Root `vitest.config.ts` removed as unnecessary.
6. **Starlight content.config.ts** — Astro 5 + Starlight 0.33 requires explicit `src/content.config.ts` with `docsLoader()` and `docsSchema()` for content collection discovery. Stale `.astro/` cache can prevent file discovery — clearing it resolves the issue. Added `npm run clean` script to root for convenience.

### Reviewer Observations (Post-Implementation)

The following observations were raised by an independent review of the 0.1.0 codebase.
Items that affect future releases have been added to the PROJECT_PLAN.md Risk Register.

1. **Relative import scalability** — As `src/` grows (especially nested `utils/build/` vs `utils/client/`), relative imports may become visually long (e.g., `../../../../utils/shared/interactions.ts`). If this becomes problematic, consider compiling via `tsup` before publishing (which can resolve aliases at build time). For now, relative imports are the correct approach and folder hierarchy should be kept shallow.
2. **`import.meta.url` route resolution** — Vite dev and Rollup production builds may treat `import.meta.url` differently with workspace symlinks vs real `node_modules`. Must test production build in 0.2.0 when real API routes are injected. *(Added to Risk Register)*
3. **Package exports wildcard and `.astro` extensions** — Modern Node/Vite enforce strict export resolution. The `"./components/*"` wildcard must capture `.astro` extensions. Verify in 0.4.0 when components ship. *(Added to Risk Register)*
4. **D1 composite key `ON CONFLICT` quirks** — D1's custom SQLite parser has historically had issues with `INSERT ... ON CONFLICT` on composite keys and `RETURNING *`. Test thoroughly in 0.4.0 when `toggleHeart` is implemented. *(Added to Risk Register)*
5. **Monorepo test runner scaling** — Current `cd packages/core && npx vitest` approach works but won't scale to E2E tests or docs build validation. May need `turbo`/`wireit` in future. *(Added to Risk Register)*
6. **Stale `.astro/` cache** — Known Astro 5 Content Layer quirk. Added `npm run clean` script to root. *(Added to Risk Register)*


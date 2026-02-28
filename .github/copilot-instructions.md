# Copilot Instructions for Community RSS Framework

## Persona
You are a Senior TypeScript Engineer working on an NPM monorepo that produces
a white-label Astro Integration framework (`@community-rss/core`) and a
reference Playground app. You prioritize **API stability**, testable
architecture, code reuse, and adherence to established patterns.

## Project Context
- **Monorepo layout** (NPM Workspaces): `packages/core/` (the framework),
  `playground/` (ephemeral dev testing app, gitignored), and
  `docs/` (Starlight documentation site)
- **Stack**: Astro SSR + Node.js (`@astrojs/node`) + Docker/VPS + FreshRSS
  + Drizzle ORM (better-sqlite3) + better-auth (authentication)
  + node-cron (scheduling) + MinIO (S3 storage) + Starlight (docs)
- **Licence**: GPL-3.0 — all contributions must be compatible
- **Local dev**: Docker Compose (FreshRSS, MinIO, Mailpit) + Dev Container
- **Architecture**: "Integration with overrides" — the package injects API
  routes and middleware; developers own page routes (scaffolded via CLI)

### Playground Architecture
- The playground is **ephemeral** — gitignored and rebuilt on demand via
  `scripts/reset-playground.sh`. It is never committed to version control.
- `npm run reset:playground` tears down the playground and rebuilds it from
  CLI scaffold templates. It preserves the database by default (`--keep-db`).
- `npm run hardreset:playground` does a full clean including wiping the database.
- The playground consumes `@community-rss/core` exactly as an end-user would.
- **What auto-reloads**: Backend API routes, middleware, components, and
  utilities are symlinked from `packages/core/` via NPM workspaces. Edit
  these and the dev server hot-reloads instantly.
- **What needs a reset**: Pages and email templates are scaffolded (copied)
  into the playground by the CLI. After editing CLI templates in
  `packages/core/src/cli/templates/`, run `npm run reset:playground` to
  see the changes. The database and test data are preserved.

### Config Bridge (config-store.ts)
- `packages/core/src/config-store.ts` passes resolved integration config
  from `astro:config:setup` (where the integration runs) to the middleware
  (which runs at request time) via `globalThis.__communityRssConfig`.
- `setGlobalConfig(config)` is called in `integration.ts` during setup.
- `getGlobalConfig()` is called in `middleware.ts` on each request.
- This avoids Astro virtual module imports at config-load time, which fail
  because virtual modules are only available inside Vite's plugin system.

## Critical Rules

### Monorepo Awareness
- Root `package.json` defines workspaces — never add app dependencies there
- Framework code lives in `packages/core/`; playground is ephemeral (gitignored)
- Documentation site lives in `docs/` (Starlight) — independent workspace
- Shared dev tooling (ESLint, Prettier, Vitest config) lives at the root
- Run `npm install` from the root to wire workspace symlinks
- Publishing is done from `packages/core/` only
- After cloning, run `npm run reset:playground` to scaffold the playground

### Architecture
- Extract ALL business logic to `packages/core/src/utils/` — components are thin wrappers
- Respect execution context boundaries:
  - `utils/build/` — Node.js server-side only (cron, sync, email, auth)
  - `utils/client/` — Browser APIs only (DOM interactions, hearts/stars UI)
  - `utils/shared/` — Pure functions only (validation, formatting, scoring)
- Database queries & migrations live in `packages/core/src/db/`
- Database schema is defined in Drizzle ORM TypeScript (`src/db/schema.ts`).
  Migrations are generated via `drizzle-kit generate` — never hand-written.
- Database uses better-sqlite3 with Drizzle ORM (`BetterSQLite3Database`)
- Authentication uses `better-auth` configured in `src/utils/build/auth.ts`
- Runtime context: `AppContext` (in `src/types/context.ts`) provides `db`,
  `env`, and `config` — accessed via `context.locals.app` in route handlers
- Environment variables are typed in `EnvironmentVariables` interface
  (`src/types/context.ts`) and read from `process.env`
- **Route split**: API routes (11) are injected by the integration; page
  routes (8) are scaffolded into the developer's project via
  `npx @community-rss/core init` and are developer-owned
- Email templates: Astro Container API (`.astro`) preferred, file-based
  HTML (`.html`) with `{{variable}}` for backward compatibility; resolution:
  custom code → developer HTML → Astro Container → package HTML → code defaults
- Components accept `messages`/`labels` props — all user-facing strings
  are configurable; no hard-coded copy in components
- Before creating new functions, search for existing utilities that can be reused
- The "System User" (`id: 'system'`) owns global/community feeds imported
  from FreshRSS. It is seeded during database setup and checked defensively
  in `syncFeeds()`. Admin users may also own feeds without domain verification.

### Three-Tier Design Token System
- **Tier 1 — Reference** (`--crss-ref-*`): Raw palette values, spacing/type
  scales. Defined in `src/styles/tokens/reference.css`.
- **Tier 2 — System** (`--crss-sys-*`): Semantic roles mapping refs to meaning
  (e.g., `--crss-sys-color-primary`). Backward-compatible flat aliases
  (`--crss-surface-0`, `--crss-text-primary`, etc.) are defined here.
  In `src/styles/tokens/system.css`.
- **Tier 3 — Component** (`--crss-comp-*`): Component-scoped overrides
  (e.g., `--crss-comp-card-bg`). In `src/styles/tokens/components.css`.
- All tokens live inside `@layer crss-tokens`
- Never use hardcoded colour/spacing values — always reference a token

### CSS Cascade Layers
- Layer order: `crss-reset, crss-tokens, crss-base, crss-components, crss-utilities`
- Defined in `src/styles/layers.css`
- Consumer `theme.css` is un-layered so it always wins
- Components use `@layer crss-components { ... }` only when declaring styles
  outside scoped `<style>` blocks

### Astro Actions
- Action handlers are exported from `packages/core/src/actions/` as pure
  functions with signature `(input, app: AppContext) => Promise<Result>`
- Consumers register them in their scaffolded `src/actions/index.ts` via
  Astro's `defineAction` with Zod validation
- The core package CANNOT import `astro:actions` — only consumer projects can
- Action handlers are also exported from `@community-rss/core/actions`

### Server Islands
- Auth-dependent UI (AuthButton, HomepageCTA) uses `server:defer` to stream
  content after the initial page shell loads
- These components perform server-side session checks — no client-side
  `fetch('/api/auth/get-session')` needed
- Always provide a `slot="fallback"` for loading skeletons

### Proxy Component Pattern
- Scaffolded components in developers' `src/components/` are **thin wrappers**
  that import core components from `@community-rss/core/components/*`
- Wrappers own the `<style>` block (survives package updates); core owns logic
- No business logic, no API calls in wrappers — only styling and props

### Protected Areas
- Never modify files in `node_modules/@community-rss/core/`
- Never fork or patch the core package — use scaffolded overrides
- Never hand-edit injected API routes (`/api/v1/*`, `/api/auth/*`)
- Use `theme.css`, `messages` props, and Action handlers for customisation

### API Design (Post-1.0.0 Critical)
- All public APIs exported from `packages/core/index.ts` must remain **forward-compatible**
- New parameters MUST be optional with sensible defaults
- Never remove or rename existing public exports — deprecate first, remove in next major
- Configuration objects use the Options pattern: `communityRss(options?: CommunityRssOptions)`
- Injected routes use a stable URL namespace: `/api/v1/...`
- Document every public API with JSDoc including `@since` version tags
- Use TypeScript `interface` (not `type`) for public API shapes to allow declaration merging

### Imports
- **Source code** (`packages/core/src/`): Use **relative imports** for all
  cross-directory imports (e.g., `../types/options`). Path aliases in source
  break consumers because Astro/Vite cannot resolve the core package's
  internal tsconfig aliases when the package is consumed as a workspace dep.
- **Test code** (`packages/core/test/`): Use **path aliases** for all imports
  from source and fixtures. Vitest resolves aliases via its own config.
- Core test aliases: `@utils/`, `@components/`, `@routes/`, `@db/`, `@core-types/`, `@cli/`
- Test-only aliases: `@fixtures/`, `@test/`
- Same-directory imports may use relative paths (`./sibling`)
- Playground imports the framework as `@community-rss/core` (never path-relative)

### Styling (Framework Defaults)
- Use CSS custom properties for all themeable values
- Three-tier token system: Reference → System → Component (see above)
- Prefix all framework tokens with `--crss-` to avoid namespace collisions
- Provide sensible defaults; consumers override via `theme.css` (un-layered)
- No hard-coded colour values — use design tokens that consumers can remap
- CSS cascade layers ensure framework styles never override consumer styles
- Framework components must be compatible with any design system

### Testing
- Write tests for ALL new functions and components
- Maintain ≥80% coverage for statements, branches, functions, and lines
- Test both success and error paths
- Use path aliases in test imports
- Before code review: run `npm run test:coverage` from root and verify no decrease
- DB tests use in-memory SQLite via better-sqlite3 (not D1 or Miniflare)
- Use `vi.hoisted()` for any variable referenced inside `vi.mock()` factories
- **E2E tests** (Playwright): live in `e2e/` at repo root; test against
  the running playground; skip gracefully when Docker services unavailable
- Run unit tests: `npm run test:run`; E2E tests: `npm run test:e2e`

### Release Process
- Feature plans go in `feature_plans/X_Y_Z/{feature_name}/`
- Feature branches are squash-merged into release branch
- Do NOT update version numbers or CHANGELOG during feature work
- Version/changelog updates happen only in release finalization
- Pre-1.0.0: breaking changes allowed with documentation
- Post-1.0.0: SemVer strictly enforced; breaking changes require MAJOR bump
- After completing each implementation phase, update the feature plan's
  Implementation Notes: check off tasks, note decisions, log problems

### Changelog
- `CHANGELOG.md` at the repo root follows [Keep a Changelog](https://keepachangelog.com/) format
- Categories: Added, Changed, Deprecated, Removed, Fixed, Security
- During feature work: do NOT edit `CHANGELOG.md`
- During release finalization: move entries from `[Unreleased]` to the new version heading
- Each entry should be a concise, user-facing description of the change
- Reference the component/file affected (e.g., `utils/build/sync.ts`)
- Include a `Known Issues` section for documented limitations

### Contributing (Open Source)
- All code must be GPL-3.0 compatible
- Public APIs must have JSDoc documentation
- Feature plans require review and approval before implementation begins
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`

## Anti-Patterns (NEVER DO)
- ❌ Define business logic functions inside test files
- ❌ Put business logic in Astro components — extract to utils
- ❌ Use `fs` or `path` in client utils
- ❌ Use `document` or `window` in build/server utils
- ❌ Add breaking changes to public API without a MAJOR version bump (post-1.0.0)
- ❌ Use relative imports from test files to source code
- ❌ Skip writing tests for new utility functions
- ❌ Update CHANGELOG.md during feature development
- ❌ Bump version numbers before release finalization
- ❌ Add app dependencies to root package.json
- ❌ Import from `packages/core/src/` in playground — use `@community-rss/core`
- ❌ Import from `docs/` in packages/core or playground — docs is independent
- ❌ Begin implementation without an approved feature plan
- ❌ Use raw SQL strings — use Drizzle ORM query builders in `src/db/`
- ❌ Hand-write SQL migration files — always generate via `drizzle-kit generate`
- ❌ Implement custom session/auth logic — use better-auth patterns
- ❌ Write misleading Implementation Notes — describe actual code, not intent
- ❌ Inject page routes from the package — pages are developer-owned (scaffolded)
- ❌ Hard-code user-facing strings in components — use `messages`/`labels` props
- ❌ Declare mock variables outside `vi.hoisted()` when used in `vi.mock()` factories
- ❌ Use hardcoded hex/rgb colour values in components — use `--crss-*` tokens
- ❌ Put styles outside `@layer` in framework CSS — consumer styles must win
- ❌ Import `astro:actions` from the core package — only consumer projects can
- ❌ Modify files in `node_modules/` or patch the core package
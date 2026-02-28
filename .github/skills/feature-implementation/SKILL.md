---
name: "feature-implementation"
description: "End-to-end feature implementation for the Community RSS Framework monorepo"
---

# feature-implementation

An autonomous agent that handles complete feature implementation from planning
through testing and documentation in the `@community-rss/core` NPM monorepo.

## Capabilities
- Generate feature plans following guidelines
- Implement code following monorepo architecture patterns
- Create tests with proper organisation (unit + integration + SQLite)
- Update documentation with API references
- Verify playground compatibility

## Workflow Steps

### Step 1: Planning
- Reference: `.github/instructions/feature-plan.instructions.md`
- Output: Feature plan in `feature_plans/X_Y_Z/{feature_name}/FEATURE_PLAN.md`
- Includes API design review, forward-compatibility analysis

### Step 2: Codebase Analysis
- Search existing `packages/core/src/utils/` for reuse opportunities
- Identify affected files across the monorepo
- Map dependencies (DB schema, AppContext, public API, CLI scaffold)
- Check impact on `packages/core/index.ts` exports

### Step 3: Implementation
- Create utils in correct directory (build/client/shared)
- Database queries in `packages/core/src/db/`
- API routes under `/api/v1/` namespace
- **Action handlers** in `src/actions/` with signature `(input, app) => Promise<Result>`
  — export from `index.ts`, add Zod wrapper to scaffold template
- Components as thin wrappers with `messages`/`labels` props and CSS custom properties
- **Server Islands** for auth-dependent UI — use `server:defer` with fallback slots
- Page routes scaffolded via CLI (never injected by integration)
- Email templates: Astro components in `src/templates/email/`, HTML fallbacks in
  `src/cli/templates/email-templates/`
- Use relative imports in source code (path aliases in test code only)
- Add JSDoc with `@since` tags to all public exports
- **Token audit**: Verify no hardcoded colours — use `--crss-ref-*`, `--crss-sys-*`,
  or `--crss-comp-*` tokens; styles inside `@layer crss-components`
- **After each phase**: update the feature plan Implementation Notes:
  - Check off completed tasks (`[x]`)
  - Mark phase heading ✅ Completed / ❌ Blocked / 🔄 In Progress
  - Add `> **Notes:**` block with decisions and deviations
  - Append any problems/constraints to the bottom log

### Step 4: Testing
- Create tests mirroring source structure in `packages/core/test/`
- Use path aliases for imports (`@utils/`, `@fixtures/`, `@test/`, `@cli/`, `@actions/`)
- Cover happy path, edge cases, errors
- **Unit tests**: Fixtures, pure functions, <100ms
- **Integration tests**: In-memory SQLite, timeouts, real DB operations
- **API tests**: Route handlers, request/response validation
- **CLI tests**: Scaffold operations, --force flag, file creation
- **Action tests**: Handler functions with mocked AppContext
- **E2E tests** (Playwright): Page specs in `e2e/pages/`, flow specs in
  `e2e/flows/`, skip gracefully when Docker services unavailable
- Maintain ≥80% coverage

### Step 5: Documentation
- Update API reference with tables including "Since" column
- Consumer examples use `@community-rss/core` imports
- Contributor examples use path aliases
- Document CLI scaffold additions
- NOTE: Do NOT update changelog or version — release finalization only

### Step 6: Playground Verification
- The playground is ephemeral (gitignored) — rebuild via
  `npm run reset:playground` (keeps DB) or `npm run hardreset:playground`
  (full clean)
- Backend changes (routes, middleware, utils, components) auto-reload via
  workspace symlink — no reset needed
- After changing CLI scaffold templates, run `npm run reset:playground` to
  refresh pages and email templates while keeping test data
- Confirm injected API routes respond: `curl http://localhost:4321/api/v1/health`
- Verify scaffolded pages render in the browser at `http://localhost:4321`
- Test that the integration config works with default options

## Standards Compliance
This agent enforces:
- NPM Workspaces monorepo structure
- Testable architecture (utils, not components, hold logic)
- API forward-compatibility (Options pattern, optional params)
- Relative imports in source; path aliases in test code
- Three-tier design token system (`--crss-ref-*`, `--crss-sys-*`, `--crss-comp-*`)
- CSS cascade layers (`crss-reset, crss-tokens, crss-base, crss-components, crss-utilities`)
- Astro Actions: pure handlers in `src/actions/`, consumer registration via `defineAction`
- Server Islands: `server:defer` for auth-dependent UI with fallback slots
- Container API email pipeline with 5-step resolution chain
- Proxy Component Pattern: scaffolded wrappers own `<style>`, core owns logic
- AppContext (BetterSQLite3Database, EnvironmentVariables, config)
- Component `messages`/`labels` props (no hard-coded strings)
- Page routes scaffolded via CLI (not injected by integration)
- GPL-3.0 licence compatibility

## Triggers
- "Implement feature: {description}"
- "Add functionality for: {description}"
- "Create new {component/utility/route}: {description}"
- "Build the {feature_name} from the approved plan"

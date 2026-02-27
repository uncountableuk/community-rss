---
name: "Feature Implementation Agent"
description: "End-to-end feature implementation for the Community RSS Framework monorepo"
---

# Feature Implementation Agent

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
- Components as thin wrappers with `messages`/`labels` props and CSS custom properties
- Page routes scaffolded via CLI (never injected by integration)
- Email templates in `src/cli/templates/email-templates/` and `src/templates/email-templates/`
- Use relative imports in source code (path aliases in test code only)
- Add JSDoc with `@since` tags to all public exports
- **After each phase**: update the feature plan Implementation Notes:
  - Check off completed tasks (`[x]`)
  - Mark phase heading ✅ Completed / ❌ Blocked / 🔄 In Progress
  - Add `> **Notes:**` block with decisions and deviations
  - Append any problems/constraints to the bottom log

### Step 4: Testing
- Create tests mirroring source structure in `packages/core/test/`
- Use path aliases for imports (`@utils/`, `@fixtures/`, `@test/`, `@cli/`)
- Cover happy path, edge cases, errors
- **Unit tests**: Fixtures, pure functions, <100ms
- **Integration tests**: In-memory SQLite, timeouts, real DB operations
- **API tests**: Route handlers, request/response validation
- **CLI tests**: Scaffold operations, --force flag, file creation
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
- CSS custom property theming (`--crss-` prefix)
- AppContext (BetterSQLite3Database, EnvironmentVariables, config)
- Component `messages`/`labels` props (no hard-coded strings)
- Page routes scaffolded via CLI (not injected by integration)
- GPL-3.0 licence compatibility

## Triggers
- "Implement feature: {description}"
- "Add functionality for: {description}"
- "Create new {component/utility/route}: {description}"
- "Build the {feature_name} from the approved plan"

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
- Create tests with proper organisation (unit + integration + D1)
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
- Map dependencies (D1 schema, Cloudflare bindings, public API)
- Check impact on `packages/core/index.ts` exports

### Step 3: Implementation
- Create utils in correct directory (build/client/shared)
- Database queries in `packages/core/src/db/`
- API routes under `/api/v1/` namespace
- Components as thin wrappers with CSS custom properties
- Use path aliases for all imports
- Add JSDoc with `@since` tags to all public exports
- **After each phase**: update the feature plan Implementation Notes:
  - Check off completed tasks (`[x]`)
  - Mark phase heading ✅ Completed / ❌ Blocked / 🔄 In Progress
  - Add `> **Notes:**` block with decisions and deviations
  - Append any problems/constraints to the bottom log

### Step 4: Testing
- Create tests mirroring source structure in `packages/core/test/`
- Use path aliases for imports (`@utils/`, `@fixtures/`, `@test/`)
- Cover happy path, edge cases, errors
- **Unit tests**: Fixtures, pure functions, <100ms
- **Integration tests**: Miniflare D1, timeouts, real bindings
- **API tests**: Route handlers, request/response validation
- Maintain ≥80% coverage

### Step 5: Documentation
- Update API reference with tables including "Since" column
- Consumer examples use `@community-rss/core` imports
- Contributor examples use path aliases
- NOTE: Do NOT update changelog or version — release finalization only

### Step 6: Playground Verification
- Confirm playground app still builds with new framework code
- Test injected routes respond correctly
- Verify HMR works with code changes

## Standards Compliance
This agent enforces:
- NPM Workspaces monorepo structure
- Testable architecture (utils, not components, hold logic)
- API forward-compatibility (Options pattern, optional params)
- Path alias usage (no `../` cross-directory imports)
- CSS custom property theming (`--crss-` prefix)
- Cloudflare binding typing (Env interface)
- GPL-3.0 licence compatibility

## Triggers
- "Implement feature: {description}"
- "Add functionality for: {description}"
- "Create new {component/utility/route}: {description}"
- "Build the {feature_name} from the approved plan"

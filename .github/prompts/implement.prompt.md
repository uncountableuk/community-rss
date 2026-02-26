---
agent: agent
description: "Implement code following project coding standards"
---

# Implementation Prompt

Implement the requested feature in the Community RSS Framework monorepo
following project coding standards, API design principles, and the
approved feature plan.

## Standards to Follow
- Implementation Rules: `.github/instructions/implementation.instructions.md`
- API Design Rules: `.github/instructions/api-design.instructions.md`
- Testing Rules: `.github/instructions/testing.instructions.md`
- Copilot Instructions: `.github/copilot-instructions.md`

## Before Writing Code
1. Read the approved feature plan in `feature_plans/X_Y_Z/{feature_name}/`
2. Search existing `packages/core/src/utils/` for functions that can be reused
3. Identify the correct utils directory:
   - `utils/build/` for Node.js server code (cron, sync, email, auth)
   - `utils/client/` for browser runtime code (DOM interactions)
   - `utils/shared/` for pure functions (validation, formatting, scoring)
4. Check if similar patterns exist in the codebase
5. Verify the public API design follows Options pattern with interfaces

## Implementation Rules
- Extract business logic to `packages/core/src/utils/` — components are thin wrappers
- Use **relative imports** in source code (`../utils/`, `../types/`)
- Use **path aliases** only in test code (`@utils/`, `@db/`, `@core-types/`)
- Use CSS custom properties with `--crss-` prefix for framework styling
- Add JSDoc comments with `@param`, `@returns`, and `@since` tags
- Export `interface` (not `type`) for public API shapes
- Access runtime context via `context.locals.app` (AppContext)
- API routes use `/api/v1/` namespace
- Page routes are scaffolded via CLI (never injected by integration)
- Components accept `messages`/`labels` props (no hard-coded strings)
- Email templates use `{{variable}}` substitution pattern
- Database queries live in `packages/core/src/db/`

## Implementation Notes (MANDATORY)
After completing **every phase** in the feature plan, you MUST update the
`Implementation Notes` section in the feature plan file:
1. Check off (`[x]`) all completed tasks in that phase
2. Mark the phase heading with ✅ Completed (or ❌ Blocked)
3. Add a `> **Notes:**` block summarising decisions, deviations, or anything noteworthy
4. Append any new problems or constraints to the **Problems & Constraints** log at the bottom
5. Do NOT delete or overwrite previous notes — the section is append-only

## Playground Testing
After implementing core framework code:
1. Verify the playground picks up changes via HMR
2. Test that the integration config works with default options
3. Confirm injected API routes respond correctly
4. Verify scaffolded pages render properly

## After Implementation
- [ ] All business logic is in `packages/core/src/utils/`
- [ ] Components only orchestrate utils (no inline logic)
- [ ] Relative imports used in source code (no path aliases in src/)
- [ ] CSS custom properties used (no hard-coded colours)
- [ ] Functions have JSDoc with `@since` tags
- [ ] Public API uses Options pattern with optional params + defaults
- [ ] AppContext used for runtime context (db, env, config)
- [ ] Components use `messages`/`labels` props (no hard-coded strings)
- [ ] Feature plan Implementation Notes updated for every completed phase
- [ ] All completed tasks checked off (`[x]`) in the feature plan
- [ ] Problems & Constraints section updated with any issues encountered
- [ ] Playground app still builds and runs correctly

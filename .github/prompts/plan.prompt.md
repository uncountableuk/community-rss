---
agent: agent
description: "Generate a feature plan following project guidelines"
---

# Feature Planning Prompt

Generate a comprehensive feature plan for the Community RSS Framework
following project guidelines and the NPM monorepo methodology.

## Context Files to Reference
- Project Spec: `feature_plans/0_0_1/Community-RSS-Framework-Spec.md`
- Dev Workflow: `feature_plans/0_0_1/Framework-Dev-Workflow.md`
- Local Dev Setup: `feature_plans/0_0_1/Local-Dev-Setup.md`
- Feature Plan Guidelines: `.github/instructions/feature-plan.instructions.md`
- API Design Rules: `.github/instructions/api-design.instructions.md`
- Implementation Rules: `.github/instructions/implementation.instructions.md`
- Copilot Instructions: `.github/copilot-instructions.md`

## Your Task
1. Analyse the feature request provided by the user
2. Review the existing codebase structure in `packages/core/src/`
3. Search for existing utilities that can be reused
4. Assess impact on the public API surface (`packages/core/index.ts`)
5. Generate a feature plan with:
   - Overview of requirements tied to the project spec
   - Codebase review (files to create/modify with full monorepo paths)
   - Architecture & API design decisions (Options pattern, interfaces)
   - Forward-compatibility analysis
   - Phased implementation plan with checkboxes
   - Test strategy phase (unit + integration, fixtures, in-memory SQLite)
   - Documentation update phase
   - CLI scaffold additions (new pages, email templates) if applicable

## Output Format
Create a markdown document following the Feature Plan Instructions.
Place the plan in `feature_plans/X_Y_Z/{feature_name}/FEATURE_PLAN.md`
where `X_Y_Z` is the target release version.

## Critical Checks
- [ ] All files listed with full monorepo paths (`packages/core/src/...`)
- [ ] Searched for existing reusable utilities
- [ ] Respected build/client/shared utils separation
- [ ] Public API uses Options pattern with `interface` (not `type`)
- [ ] All new params are optional with sensible defaults
- [ ] JSDoc with `@since` tags planned for public exports
- [ ] API routes use `/api/v1/` namespace
- [ ] Database schema changes use Drizzle ORM (migrations via drizzle-kit)
- [ ] Test phase included with specific file locations and strategies
- [ ] Documentation update phase included
- [ ] No version bump or CHANGELOG update included
- [ ] GPL-3.0 compatibility confirmed for any new dependencies
- [ ] Forward-compatibility analysed ("can this evolve without breaking?")
- [ ] Components use `messages`/`labels` props (no hard-coded strings)
- [ ] Page routes scaffolded via CLI (not injected by integration)

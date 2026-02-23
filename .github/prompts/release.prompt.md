---
agent: agent
description: "Generate release finalization plan for a release branch"
---

# Release Finalization Prompt

Generate a release finalization plan for completing a release branch
of the Community RSS Framework monorepo.

## Context Files to Reference
- Copilot Instructions: `.github/copilot-instructions.md`
- API Design Rules: `.github/instructions/api-design.instructions.md`
- Feature Plan Guidelines: `.github/instructions/feature-plan.instructions.md`

## Release Workflow Context
This project follows a structured release workflow:
1. `main` branch contains only squash-merged release branches
2. Release branches (`release-X_Y_Z`) are created proactively after previous release
3. Feature branches are squash-merged into the release branch
4. Version numbers and changelog are NOT updated during feature work
5. This prompt generates the final release plan that handles finalization
6. Publishing is done from `packages/core/` only — the playground is never published

## SemVer Rules
- **Pre-1.0.0**: Breaking changes allowed (documented in plans)
- **Post-1.0.0**: Strict SemVer enforced
  - PATCH: Bug fixes only
  - MINOR: New features, new optional params — backward-compatible
  - MAJOR: Breaking changes with migration guide

## Your Task
1. Review all feature plans completed in this release (`feature_plans/X_Y_Z/`)
2. Identify all changes to document in CHANGELOG
3. Audit public API changes for forward-compatibility
4. Determine version bump type (MAJOR/MINOR/PATCH)
5. Generate release finalization plan

## Output: Release Finalization Plan

Create `feature_plans/X_Y_Z/release/RELEASE_FINALIZATION_PLAN.md`:

```markdown
# Release vX.Y.Z Finalization Plan

## Features Included
- [ ] Feature 1: Brief description (from feature_plans/X_Y_Z/feature1/)
- [ ] Feature 2: Brief description (from feature_plans/X_Y_Z/feature2/)

## Public API Audit
- New exports: list any new public API additions
- Changed exports: list any modified signatures (must be backward-compatible)
- Deprecated exports: list any deprecations with migration notes
- Breaking changes: list any (MAJOR bump required post-1.0.0)

## Version Determination
- Current version: X.Y.Z
- New version: X.Y.Z
- Reason: [MAJOR|MINOR|PATCH] — {justification}

## Changelog Entry
{Pre-written changelog entry for copy-paste}

## QA Checklist
- [ ] All feature branches merged to release branch
- [ ] All tests passing (`npm run test:run` from root)
- [ ] Build succeeds (`npm run build` from root)
- [ ] Coverage maintained (≥80% statements/branches/functions/lines)
- [ ] Playground app builds and runs correctly
- [ ] Public API forward-compatibility verified
- [ ] Documentation complete for all features
- [ ] All dependencies are GPL-3.0 compatible

## Finalization Tasks
- [ ] Update `packages/core/package.json` version to X.Y.Z
- [ ] Update CHANGELOG.md — move Unreleased to vX.Y.Z
- [ ] Final commit: `chore: release vX.Y.Z`
- [ ] Squash merge release branch to main
- [ ] Tag release: `git tag vX.Y.Z`
- [ ] Publish: `cd packages/core && npm publish`
- [ ] Create next release branch: `release-X_Y_Z`

## Release Commit Message Template
chore: release vX.Y.Z

OBJECTIVE: {What this release achieves}

KEY FEATURES:
- Feature 1
- Feature 2

QUALITY:
- {test count} tests passing
- {coverage}% coverage
- All public APIs documented with @since tags
```

## Critical Reminders
- Do NOT update version/changelog during feature work
- This plan is the ONLY place version updates happen
- Ensure all feature plan implementation notes are complete
- Only `packages/core/` is published to NPM — never the root or playground
- Verify no breaking changes to public API (post-1.0.0)

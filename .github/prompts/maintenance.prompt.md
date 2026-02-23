---
agent: agent
description: "Sync Copilot configurations and audit consistency across the monorepo"
---

# Configuration Maintenance Prompt

Audit and sync Copilot configurations, project standards, and documentation
across the Community RSS Framework monorepo.

## Purpose
When standards, architecture, or project structure changes, this prompt
helps identify what needs to be updated across all configuration files
to stay consistent.

## Files to Audit

### Source of Truth
- `feature_plans/0_0_1/Community-RSS-Framework-Spec.md` — Project spec
- `feature_plans/0_0_1/Framework-Dev-Workflow.md` — Dev workflow
- `feature_plans/0_0_1/Local-Dev-Setup.md` — Local environment
- `packages/core/index.ts` — Public API surface
- `packages/core/src/types/` — TypeScript interfaces
- `packages/core/package.json` — Dependencies & version

### Target Configurations
- `.github/copilot-instructions.md` — Global rules
- `.github/instructions/*.instructions.md` — Context-specific rules
- `.github/prompts/*.prompt.md` — Workflow prompts
- `.github/skills/*/SKILL.md` — Agent skills
- `.github/pull_request_template.md` — PR checklist
- Root `package.json` — Workspace config
- `docker-compose.yml` — Dev environment

## Analysis Task
For each source of truth that has changed:
1. Identify the specific rules or structures that changed
2. Find corresponding rules in Copilot configs
3. List exact updates needed
4. Flag any contradictions between configs

## Output Format
```markdown
## Sync Checklist

### Changes Detected
- [ ] `packages/core/index.ts`: New public export `newFunction()`
- [ ] `packages/core/src/types/options.ts`: Added `newOption` property

### Updates Required

#### `.github/copilot-instructions.md`
- [ ] Add new path alias if introduced
- [ ] Update anti-patterns list if new rules apply

#### `.github/instructions/api-design.instructions.md`
- [ ] Document new public API pattern

#### `.github/prompts/implement.prompt.md`
- [ ] Add reference to new utility pattern

### No Updates Required
- `.github/instructions/testing.instructions.md` — No test rule changes
```

## Validation
After updates, verify:
- [ ] All changed standards are reflected in configs
- [ ] No contradictions between config files
- [ ] Examples in configs match current project structure
- [ ] Path aliases match current tsconfig
- [ ] Cloudflare binding names match current wrangler.toml
- [ ] Docker Compose services match current setup

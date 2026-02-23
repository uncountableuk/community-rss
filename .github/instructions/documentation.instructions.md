---
applyTo: "docs/**/*.md,packages/core/docs/**/*.md,playground/docs/**/*.md"
---

# Documentation Instructions

## Documentation Types
The Community RSS Framework has multiple documentation audiences:

1. **Framework API Docs** — For developers installing `@community-rss/core`
2. **Contributor Docs** — For open-source contributors to this repo
3. **Feature Plans** — In `feature_plans/X_Y_Z/` for planning & review

## Heading Rules
- ❌ NO H1 (`#`) in document body — the title/filename is the H1
- ✅ Start with H2 (`##`) for first section
- Maintain proper hierarchy (no skipping levels)

## Code Blocks
- Maximum 100 characters per line for readability
- Include language identifier: ```typescript, ```css, ```bash, ```sql
- Show realistic, working examples
- Always show the correct import path (path alias or `@community-rss/core`)

## Tables for API Documentation
```markdown
| Name | Type | Required | Default | Since | Description |
|------|------|----------|---------|-------|-------------|
| prop1 | string | Yes | - | 0.1.0 | Description |
| prop2 | number | No | 10 | 0.2.0 | Description |
```

**Important**: Include a "Since" column for public API docs to track when
each parameter was introduced, supporting forward-compatibility.

## Public API Documentation
Every public API exported from `packages/core/index.ts` must have:
- JSDoc with `@since` tag in the source code
- A corresponding section in the API reference docs
- A table listing all parameters with types, defaults, and descriptions
- At least one usage example
- Migration notes if deprecating older patterns

## Feature Plan Documentation
Feature plans placed in `feature_plans/X_Y_Z/{feature_name}/` must include:
1. Overview of requirements
2. Codebase review (files to create/modify)
3. Architecture decisions and API design rationale
4. Phased implementation plan with checkboxes
5. Test requirements phase
6. Documentation update phase

## Links
- Internal repo links use relative paths
- NPM package references: `@community-rss/core`
- GitHub references: link to specific files or lines

## Structure Template
1. Brief introduction (1-2 paragraphs)
2. ## Overview
3. ## Key Features / API Surface (bullet list or table)
4. ## Usage (with examples showing `@community-rss/core` imports)
5. ## Configuration Options (tables)
6. ## Related Documentation (links)

## Licence Header
All substantial documentation files should note GPL-3.0 licensing
where appropriate for contributor awareness.

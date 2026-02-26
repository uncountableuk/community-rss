---
applyTo: "docs/**/*.md,packages/core/docs/**/*.md,playground/docs/**/*.md"
---

# Documentation Instructions

## Documentation Types
The Community RSS Framework has multiple documentation audiences:

1. **Framework API Docs** — For developers installing `@community-rss/core`
2. **Contributor Docs** — For open-source contributors to this repo
3. **Feature Plans** — In `feature_plans/X_Y_Z/` for planning & review
4. **Starlight Docs Site** — The `docs/` workspace contains the published
   documentation site, built with Astro Starlight
5. **Changelog** — `CHANGELOG.md` at the repo root tracks user-facing
   changes per release using Keep a Changelog format

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

## CLI Documentation
Document the CLI scaffold command (`npx @community-rss/core init`):
- List all scaffolded files with their purposes
- Document `--force` and `--help` flags
- Show the expected project structure after scaffolding
- Explain developer ownership of scaffolded page routes
- Document email template customisation (file resolution order)

## Deployment Documentation
Document the self-hosted deployment model:
- Docker Compose setup (FreshRSS, MinIO, Mailpit for dev; production overrides)
- Environment variables (`.env.example` reference)
- SQLite database persistence (`DATABASE_PATH`)
- Production Dockerfile and multi-stage build
- Node.js adapter configuration (`@astrojs/node`)

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

## Starlight Docs Site
- Documentation content lives in `docs/src/content/docs/`
- Use Markdown or MDX format with Starlight frontmatter (`title`,
  `description`, `sidebar`)
- No H1 in body — Starlight generates the H1 from the `title` frontmatter
- Code examples must show `@community-rss/core` imports (not internal paths)
- API reference tables must include a "Since" column
- Cross-reference other docs via relative Markdown links
- Build: `npm run build` in `docs/` produces standalone static HTML in
  `docs/dist/`
- Never import from `packages/core/src/` — reference the published API only

## Changelog (`CHANGELOG.md`)
- Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
- Categories: Added, Changed, Deprecated, Removed, Fixed, Security
- Each entry is a concise, user-facing description of the change
- Reference the affected component/file (e.g., `utils/build/sync.ts`)
- Include a `Known Issues` sub-section when limitations exist
- **During feature work:** do NOT edit `CHANGELOG.md`
- **During release finalization:** move `[Unreleased]` entries to the new
  version heading, add the release date
- Maintain comparison links at the bottom of the file

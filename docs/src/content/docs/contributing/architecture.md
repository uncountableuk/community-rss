---
title: Architecture
description: Monorepo structure, execution contexts, and key architectural decisions.
---

## Monorepo Layout

The project uses NPM Workspaces with three packages:

| Workspace | Package | Purpose |
|-----------|---------|---------|
| `packages/core` | `@community-rss/core` | Published framework |
| `playground` | `playground` (private) | Reference implementation |
| `docs` | `@community-rss/docs` (private) | Documentation site |

## Execution Contexts

Business logic is organised by execution context:

| Directory | Context | APIs Available |
|-----------|---------|----------------|
| `src/utils/build/` | Node.js / Cloudflare Worker | D1, R2, Queues, fetch, crypto |
| `src/utils/client/` | Browser | DOM, window, document, fetch |
| `src/utils/shared/` | Pure functions | No platform APIs |

## Path Aliases

All cross-directory imports use path aliases:

| Alias | Maps To |
|-------|---------|
| `@utils/*` | `src/utils/*` |
| `@components/*` | `src/components/*` |
| `@routes/*` | `src/routes/*` |
| `@db/*` | `src/db/*` |
| `@core-types/*` | `src/types/*` |
| `@layouts/*` | `src/layouts/*` |
| `@fixtures/*` | `test/fixtures/*` |
| `@test/*` | `test/*` |

## Database

- **ORM:** Drizzle ORM with SQLite dialect (Cloudflare D1)
- **Schema:** `packages/core/src/db/schema.ts` (single source of truth)
- **Migrations:** Generated via `npx drizzle-kit generate` — never hand-written
- **Queries:** `packages/core/src/db/queries/` modules

## Integration Pattern

The framework is an Astro Integration that:
1. Injects API routes (`/api/v1/*`)
2. Provides base layouts and components
3. Exports Cloudflare Worker handlers (`scheduled`, `queue`)

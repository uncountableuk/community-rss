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
1. Injects API routes (`/api/v1/*`, `/api/auth/*`)
2. Provides auth pages (`/auth/signin`, `/auth/verify`)
3. Provides base layouts and components
4. Exports Cloudflare Worker handlers (`scheduled`, `queue`)

## User & Role Model

### Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| `user` | Default registered user | Read, interact (heart/star), comment |
| `admin` | Platform administrator | All user capabilities + manage feeds without domain verification |
| `system` | Internal system user | Owns community feeds imported from FreshRSS sync |

Roles are stored in the `users.role` column (`TEXT`, default `'user'`).

### System User

The **System User** (`id: 'system'`) is a special internal user that
owns all community feeds imported from FreshRSS. It is:

- Seeded automatically during database setup via `seedSystemUser()`
- Checked defensively in `syncFeeds()` to ensure it exists before
  creating feeds
- Not a real user — cannot sign in or interact

### Feed Ownership

| Owner | Verification | Feed Status |
|-------|-------------|-------------|
| System User | None (automated) | `approved` |
| Admin | Not required (privilege-based) | `approved` |
| Verified Author | Domain verification | `pending` → `approved` |

### Guest Lifecycle

1. **Anonymous** — no tracking, no cookie
2. **Guest (consented)** — `crss_guest` cookie with UUID, shadow profile
   in database (`isGuest: true`)
3. **Registered** — signed in via magic link, guest interactions
   migrated, guest profile deleted

## Authentication

- **Provider:** [better-auth](https://www.better-auth.com/) with
  magic-link plugin
- **Storage:** D1 via Drizzle adapter (`sessions`, `accounts`,
  `verifications` tables)
- **Route:** `/api/auth/[...all]` catch-all delegates to better-auth
- **Per-request instances:** Each request creates a fresh `betterAuth()`
  instance because Cloudflare Workers bindings are per-request
- **Critical:** `baseURL` must match `env.PUBLIC_SITE_URL` for cookies
  and magic link URLs to work correctly

---
title: Architecture
description: Technical architecture of the Community RSS framework.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Community RSS is an **Astro integration** that transforms any Astro project
into a community-driven RSS reader. It follows an "integration with
overrides" pattern: the framework injects backend logic while developers
own the frontend.

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js + Astro SSR | Server-side rendering |
| **Adapter** | `@astrojs/node` | Standalone Node.js server |
| **Database** | SQLite (better-sqlite3) | Persistent storage |
| **ORM** | Drizzle ORM | Type-safe queries and migrations |
| **Auth** | better-auth | Passwordless magic link authentication |
| **RSS Source** | FreshRSS | RSS aggregation and feed management |
| **Scheduling** | node-cron | In-process feed sync scheduling |
| **Storage** | MinIO (S3) | File/image uploads |
| **Email** | Nodemailer / Resend | Transactional email delivery |

## Monorepo Structure

```
/
 packages/core/     # The @community-rss/core framework
   ├── src/
   │   ├── cli/          # CLI scaffold command
   │   ├── components/   # Astro components (thin wrappers)
   │   ├── config-store.ts # Config bridge (integration → middleware)
   │   ├── db/           # Drizzle schema, migrations, queries
   │   ├── integration.ts# Astro integration entry point
   │   ├── layouts/      # Base layouts
   │   ├── middleware.ts  # Astro middleware (creates AppContext)
   │   ├── routes/       # Injected API routes
   │   ├── styles/       # Default CSS (design tokens)
   │   ├── templates/    # Default email templates
   │   ├── types/        # TypeScript types (context, options)
   │   └── utils/        # Business logic (build/, client/, shared/)
   ├── test/             # Vitest tests
   └── index.ts          # Public API exports
 playground/           # Ephemeral dev app (gitignored, rebuilt on demand)
 docs/                 # Starlight documentation site
 scripts/              # Dev tooling (reset-playground.sh, playground.env)
 feature_plans/        # Release planning documents
```

## Integration Architecture

### Route Split

The framework splits routes into two categories:

- **Injected API routes** (11) — Provided by the integration, handle
  data operations, authentication, and sync
- **Scaffolded page routes** (8) — Generated into the developer's project
  via CLI, fully customisable

### AppContext

Every request has access to `AppContext` via `context.locals.app`:

```ts
interface AppContext {
  db: BetterSQLite3Database;  // Drizzle ORM database instance
  env: EnvironmentVariables;   // Typed environment variables
  config: CommunityRssOptions; // Integration configuration
  user?: User;                 // Authenticated user (if any)
}
```

The middleware creates this context on every request, initialising the
database connection and reading config from the config-store bridge.

### Config Bridge

The integration and middleware run at different times — the integration
during Astro config setup, and the middleware at request time. They
can't share an import because Astro virtual modules aren't available
during config-load. Instead, `config-store.ts` bridges the gap:

1. `integration.ts` calls `setGlobalConfig(config)` during `astro:config:setup`
2. `middleware.ts` calls `getGlobalConfig()` on each request
3. Config is passed via `globalThis.__communityRssConfig`

This keeps the config bridge lightweight (zero Astro imports) and
works reliably in both dev and production.

### Component Composition

Components follow a strict pattern:

1. **Thin wrappers** — Components contain minimal logic; business logic
   lives in `utils/`
2. **Props-driven copy** — All user-facing strings come from `messages`
   and `labels` props
3. **CSS tokens** — All visual values use `--crss-` custom properties
4. **Slot-based extension** — Layouts use named slots for customisation

## Execution Contexts

Code is organised by where it runs:

| Directory | Environment | May Use |
|-----------|-------------|---------|
| `utils/build/` | Node.js server | `fs`, `path`, database, cron, email |
| `utils/client/` | Browser | `document`, `window`, `fetch` |
| `utils/shared/` | Both | Pure functions only (no side effects) |

<Aside type="caution">
Never import `fs` or `path` in client utils. Never import `document` or
`window` in build utils. Vitest and the build will catch these violations.
</Aside>

## Database

### Schema

Defined in Drizzle ORM TypeScript at `src/db/schema.ts`. Key tables:

| Table | Purpose |
|-------|---------|
| `user` | User accounts (managed by better-auth) |
| `session` | Active sessions |
| `feed` | RSS feed sources |
| `article` | Synced articles |
| `comment` | User comments on articles |
| `heart` | Heart/like interactions |
| `verification` | Domain verification records |

### Migrations

Generated via `drizzle-kit generate` — never hand-written. Applied
automatically on application startup.

### System User

The System User (`id: 'system'`) owns community feeds imported from
FreshRSS. It is seeded during database initialisation.

## Email Template Resolution

Templates are resolved in priority order:

1. Developer's `emailTemplateDir` directory
2. Package default templates (`src/templates/`)
3. Code-based fallback HTML

## Background Processing

Feed sync runs via **node-cron** in the same process as the Astro
server. The schedule is configurable via `syncSchedule` option or
`SYNC_SCHEDULE` environment variable.

## Path Aliases (Test Code)

| Alias | Maps To |
|-------|---------|
| `@utils/` | `src/utils/` |
| `@components/` | `src/components/` |
| `@routes/` | `src/routes/` |
| `@db/` | `src/db/` |
| `@core-types/` | `src/types/` |
| `@cli/` | `src/cli/` |
| `@fixtures/` | `test/fixtures/` |
| `@test/` | `test/` |

<Aside type="note">
Path aliases are for **test code only**. Source code uses relative imports
to ensure the package works correctly when consumed as a dependency.
</Aside>

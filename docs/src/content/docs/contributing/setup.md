---
title: Development Setup
description: Set up the Community RSS monorepo for local development.
---

import { Steps, Aside, Tabs, TabItem } from '@astrojs/starlight/components';

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 22+ | Runtime |
| npm | 10+ | Package management |
| Docker | 24+ | Dev services (FreshRSS, MinIO, Mailpit) |
| Git | 2.30+ | Version control |

<Aside type="tip">
The project includes a Dev Container configuration. Open in the Dev
Container and everything is pre-configured — Docker services, Node.js,
extensions, and the playground are all set up automatically.
</Aside>

## Getting Started

<Steps>

1. **Clone and install**

   ```bash
   git clone https://github.com/your-org/community-rss.git
   cd community-rss
   npm install
   ```

2. **Build the playground**

   The playground is an ephemeral test app that consumes `@community-rss/core`
   exactly like a real user would. It is gitignored and rebuilt on demand:

   ```bash
   npm run reset:playground
   ```

   This scaffolds pages, email templates, config files, and a `.env` from
   the CLI templates — just like `npx @community-rss/core init` would for
   a consumer.

3. **Start Docker services**

   ```bash
   docker compose up -d
   ```

   | Service | Port | Purpose |
   |---------|------|---------|
   | FreshRSS | 8080 | RSS aggregator |
   | MinIO | 9000 / 9001 | S3-compatible storage |
   | Mailpit | 1025 / 8025 | Local SMTP + email viewer |

4. **Configure FreshRSS** (first time only)

   Open `http://localhost:8080`, complete the setup wizard, and set your
   API password under Profile → API management.

5. **Start developing**

   ```bash
   npm run dev:playground
   ```

   Your site is at `http://localhost:4321`. Emails appear in Mailpit at
   `http://localhost:8025`.

</Steps>

## How the Playground Works

The playground is the heart of the development workflow. Understanding
what auto-reloads and what needs a reset saves a lot of confusion.

### What auto-reloads (instant)

Backend API routes, middleware, components, and utility functions all live
in `packages/core/`. NPM workspaces symlinks the package into the playground's
`node_modules`, so Astro/Vite sees file changes and hot-reloads instantly.

**Example:** Edit `packages/core/src/routes/api/v1/articles.ts` → save →
the browser picks up the change immediately.

### What needs a reset

Pages and email templates are **scaffolded** — copied into the playground
by the CLI `init` command. They're developer-owned files, not symlinked.
After editing a template in `packages/core/src/cli/templates/`, you need
to reset the playground to see the change:

```bash
npm run reset:playground
```

This tears down the playground and rebuilds it from scratch, but preserves
the database by default. Your test accounts, articles, and feed data survive.

**Example:** Edit `packages/core/src/cli/templates/pages/index.astro` →
run `npm run reset:playground` → restart `npm run dev:playground`.

### Full clean

If you need to start completely fresh (new database, no test data):

```bash
npm run hardreset:playground
```

## Monorepo Structure

| Workspace | Path | Purpose |
|-----------|------|---------|
| `@community-rss/core` | `packages/core/` | Framework package (published to NPM) |
| `playground` | `playground/` | Ephemeral dev app (gitignored) |
| `@community-rss/docs` | `docs/` | Starlight documentation site |

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start playground + docs servers |
| `npm run dev:playground` | Start playground only |
| `npm run dev:docs` | Start docs site only |
| `npm run reset:playground` | Rebuild playground (keeps DB + test data) |
| `npm run hardreset:playground` | Full clean rebuild (wipes DB) |
| `npm test` | Run all tests |
| `npm run test:coverage` | Coverage report (≥80% required) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Database Development

The project uses SQLite with Drizzle ORM. The database file lives at
`playground/data/community.db` and is created automatically on first run.

### Schema Changes

1. Edit `packages/core/src/db/schema.ts`
2. Generate a migration: `cd packages/core && npx drizzle-kit generate`
3. Restart the dev server — migrations apply automatically

<Aside type="caution">
Never hand-write migration files. Always use `drizzle-kit generate`.
</Aside>

### Reset the Database

If you need a clean database, use the hard reset:

```bash
npm run hardreset:playground
npm run dev:playground
```

Or delete just the database file:

```bash
rm -f playground/data/community.db
npm run dev:playground
```

## Testing

Tests use Vitest with in-memory SQLite databases.

```bash
npm test                    # Run all tests (watch mode)
npm run test:run            # Run once
npm run test:coverage       # With coverage report
```

### Coverage Requirements

| Metric | Minimum |
|--------|---------|
| Statements | 80% |
| Branches | 80% |
| Functions | 80% |
| Lines | 80% |

### Test Path Aliases

Test files use path aliases (e.g., `@utils/`, `@db/`, `@fixtures/`)
configured in `vitest.config.ts`. Source code always uses relative imports.

## Common Issues

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` to FreshRSS | Ensure `docker compose up -d` is running |
| Stale pages after template edit | Run `npm run reset:playground` |
| Test failures after schema change | Delete dev DB or use `npm run hardreset:playground` |
| Stale workspace symlinks | Run `npm install` from the root |
| Port conflicts | Check `docker compose ps` for conflicting services |

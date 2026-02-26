---
title: Development Setup
description: Set up the Community RSS monorepo for local development.
---

import { Steps, Aside } from '@astrojs/starlight/components';

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 20+ | Runtime |
| npm | 10+ | Package management |
| Docker | 24+ | Dev services (FreshRSS, MinIO, Mailpit) |
| Git | 2.30+ | Version control |

## Getting Started

<Steps>

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/community-rss.git
   cd community-rss
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   This installs all workspace dependencies and links `packages/core`
   as `@community-rss/core` in the playground.

3. **Set up environment variables**

   ```bash
   cp playground/.env.example playground/.env
   ```

   Edit `playground/.env` with your local values:

   ```ini
   DATABASE_PATH=./data/community.db
   FRESHRSS_URL=http://localhost:8080
   FRESHRSS_USER=admin
   FRESHRSS_API_PASSWORD=your-api-password
   PUBLIC_SITE_URL=http://localhost:4321
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_FROM=noreply@localhost
   ```

4. **Start Docker services**

   ```bash
   docker compose up -d
   ```

5. **Configure FreshRSS**

   Open `http://localhost:8080`, complete the setup wizard, and set your
   API password under Profile → API management.

6. **Start the playground dev server**

   ```bash
   cd playground
   npm run dev
   ```

</Steps>

## Monorepo Structure

| Workspace | Path | Purpose |
|-----------|------|---------|
| `@community-rss/core` | `packages/core/` | Framework package |
| `playground` | `playground/` | Reference app / dev testing |
| `docs` | `docs/` | Starlight documentation site |

### Key Commands

| Command | Location | Purpose |
|---------|----------|---------|
| `npm install` | Root | Install all workspace deps |
| `npm test` | Root or `packages/core/` | Run all tests |
| `npm run test:coverage` | `packages/core/` | Coverage report |
| `npm run dev` | `playground/` | Start dev server |
| `npm run dev` | `docs/` | Start docs site |
| `npm run build` | `playground/` | Production build |

## Database Development

The project uses SQLite with Drizzle ORM.

### Schema Changes

1. Edit `packages/core/src/db/schema.ts`
2. Generate a migration: `npx drizzle-kit generate`
3. Delete the dev database: `rm -f playground/data/community.db`
4. Restart the dev server — migrations apply automatically

<Aside type="caution">
Never hand-write migration files. Always use `drizzle-kit generate`.
</Aside>

## Testing

Tests use Vitest with in-memory SQLite databases.

```bash
# Run all tests
cd packages/core
npm test

# Run specific test file
npx vitest run test/utils/build/sync.test.ts

# Watch mode
npx vitest

# Coverage
npm run test:coverage
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
configured in `vitest.config.ts`. Source code uses relative imports.

## Code Quality

```bash
# Lint
npm run lint

# Format
npm run format
```

## Dev Container

The project includes a Dev Container configuration for VS Code.
Open in the Dev Container to get a pre-configured environment with
all dependencies and Docker services.

## Common Issues

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` to FreshRSS | Ensure `docker compose up -d` is running |
| Test failures after schema change | Delete dev DB and regenerate migration |
| Stale workspace symlinks | Run `npm install` from the root |
| Port conflicts | Check `docker compose ps` for conflicting services |

---
title: Local Development
description: Set up a local development environment for your Community RSS site.
---

import { Steps, Aside } from '@astrojs/starlight/components';

## Prerequisites

| Requirement | Purpose |
|-------------|---------|
| **Node.js 20+** | Runtime |
| **Docker & Docker Compose** | FreshRSS, MinIO, Mailpit |
| **npm** | Package management |

## Quick Start

<Steps>

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Copy the example env file and edit as needed:

   ```bash
   cp .env.example .env
   ```

   Key variables for local dev:

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

3. **Start Docker services**

   ```bash
   docker compose up -d
   ```

   This starts:

   | Service | Port | Purpose |
   |---------|------|---------|
   | FreshRSS | 8080 | RSS aggregator |
   | MinIO | 9000 / 9001 | S3-compatible object storage |
   | Mailpit | 1025 / 8025 | Local SMTP & email viewer |

4. **Configure FreshRSS**

   Open `http://localhost:8080` and complete the setup wizard. Then set your
   **API password** under Profile → API management. Use this as the value
   of `FRESHRSS_API_PASSWORD` in `.env`.

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Your site is available at `http://localhost:4321`.

</Steps>

## Database

The project uses **SQLite** via better-sqlite3 and Drizzle ORM. The database
file is created automatically on first run at the path specified by
`DATABASE_PATH` (defaults to `./data/community.db`).

### Migrations

Migrations are generated with Drizzle Kit:

```bash
npx drizzle-kit generate
```

<Aside type="caution">
Never hand-write migration files. Always generate them with `drizzle-kit generate` from the schema in `packages/core/src/db/schema.ts`.
</Aside>

### Reset the database

Delete the database file and restart the dev server. The schema is applied
automatically:

```bash
rm -f ./data/community.db
npm run dev
```

## Email Testing

Docker Compose includes [Mailpit](https://github.com/axllent/mailpit) for
capturing outgoing emails locally:

- **SMTP**: `localhost:1025`
- **Web UI**: `http://localhost:8025`

All magic-link and verification emails are captured in the Mailpit web UI.

## MinIO (S3 Storage)

MinIO provides local S3-compatible storage for file uploads:

- **API**: `http://localhost:9000`
- **Console**: `http://localhost:9001`

Default credentials are defined in `docker-compose.yml`.

## Common Tasks

### Rebuild after schema changes

```bash
npx drizzle-kit generate   # Generate migration
rm -f ./data/community.db  # Reset DB (dev only)
npm run dev                 # Restart — migrations apply automatically
```

### Run tests

```bash
npm test                 # All tests
npm run test:coverage    # With coverage report
```

### View Logs

```bash
docker compose logs -f freshrss   # FreshRSS logs
docker compose logs -f mailpit    # Mail logs
```

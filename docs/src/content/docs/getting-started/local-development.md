---
title: Local Development
description: >-
  Set up your local development environment with Docker and
  Dev Containers.
---

## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- VS Code with the **Dev Containers** extension
- Git

## Quick Start

```bash
# 1. Clone and start Docker infrastructure
git clone <repo-url> && cd community-rss
docker compose up -d

# 2. Attach VS Code to the dev container
# Ctrl+Shift+P → "Dev Containers: Attach to Running Container"
# → Select "community_rss_app"

# 3. Install dependencies (inside container)
npm install

# 4. Copy environment variables
cp playground/.dev.vars.example playground/.dev.vars
# Edit playground/.dev.vars — set FRESHRSS_API_PASSWORD

# 5. Apply database migrations
cd playground
npx wrangler d1 migrations apply community_db --local
cd ..

# 6. Start both dev servers (playground + docs)
npm run dev
# → Playground: http://localhost:4321
# → Docs:       http://localhost:4322
```

:::tip
`npm run dev` must be run from the **repository root** (`/app`).
Running it from `playground/` starts only the playground server.
:::

## Local Services

| Service | URL | Purpose |
|---------|-----|---------|
| Playground | http://localhost:4321 | Reference app |
| Docs | http://localhost:4322 | Documentation site |
| FreshRSS | http://localhost:8080 | RSS ingestion engine |
| Mailpit | http://localhost:8025 | Email catcher |
| MinIO Console | http://localhost:9001 | S3 storage console |

## Environment Variables

Copy the example file and set your FreshRSS API password:

```bash
cp playground/.dev.vars.example playground/.dev.vars
```

See [Configuration](/getting-started/configuration/) for the full
list of environment variables.

## FreshRSS Setup & First Sync

FreshRSS requires enabling API access and setting an API password
before the sync pipeline works. See the
[Dev Setup guide](/contributing/setup/#step-4--configure-freshrss)
for the detailed walkthrough, including how to verify API access
and trigger your first sync.

## Database Migrations

Whenever the Drizzle schema changes, regenerate and apply migrations:

```bash
cd playground
npx wrangler d1 migrations apply community_db --local
```

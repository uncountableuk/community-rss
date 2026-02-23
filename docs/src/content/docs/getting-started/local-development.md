---
title: Local Development
description: Set up your local development environment with Docker and Dev Containers.
---

## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- VS Code with Dev Containers extension
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

# 4. Start the playground dev server
npm run dev
# → http://localhost:4321

# 5. Start the docs dev server (separate terminal)
cd docs && npm run dev
# → http://localhost:4322
```

## Local Services

| Service | URL | Purpose |
|---------|-----|---------|
| Playground | http://localhost:4321 | Reference app |
| Docs | http://localhost:4322 | Documentation site |
| FreshRSS | http://localhost:8080 | RSS ingestion engine |
| Mailpit | http://localhost:8025 | Email catcher |
| MinIO Console | http://localhost:9001 | S3 storage console |

## Environment Variables

Copy the example file and fill in your FreshRSS API password:

```bash
cp playground/.dev.vars.example playground/.dev.vars
```

## Database Setup

```bash
cd playground
npx drizzle-kit generate
npx wrangler d1 migrations apply community_db --local
```

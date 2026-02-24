---
title: Dev Setup
description: >-
  Complete guide to setting up your local development environment
  and running the full feed-sync pipeline end to end.
---

## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- VS Code with the **Dev Containers** extension
- Node.js 22+ (handled automatically by the dev container)

## Step 1 — Start Docker Services

```bash
git clone <repo-url> && cd community-rss
docker compose up -d
```

This starts four services:

| Service | Container | Host URL | Purpose |
|---------|-----------|----------|---------|
| Dev Container | `community_rss_app` | — | Node 22 workspace |
| FreshRSS | `local_freshrss` | http://localhost:8080 | RSS ingestion engine |
| MinIO | `local_s3` | http://localhost:9001 | S3-compatible storage |
| Mailpit | `local_mailpit` | http://localhost:8025 | Email catcher |

## Step 2 — Attach VS Code

Open the Command Palette (`Ctrl+Shift+P`) and run
**Dev Containers: Attach to Running Container**, then select
`community_rss_app`. All remaining commands run **inside the
container**.

## Step 3 — Install Dependencies

```bash
npm install
```

This wires up all three workspaces (`packages/core`, `playground`,
`docs`) via NPM workspaces.

## Step 4 — Configure FreshRSS

FreshRSS requires **two** configuration steps before the API works.

### 4a. Initial setup (first time only)

Open http://localhost:8080 in your browser and complete the FreshRSS
installation wizard. Choose any admin password you like.

### 4b. Enable API access

1. **Administration → Authentication** — tick
   *"Allow API access (by password)"* and save.
2. **Settings → Profile → API management** — set a dedicated
   **API password** (this is separate from the login password) and
   save.

### 4c. Subscribe to at least one feed

In FreshRSS, add one or more RSS feed subscriptions so there is
content to sync.

### 4d. Set up environment variables

```bash
cp playground/.dev.vars.example playground/.dev.vars
```

Edit `playground/.dev.vars` and set `FRESHRSS_API_PASSWORD` to the
API password you created in step 4b:

```ini
FRESHRSS_URL=http://freshrss:80
FRESHRSS_USER=admin
FRESHRSS_API_PASSWORD=<your-api-password>
```

:::caution[Docker networking]
`FRESHRSS_URL` must be `http://freshrss:80` — the Docker Compose
service name — **not** `http://localhost:8080`. The dev container
and FreshRSS share the same Docker network, so `localhost` would
refer to the dev container itself.
:::

### 4e. Verify API access

You can confirm credentials are correct by requesting an auth token
directly:

```bash
curl -X POST http://freshrss:80/api/greader.php/accounts/ClientLogin \
  -d "Email=admin&Passwd=<your-api-password>" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

A successful response looks like:

```
SID=admin/581b2b5139b65903d46e9a9f42f1645c6505fd23
LSID=null
Auth=admin/581b2b5139b65903d46e9a9f42f1645c6505fd23
```

If you see `Error=BadAuthentication`, double-check that the API
password (not the login password) is correct and that API access is
enabled at the admin level.

:::note[How authentication works]
The framework uses the FreshRSS Google Reader API, which requires a
**two-step ClientLogin flow**:

1. POST `Email` + `Passwd` to `/accounts/ClientLogin` to obtain a
   hashed auth token.
2. Use the token in `Authorization: GoogleLogin auth=<token>` headers
   for all subsequent API calls.

The `FreshRssClient` class handles this automatically — it calls
`login()` lazily on the first API request and caches the token for
the lifetime of the client instance.
:::

## Step 5 — Apply Database Migrations

```bash
cd playground
npx wrangler d1 migrations apply community_db --local
cd ..
```

This creates all tables in the local D1 database (SQLite backed).

## Step 6 — Start Dev Servers

From the **repository root**:

```bash
npm run dev
```

This starts both servers in parallel:

| Server | URL | Description |
|--------|-----|-------------|
| Playground | http://localhost:4321 | Reference app |
| Docs | http://localhost:4322 | Starlight documentation |

:::tip
`npm run dev` must be run from the **root** directory (`/app`), not
from `playground/`. Running it from `playground/` starts only the
playground server.
:::

## Step 7 — Trigger a Sync

Cloudflare Pages does not support Cron Triggers locally, so the
framework provides a manual sync endpoint for development:

```bash
curl -s -X POST http://localhost:4321/api/v1/admin/sync \
  -H "Origin: http://localhost:4321" | python3 -m json.tool
```

A successful response:

```json
{
  "ok": true,
  "feedsProcessed": 3,
  "articlesEnqueued": 40,
  "articlesProcessed": 40
}
```

The `Origin` header is required — Astro's CSRF protection blocks
POST requests without a matching origin.

After syncing, visit http://localhost:4321 to see real articles from
your FreshRSS subscriptions rendered in the feed grid.

## Step 8 — Verify the API

```bash
# List articles
curl -s http://localhost:4321/api/v1/articles?limit=5 \
  | python3 -m json.tool

# Health check
curl -s http://localhost:4321/api/v1/health \
  | python3 -m json.tool
```

## Monorepo Structure

```
/app
├── packages/core/    # @community-rss/core framework
├── playground/       # Reference implementation (consumes core)
├── docs/             # Starlight documentation site
├── feature_plans/    # Feature plans and specs
└── .github/          # CI, instructions, copilot prompts
```

## Available Scripts

All scripts are run from the repository root.

| Script | Description |
|--------|-------------|
| `npm run dev` | Start playground + docs dev servers |
| `npm run build` | Build playground only |
| `npm run build:all` | Build playground + docs |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint all files |
| `npm run format` | Format all files |

## Queue Processing in Local Dev vs Production

The sync pipeline has two modes of article processing:

### Local development (current)

The admin sync endpoint (`POST /api/v1/admin/sync`) processes
articles **inline** — after `syncFeeds()` fetches articles from
FreshRSS and enqueues them, the endpoint intercepts the messages,
runs `processArticle()` and `upsertArticle()` directly, and returns
the count.

This workaround exists because `wrangler pages dev` does not
support queue consumers. It is intentionally limited to the admin
sync endpoint used during development.

### Cloudflare Workers (production)

In production, Cron Triggers and Queues work natively. The pipeline
uses the standard async flow:

```
Cron Trigger → scheduled() → syncFeeds()
  → Queue.send() → queue() → processArticle() → D1
```

The `playground/src/worker.ts` entrypoint exports both `scheduled`
and `queue` handlers on the default export object, which is the
format Cloudflare Workers expects:

```typescript
export function createExports(manifest: SSRManifest) {
  const astroExports = astroCreateExports(manifest);
  return {
    ...astroExports,
    default: {
      ...astroExports.default,
      scheduled,
      queue,
    },
    scheduled,
    queue,
  };
}
```

The `wrangler.toml` already has the correct queue and cron
configuration. When deployed to Cloudflare Workers (rather than
Pages), the `scheduled` and `queue` handlers will be invoked
automatically — no code changes required.

:::note[Pages vs Workers]
Cloudflare **Pages** does not support Cron Triggers or Queue
consumers. If you deploy to Pages, you will need a separate Worker
for the sync pipeline, or migrate the project to a Workers-only
deployment. The framework code supports both — only the deployment
target changes.
:::

## Troubleshooting

### `npm run dev` only starts one server

Make sure you run it from the **repository root** (`/app`), not from
`playground/` or `docs/`.

### Sync returns `401 Unauthorized`

FreshRSS API access requires **both**:
1. Admin-level "Allow API access" enabled
   (Administration → Authentication)
2. A dedicated API password set in your user profile
   (Settings → Profile → API management)

The API password is **not** the same as the login password.

### Sync returns `FOREIGN KEY constraint failed`

The `system` user may not exist yet. This is auto-created by
`syncFeeds()` on first run. If the error persists, check that
migrations have been applied:

```bash
cd playground
npx wrangler d1 migrations apply community_db --local
```

### `curl` to FreshRSS fails with `exit code 7`

You're probably using `localhost:8080` from inside the dev container.
Use `http://freshrss:80` instead — the containers communicate via
Docker's internal network.

### Queue errors in wrangler output

`wrangler pages dev` logs `Handler does not export a queue()
function` — this is expected and harmless. The admin sync endpoint
processes articles inline as a workaround. These errors will not
occur when deployed to Cloudflare Workers.

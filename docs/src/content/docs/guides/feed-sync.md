---
title: Feed Synchronisation
description: How the FreshRSS-to-D1 sync pipeline works
---

The Community RSS framework synchronises content from a FreshRSS
instance into a Cloudflare D1 database using a background worker
pipeline.

## Architecture Overview

```
FreshRSS ──[Cron Trigger]──→ syncFeeds()
               │                  │
               │                  ├──→ D1 (feeds)
               │                  │
               │                  └──→ Queue ──→ processArticle()
               │                                      │
               │                                      └──→ D1 (articles)
               │
               └──[ClientLogin]──→ Auth token (cached)
```

### 1. Authentication

The framework uses the FreshRSS **Google Reader API**. Authentication
is a two-step ClientLogin flow:

1. POST `Email` + `Passwd` to
   `/api/greader.php/accounts/ClientLogin`
2. Parse the `Auth=<token>` line from the response
3. Cache the token and use it in `Authorization: GoogleLogin auth=…`
   headers for all subsequent requests

The `FreshRssClient` class handles this automatically — it calls
`login()` lazily on the first API request and reuses the token for
the lifetime of the client instance.

### 2. Sync Orchestrator

A Cloudflare Cron Trigger calls the `scheduled()` handler exported
by the framework. This invokes `syncFeeds(env)` which:

1. Ensures the `system` user exists in D1 (owner of synced feeds)
2. Authenticates with FreshRSS via ClientLogin
3. Fetches all subscribed feeds
4. Upserts feed metadata into D1
5. Fetches articles for each feed
6. Enqueues each article for processing via Cloudflare Queue

### 3. Queue Consumer

The `queue()` handler processes each enqueued article:

1. **Sanitises HTML** — strips dangerous tags (scripts, iframes)
   while preserving semantic content
2. **Extracts summary** — generates a plain-text summary (max 200
   chars) for feed card display
3. **Upserts to D1** — uses `freshrss_item_id` as the idempotency
   key to prevent duplicates

### 4. Idempotency

Every article stores a `freshrss_item_id` column with a UNIQUE
index. The sync uses
`INSERT … ON CONFLICT (freshrss_item_id) DO UPDATE` to handle:

- **New articles**: inserted normally
- **Modified articles**: updated with latest content
- **Unchanged articles**: effectively a no-op

This ensures repeated Cron runs never create duplicate articles.

## Local Development vs Production

The sync pipeline behaves differently depending on the runtime
environment.

### Local development (`astro dev` / `wrangler pages dev`)

Cloudflare Pages does not support Cron Triggers or Queue consumers
locally. Instead, the framework provides a manual sync endpoint that
processes articles **inline**:

```bash
curl -s -X POST http://localhost:4321/api/v1/admin/sync \
  -H "Origin: http://localhost:4321"
```

This endpoint:
1. Calls `syncFeeds()` to fetch feeds and enqueue articles
2. Intercepts the enqueued messages
3. Runs `processArticle()` + `upsertArticle()` synchronously
4. Returns results including `articlesProcessed` count

The `Origin` header is required (Astro CSRF protection).

:::caution[Dev-only endpoint]
`POST /api/v1/admin/sync` is intended for local development. In
production, the Cron Trigger handles sync automatically. Gate this
endpoint with authentication before exposing publicly.
:::

### Cloudflare Workers (production)

In production, the standard async pipeline is used:

```
Cron → scheduled() → syncFeeds() → Queue.send()
                                      ↓
                              queue() → processArticle() → D1
```

The `wrangler.toml` configuration for queue and cron:

```toml
[[queues.producers]]
binding = "ARTICLE_QUEUE"
queue = "article-processing"

[[queues.consumers]]
queue = "article-processing"
max_batch_size = 10
max_retries = 3

[triggers]
crons = ["*/15 * * * *"]
```

The worker entrypoint must export both handlers:

```typescript
// src/worker.ts
import { scheduled, queue }
  from '@community-rss/core/workers';

export function createExports(manifest) {
  const astroExports = astroCreateExports(manifest);
  return {
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

No code changes are needed between local dev and production — only
the deployment target (Pages vs Workers) determines which path runs.

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FRESHRSS_URL` | Yes | FreshRSS instance URL |
| `FRESHRSS_USER` | Yes | FreshRSS admin username |
| `FRESHRSS_API_PASSWORD` | Yes | FreshRSS **API** password (not login password) |
| `CF_ACCESS_CLIENT_ID` | No | Cloudflare Zero Trust client ID |
| `CF_ACCESS_CLIENT_SECRET` | No | Cloudflare Zero Trust secret |

:::note[Docker networking]
In local dev, `FRESHRSS_URL` must be `http://freshrss:80` (the
Docker Compose service name), not `http://localhost:8080`.
:::

## HTML Sanitisation

Articles are sanitised using `sanitize-html` with a carefully
curated allow-list:

**Allowed tags:** headings, paragraphs, lists, links, images, code
blocks, tables, blockquotes, emphasis.

**Stripped:** scripts, iframes, event handlers, `javascript:` URLs.

**Preserved:** external image URLs (media caching processes these
asynchronously in a later release).

Links are automatically enhanced with `target="_blank"` and
`rel="noopener noreferrer"` for security.

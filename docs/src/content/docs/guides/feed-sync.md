---
title: Feed Synchronisation
description: How the FreshRSS-to-D1 sync pipeline works
---

The Community RSS framework synchronises content from a FreshRSS instance into a Cloudflare D1 database using a background worker pipeline.

## Architecture Overview

```
FreshRSS ──[Cron Trigger]──→ syncFeeds() ──→ D1 (feeds)
                                 │
                                 └──→ Queue ──→ processArticle() ──→ D1 (articles)
```

### 1. Cron Trigger

A Cloudflare Cron Trigger calls the `scheduled()` handler exported by the framework. This invokes `syncFeeds(env)` which:

1. Connects to the FreshRSS Google Reader API
2. Fetches all subscribed feeds
3. Upserts feed metadata into D1
4. Fetches articles for each feed
5. Enqueues each article for processing via Cloudflare Queue

### 2. Queue Consumer

The `queue()` handler processes each enqueued article:

1. **Sanitises HTML** — strips dangerous tags (scripts, iframes) while preserving semantic content
2. **Extracts summary** — generates a plain-text summary for feed card display
3. **Upserts to D1** — uses `freshrss_item_id` as the idempotency key to prevent duplicates

### 3. Idempotency

Every article stores a `freshrss_item_id` column with a UNIQUE index. The sync uses `INSERT ... ON CONFLICT (freshrss_item_id) DO UPDATE` to handle:

- **New articles**: inserted normally
- **Modified articles**: updated with latest content
- **Unchanged articles**: effectively a no-op

This ensures repeated Cron runs never create duplicate articles.

## Configuration

### Cron Schedule

Configure in your `wrangler.toml`:

```toml
[triggers]
crons = ["*/15 * * * *"]  # Every 15 minutes
```

### Worker Exports

In your worker entrypoint, re-export the framework handlers:

```typescript
export { scheduled, queue } from '@community-rss/core';
```

### Environment Variables

| Variable               | Description                                    |
|------------------------|------------------------------------------------|
| `FRESHRSS_URL`         | FreshRSS instance URL                          |
| `FRESHRSS_USER`        | FreshRSS admin username                        |
| `FRESHRSS_API_PASSWORD`| FreshRSS API password                          |
| `CF_ACCESS_CLIENT_ID`  | Cloudflare Zero Trust client ID (optional)     |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare Zero Trust client secret (optional) |

## HTML Sanitisation

Articles are sanitised using `sanitize-html` with a carefully curated allow-list:

**Allowed tags:** headings, paragraphs, lists, links, images, code blocks, tables, blockquotes, emphasis.

**Stripped:** scripts, iframes, event handlers, `javascript:` URLs.

**Preserved:** external image URLs (media caching processes these asynchronously in a later release).

Links are automatically enhanced with `target="_blank"` and `rel="noopener noreferrer"` for security.

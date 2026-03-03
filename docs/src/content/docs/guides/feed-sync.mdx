---
title: Feed Synchronisation
description: How Community RSS syncs feeds from FreshRSS.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Community RSS pulls articles from a **FreshRSS** instance on a configurable
schedule. The sync process runs in-process using **node-cron** — no external
queue or worker is needed.

### Architecture

```
     HTTP/API      ┌──────────────┐
  Community   │ ◄──────────────── │   FreshRSS   │
  RSS (Astro) │                   │  (Docker)    │
                   └──────────────┘
       │
  node-cron
  (in-process)
       │
       ▼

   SQLite     │
  (Drizzle)   │

```

1. **node-cron** fires on the configured schedule (default: every 30 minutes)
2. `syncFeeds()` calls the FreshRSS GReader API to fetch new items
3. New articles are mapped via `mapFreshRssItem()` and upserted into SQLite
4. Feed metadata (title, site URL, last sync time) is updated

## Configuration

### Sync Schedule

Set the cron expression in your Astro config:

```js
communityRss({
  syncSchedule: '*/15 * * * *', // every 15 minutes
});
```

Or via environment variable (takes precedence):

```ini
SYNC_SCHEDULE=*/15 * * * *
```

### FreshRSS Connection

These environment variables are required:

```ini
FRESHRSS_URL=http://freshrss:80
FRESHRSS_USER=admin
FRESHRSS_API_PASSWORD=your-api-password
```

<Aside type="tip">
The API password is separate from the FreshRSS login password. Set it under
**Profile → API management** in the FreshRSS web UI.
</Aside>

## Feed Types

### Community Feeds (System-Owned)

The **System User** (`id: 'system'`) owns feeds imported from FreshRSS.
These are global community feeds visible to all readers. The system user is
seeded automatically during database setup.

### Author Feeds

Registered authors can add their own RSS feeds (up to `maxFeeds` per author).
Author feeds are verified via domain ownership before activation.

### Admin Feeds

Admin users can add feeds without domain verification. See the
[Admin Feeds](/guides/admin-feeds/) guide.

## Manual Sync

Trigger a sync manually via the admin API:

```bash
curl -X POST http://localhost:4321/api/v1/sync \
  -H "Cookie: <admin-session-cookie>"
```

<Aside type="caution">
The sync endpoint requires admin authentication. It is not publicly accessible.
</Aside>

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| No articles appear | FreshRSS API password incorrect | Check `FRESHRSS_API_PASSWORD` in `.env` |
| Sync runs but no new items | FreshRSS has no new items | Add feeds in FreshRSS and wait for it to fetch them |
| `ECONNREFUSED` errors | FreshRSS container not running | Run `docker compose up -d freshrss` |
| Duplicate articles | Feed URL changed | The system deduplicates by item GUID; URL changes are handled |

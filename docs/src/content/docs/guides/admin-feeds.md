---
title: Admin Feeds
description: How administrators can manage feeds without domain verification.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Admin users can add and manage RSS feeds **without domain verification**.
This is useful for curating community content from sources the admin
does not own.

## Adding Admin Feeds

Admins can add feeds through the admin dashboard or the API:

### Via API

```bash
curl -X POST http://localhost:4321/api/v1/feeds \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin-session-cookie>" \
  -d '{"url": "https://example.com/feed.xml"}'
```

<Aside type="tip">
Admin feeds skip the domain verification step that regular authors must
complete. The feed is activated immediately.
</Aside>

## Feed Ownership

- **System feeds** — Imported from FreshRSS, owned by the System User (`id: 'system'`)
- **Admin feeds** — Added manually by admins, owned by the admin user
- **Author feeds** — Submitted by authors after domain verification

All feed types are synced on the same schedule and appear together in
the article stream.

## Managing Feeds

Admins can:

- **Add** feeds without domain verification
- **Remove** any feed (system, admin, or author)
- **Trigger sync** manually via `POST /api/v1/sync`
- **View sync status** and last sync time

## Feed Limits

The `maxFeeds` configuration option applies to **author** feeds only.
Admin and system feeds are not subject to this limit.

```js
communityRss({
  maxFeeds: 10, // per author — does not apply to admins
});
```

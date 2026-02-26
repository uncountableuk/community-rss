---
title: Integration
description: API reference for the communityRss() Astro integration.
---

import { Aside } from '@astrojs/starlight/components';

## communityRss()

The main entry point. Returns an Astro integration that injects API routes,
middleware, and background processing into your Astro project.

```ts
import communityRss from '@community-rss/core';

communityRss(options?: CommunityRssOptions): AstroIntegration
```

### What It Does

1. **Injects API routes** — 11 RESTful endpoints under `/api/v1/`
2. **Injects middleware** — Authentication, AppContext setup, error handling
3. **Starts background processing** — node-cron feed sync on the configured schedule
4. **Initialises the database** — Creates/migrates the SQLite database on startup

### Usage

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import communityRss from '@community-rss/core';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    communityRss({
      maxFeeds: 10,
      syncSchedule: '*/15 * * * *',
    }),
  ],
});
```

## CommunityRssOptions

See [Configuration](/getting-started/configuration/) for the full options
reference.

## Injected Routes

The integration injects the following API routes:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/articles` | List articles (paginated) |
| `GET` | `/api/v1/articles/:id` | Get single article |
| `POST` | `/api/v1/articles/:id/comments` | Add comment |
| `POST` | `/api/v1/articles/:id/heart` | Toggle heart/like |
| `GET` | `/api/v1/feeds` | List feeds |
| `POST` | `/api/v1/feeds` | Submit feed |
| `POST` | `/api/v1/feeds/verify` | Verify domain ownership |
| `POST` | `/api/v1/sync` | Trigger feed sync (admin) |
| `ALL` | `/api/v1/auth/*` | better-auth endpoints |
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/admin/stats` | Admin statistics |

<Aside type="note">
Page routes (homepage, article view, auth pages, etc.) are **not** injected.
They are scaffolded into your project via `npx @community-rss/core init`
and are developer-owned.
</Aside>

## Middleware

The injected middleware runs on every request and:

1. Creates the `AppContext` (`context.locals.app`) with `db`, `env`, and `config`
2. Validates session cookies via better-auth
3. Attaches the authenticated user to `context.locals.app.user`

## AppContext

All route handlers access shared context via `context.locals.app`:

```ts
interface AppContext {
  db: BetterSQLite3Database;
  env: EnvironmentVariables;
  config: CommunityRssOptions;
  user?: User;
}
```

## Exports

The package exports types and utilities for use in your pages:

```ts
import communityRss from '@community-rss/core';
import type {
  CommunityRssOptions,
  AppContext,
  EnvironmentVariables,
} from '@community-rss/core';
```

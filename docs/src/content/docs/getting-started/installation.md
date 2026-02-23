---
title: Installation
description: How to install and set up @community-rss/core in your Astro project.
---

## Prerequisites

- Node.js 22 or later
- An Astro 5.x project
- Cloudflare account (for deployment)

## Install the Package

```bash
npm install @community-rss/core
```

## Add the Integration

Add `communityRss()` to your Astro config:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import communityRss from '@community-rss/core';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    communityRss({
      maxFeeds: 5,
      commentTier: 'registered',
    }),
  ],
});
```

## Configure Wrangler

Create a `wrangler.toml` with D1, R2, and Queue bindings:

```toml
name = "my-community"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "community_db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "community-images"

[[queues.producers]]
binding = "ARTICLE_QUEUE"
queue = "article-processing"
```

## Next Steps

- [Configuration options](/getting-started/configuration/)
- [Local development setup](/getting-started/local-development/)

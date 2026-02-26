---
title: Installation
description: How to install and set up @community-rss/core in your Astro project.
---

## Prerequisites

- Node.js 22 or later
- An Astro 5.x project
- Docker (for local development services)

## Install the Package

```bash
npm install @community-rss/core
```

## Scaffold Your Project

Run the CLI to scaffold pages, email templates, and configuration files:

```bash
npx @community-rss/core init
```

This creates:

- **8 page routes** in `src/pages/` (homepage, article detail, auth pages, profile, terms)
- **3 email templates** in `src/email-templates/` (sign-in, welcome, email-change)
- **Configuration files**: `astro.config.mjs`, `.env.example`, `docker-compose.yml`, `src/styles/theme.css`

All scaffolded files are **developer-owned** — you can customise them freely.

:::tip
Use `--force` to overwrite existing files:
```bash
npx @community-rss/core init --force
```
:::

## Configure Astro

The scaffold creates an `astro.config.mjs` for you. If you already have one,
add the integration manually:

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
      maxFeeds: 5,
      commentTier: 'registered',
    }),
  ],
});
```

## Set Up Environment Variables

Copy the scaffolded example and fill in your values:

```bash
cp .env.example .env
```

See [Configuration](/getting-started/configuration/) for the full list of
environment variables.

## Start Docker Services

The scaffold includes a `docker-compose.yml` for local development services:

```bash
docker compose up -d
```

This starts FreshRSS, MinIO, and Mailpit. See
[Local Development](/getting-started/local-development/) for details.

## Next Steps

- [Configuration options](/getting-started/configuration/)
- [Local development setup](/getting-started/local-development/)
- [Deployment](/getting-started/deployment/)

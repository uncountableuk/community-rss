---
title: Integration Factory
description: API reference for the communityRss() integration factory.
---

## `communityRss(options?)`

The main entry point for consumers. Returns an Astro integration that
injects routes, components, and layouts.

```js
import communityRss from '@community-rss/core';
```

**Since:** 0.1.0

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `CommunityRssOptions` | No | Framework configuration |

## Returns

`AstroIntegration` — an Astro integration instance.

## Injected Routes

| Route | Method | Since | Description |
|-------|--------|-------|-------------|
| `/api/v1/health` | GET | 0.1.0 | Health check endpoint |

## Worker Exports

The package also exports Cloudflare Worker handlers:

```js
// In your worker entrypoint
export { scheduled, queue } from '@community-rss/core/workers';
```

| Export | Type | Since | Description |
|--------|------|-------|-------------|
| `scheduled` | Cron handler | 0.1.0 | Feed sync trigger (stub) |
| `queue` | Queue consumer | 0.1.0 | Article processor (stub) |

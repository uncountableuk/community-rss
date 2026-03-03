---
title: Routes
description: API reference for all injected API routes and scaffolded page routes.
---

import { Aside } from '@astrojs/starlight/components';

## Route Architecture

Community RSS splits routes into two categories:

- **Injected API routes** — Provided by the integration, not editable
- **Scaffolded page routes** — Generated into your project, fully customisable

## Injected API Routes

These routes are injected automatically by the `communityRss()` integration.
All API routes use the `/api/v1/` namespace.

### Articles

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/articles` | Public | List articles with pagination and filtering |
| `GET` | `/api/v1/articles/:id` | Public | Get a single article by ID |
| `POST` | `/api/v1/articles/:id/comments` | Registered+ | Add a comment to an article |
| `POST` | `/api/v1/articles/:id/heart` | Guest+ | Toggle heart/like on an article |

#### Query Parameters (List Articles)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Items per page (max 100) |
| `feed` | `string` | — | Filter by feed ID |
| `search` | `string` | — | Full-text search |

### Feeds

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/feeds` | Public | List all active feeds |
| `POST` | `/api/v1/feeds` | Author+ | Submit a new feed |
| `POST` | `/api/v1/feeds/verify` | Author+ | Verify domain ownership |

### Sync

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/sync` | Admin | Trigger a manual feed sync |

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `ALL` | `/api/v1/auth/*` | Public | better-auth endpoints (magic link, session, etc.) |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/admin/stats` | Admin | Site statistics and metrics |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/health` | Public | Health check endpoint |

## Scaffolded Page Routes

These pages are generated into your project by `npx @community-rss/core init`.
You own these files and can modify them freely.

| File | URL Path | Purpose |
|------|----------|---------|
| `src/pages/index.astro` | `/` | Homepage with article feed |
| `src/pages/article/[id].astro` | `/article/:id` | Single article view |
| `src/pages/feeds.astro` | `/feeds` | Feed directory |
| `src/pages/submit.astro` | `/submit` | Feed submission form |
| `src/pages/profile.astro` | `/profile` | User profile management |
| `src/pages/admin.astro` | `/admin` | Admin dashboard |
| `src/pages/auth/signin.astro` | `/auth/signin` | Sign-in page |
| `src/pages/auth/signup.astro` | `/auth/signup` | Sign-up page |

<Aside type="tip">
Page routes import framework components and access `context.locals.app`
for data. See [Customisation](/guides/customisation/) for details on
modifying pages.
</Aside>

## Error Responses

All API routes return consistent error responses:

```json
{
  "error": "Unauthorized",
  "message": "You must be signed in to perform this action",
  "statusCode": 401
}
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request (validation error) |
| `401` | Not authenticated |
| `403` | Insufficient permissions |
| `404` | Resource not found |
| `429` | Rate limited |
| `500` | Internal server error |

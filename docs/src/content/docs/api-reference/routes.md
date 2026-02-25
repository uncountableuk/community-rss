---
title: Routes
description: All routes injected by the Community RSS integration
---

The `@community-rss/core` integration injects the following routes
into your Astro project.

## API Routes

### Content APIs

| Route | Method | Since | Description |
|-------|--------|-------|-------------|
| `/api/v1/health` | GET | 0.1.0 | Health check — validates integration wiring |
| `/api/v1/articles` | GET | 0.1.0 | Paginated article listing |

### Auth APIs

| Route | Method | Since | Description |
|-------|--------|-------|-------------|
| `/api/auth/[...all]` | ALL | 0.3.0 | better-auth catch-all (sign-in, sign-out, session, magic link) |

Key endpoints handled by the catch-all:

| Path | Method | Description |
|------|--------|-------------|
| `/api/auth/sign-in/magic-link` | POST | Request a magic link email |
| `/api/auth/magic-link/verify` | GET | Verify a magic link token |
| `/api/auth/get-session` | GET | Get current session |
| `/api/auth/sign-out` | POST | Sign out / destroy session |

### Admin APIs

| Route | Method | Since | Description |
|-------|--------|-------|-------------|
| `/api/v1/admin/sync` | POST | 0.2.0 | Manually trigger FreshRSS sync |
| `/api/v1/admin/feeds` | POST | 0.3.0 | Create admin feed |
| `/api/v1/admin/feeds` | GET | 0.3.0 | List admin's feeds |
| `/api/v1/admin/feeds` | DELETE | 0.3.0 | Delete a feed (`?id=feedId`) |

Admin endpoints require an authenticated session with `role: 'admin'`.

### Dev APIs

| Route | Method | Since | Description |
|-------|--------|-------|-------------|
| `/api/dev/seed` | GET | 0.3.0 | Seed database (dev-only, guarded by `import.meta.env.DEV`) |

## Pages

| Route | Since | Description |
|-------|-------|-------------|
| `/` | 0.1.0 | Homepage with article feed grid |
| `/article/[id]` | 0.2.0 | Article detail page |
| `/auth/signin` | 0.3.0 | Magic link sign-in form |
| `/auth/verify` | 0.3.0 | Magic link verification landing page |

## Authorization

| Endpoint | Auth Required | Role Required |
|----------|--------------|---------------|
| `/api/v1/health` | No | — |
| `/api/v1/articles` | No | — |
| `/api/v1/admin/sync` | No* | — |
| `/api/v1/admin/feeds` | Yes | `admin` |
| `/api/auth/*` | Varies | — |
| `/api/dev/seed` | No | — (dev-only) |

\* The sync endpoint is not currently gated by authentication. It
should be protected before production use.

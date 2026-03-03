---
title: Authentication
description: How authentication works in Community RSS.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Community RSS uses [better-auth](https://www.better-auth.com/) for
passwordless authentication via **magic links**. Users sign in by entering
their email address and clicking a link delivered to their inbox.

## How It Works

1. User enters their email on the sign-in page
2. The server generates a magic link and sends it via email
3. User clicks the link → a session is created
4. The session cookie authenticates subsequent requests

<Aside type="tip">
There are no passwords to manage. Authentication is entirely email-based.
</Aside>

## User Roles

| Role | Capabilities |
|------|-------------|
| **Guest** | Read articles, react (if enabled) |
| **Registered** | Guest + comment, manage profile |
| **Author** | Registered + submit feeds, verify domains |
| **Admin** | Full access: manage users, feeds, sync, settings |

The first user to sign up is automatically promoted to **Admin**.

## Configuration

Authentication is configured through environment variables:

```ini
PUBLIC_SITE_URL=http://localhost:4321
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@localhost
```

For production, use [Resend](https://resend.com/) for reliable email delivery:

```ini
RESEND_API_KEY=re_xxxxxxxxxxxx
SMTP_FROM=noreply@example.com
```

## Session Management

Sessions are stored in the SQLite database and managed by better-auth.
The session cookie is HTTP-only and secure (in production).

### Session Duration

Sessions expire after 7 days of inactivity. Active sessions are extended
automatically.

## Middleware

The framework injects authentication middleware that:

1. Validates the session cookie on every request
2. Populates `context.locals.app` with the authenticated user (if any)
3. Protects API routes that require authentication

## Protected Routes

Routes that require authentication return `401 Unauthorized` for
unauthenticated requests. Admin routes return `403 Forbidden` for
non-admin users.

| Route Pattern | Required Role |
|---------------|--------------|
| `GET /api/v1/articles` | Public |
| `POST /api/v1/articles/*/comments` | Registered+ |
| `POST /api/v1/feeds` | Author+ |
| `POST /api/v1/sync` | Admin |
| `GET /api/v1/admin/*` | Admin |

## Customising Auth Pages

The sign-in and sign-up pages are **scaffolded** into your project via
the CLI (`npx @community-rss/core init`). You own these pages and can
customise them freely:

- `src/pages/auth/signin.astro`
- `src/pages/auth/signup.astro`

The `AuthButton` component handles the client-side form submission and
accepts `messages` and `labels` props for full copy customisation.

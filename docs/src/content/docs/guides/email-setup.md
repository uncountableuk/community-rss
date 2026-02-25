---
title: Email Setup
description: Configure email delivery for magic link authentication
---

Community RSS sends transactional emails for magic link sign-in.
The framework supports two transport modes:

- **Mailpit** (local development) — emails are captured locally
- **Resend** (production) — emails are delivered via the Resend API

## Local Development (Mailpit)

Mailpit is included in the Docker Compose setup and runs automatically.
No configuration is needed — emails are routed to Mailpit's HTTP API.

**View captured emails:** [http://localhost:8025](http://localhost:8025)

### How It Works

When `RESEND_API_KEY` is **not set**, the framework sends emails via
Mailpit's REST API at `http://{SMTP_HOST}:8025/api/v1/send`.

### Environment Variables

```env
# .dev.vars
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_FROM=noreply@localhost
```

These are pre-configured in the Docker Compose setup.

## Production (Resend)

For production deployments, use [Resend](https://resend.com/) for
reliable email delivery.

### Setup

1. Create a Resend account at [resend.com](https://resend.com/)
2. Add and verify your domain
3. Create an API key
4. Set the environment variable:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

When `RESEND_API_KEY` is set, the framework automatically uses the
Resend API instead of SMTP.

## EmailConfig Options

Configure email settings via the integration options:

```js
// astro.config.mjs
import communityRss from '@community-rss/core';

export default defineConfig({
  integrations: [
    communityRss({
      email: {
        from: 'Community RSS <noreply@yourdomain.com>',
        appName: 'My Community',
      },
    }),
  ],
});
```

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `from` | `string` | `'Community RSS <noreply@localhost>'` | Sender address for magic link emails |
| `appName` | `string` | `'Community RSS'` | Application name shown in email templates |

## Email Template

Magic link emails include:

- A branded "Sign in to {appName}" subject line
- HTML body with a styled sign-in button
- The magic link URL (valid for 5 minutes)
- A fallback plain-text URL for email clients that block HTML

## Troubleshooting

### Emails Not Arriving (Local Dev)

1. Check Docker Compose is running: `docker compose ps`
2. Verify Mailpit is accessible: [http://localhost:8025](http://localhost:8025)
3. Check the `SMTP_HOST` variable matches your Docker service name

### Emails Not Arriving (Production)

1. Verify `RESEND_API_KEY` is set in your Cloudflare Worker secrets
2. Check the Resend dashboard for delivery logs
3. Ensure your sending domain is verified in Resend

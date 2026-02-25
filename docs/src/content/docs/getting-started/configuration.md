---
title: Configuration
description: All available configuration options for @community-rss/core.
---

## CommunityRssOptions

The `communityRss()` integration factory accepts an optional configuration
object. All properties have sensible defaults.

| Name | Type | Required | Default | Since | Description |
|------|------|----------|---------|-------|-------------|
| `maxFeeds` | `number` | No | `5` | 0.1.0 | Maximum feeds per verified author |
| `commentTier` | `'verified' \| 'registered' \| 'guest'` | No | `'registered'` | 0.1.0 | Minimum user tier required to comment |
| `email` | `EmailConfig` | No | See below | 0.3.0 | Email delivery configuration |

### EmailConfig

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `from` | `string` | `'Community RSS <noreply@localhost>'` | Sender address for magic link emails |
| `appName` | `string` | `'Community RSS'` | Application name shown in email subject and body |

## Usage

```js
// astro.config.mjs
import communityRss from '@community-rss/core';

export default defineConfig({
  integrations: [
    communityRss({
      maxFeeds: 10,
      commentTier: 'guest',
      email: {
        from: 'My Community <noreply@example.com>',
        appName: 'My Community',
      },
    }),
  ],
});
```

## CSS Design Tokens

The framework ships with CSS custom properties for all visual values.
Override tokens in your own stylesheet to customise the appearance:

```css
:root {
  --crss-brand-primary: #0ea5e9;
  --crss-brand-accent: #06b6d4;
  --crss-font-family: 'Inter', sans-serif;
}
```

See the [CSS Tokens Reference](/api-reference/options/#css-tokens) for
the full list of available tokens.

## Environment Variables

The following environment variables must be set in your `.dev.vars` file
(for local development) or as Cloudflare secrets (for production).

### FreshRSS Connection

| Variable | Required | Description |
|----------|----------|-------------|
| `FRESHRSS_URL` | Yes | FreshRSS instance URL (e.g., `http://freshrss:80`) |
| `FRESHRSS_USER` | Yes | FreshRSS admin username |
| `FRESHRSS_API_PASSWORD` | Yes | FreshRSS **API** password (set in Profile → API management; not the login password) |
| `CF_ACCESS_CLIENT_ID` | No | Cloudflare Zero Trust client ID |
| `CF_ACCESS_CLIENT_SECRET` | No | Cloudflare Zero Trust client secret |

### General

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_SITE_URL` | Yes | Externally-accessible site URL (e.g., `http://localhost:4321`) |

### Email & Authentication

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | Yes | SMTP host for email delivery (e.g., `mailpit` for local dev) |
| `SMTP_PORT` | Yes | SMTP port (e.g., `1025` for Mailpit) |
| `SMTP_FROM` | Yes | Default email sender address |
| `RESEND_API_KEY` | No | Resend API key for production email delivery. When set, emails use Resend instead of SMTP. |

See the [Email Setup](/guides/email-setup/) guide for details.

### Worker Exports

Re-export the framework's background handlers in your worker entrypoint:

```typescript
export { scheduled, queue } from '@community-rss/core';
```

Configure your Cron schedule in `wrangler.toml`:

```toml
[triggers]
crons = ["*/15 * * * *"]  # Sync every 15 minutes
```

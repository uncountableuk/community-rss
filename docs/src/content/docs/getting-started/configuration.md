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
| `commentTier` | `CommentTier` | No | `'registered'` | 0.1.0 | Minimum user tier required to comment |
| `databasePath` | `string` | No | `'./data/community.db'` | 0.4.0 | Path to the SQLite database file |
| `syncSchedule` | `string` | No | `'*/30 * * * *'` | 0.4.0 | Cron expression for feed sync schedule |
| `emailTemplateDir` | `string` | No | `'./src/email-templates'` | 0.4.0 | Directory for custom email templates |
| `email` | `EmailConfig` | No | See below | 0.3.0 | Email delivery configuration |

### EmailConfig

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `from` | `string` | `'Community RSS <noreply@localhost>'` | Sender address for magic link emails |
| `appName` | `string` | `'Community RSS'` | Application name shown in email subject and body |

## Usage

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
      commentTier: 'guest',
      databasePath: './data/community.db',
      syncSchedule: '*/15 * * * *',
      emailTemplateDir: './src/email-templates',
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
Override tokens in your `theme.css` or any stylesheet:

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

The following environment variables must be set in your `.env` file.

### FreshRSS Connection

| Variable | Required | Description |
|----------|----------|-------------|
| `FRESHRSS_URL` | Yes | FreshRSS instance URL (e.g., `http://freshrss:80`) |
| `FRESHRSS_USER` | Yes | FreshRSS admin username |
| `FRESHRSS_API_PASSWORD` | Yes | FreshRSS **API** password (set in Profile → API management; not the login password) |

### Database

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_PATH` | No | Path to the SQLite database file (defaults to `./data/community.db`) |

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

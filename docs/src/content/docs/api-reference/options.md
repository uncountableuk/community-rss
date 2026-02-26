---
title: Options Reference
description: Complete reference for CommunityRssOptions configuration.
---

## CommunityRssOptions

```ts
interface CommunityRssOptions {
  maxFeeds?: number;
  commentTier?: CommentTier;
  databasePath?: string;
  syncSchedule?: string;
  emailTemplateDir?: string;
  email?: EmailConfig;
}
```

### maxFeeds

- **Type**: `number`
- **Default**: `5`
- **Since**: 0.1.0

Maximum number of feeds a verified author can submit. Does not apply
to admin or system feeds.

### commentTier

- **Type**: `CommentTier`
- **Default**: `'registered'`
- **Since**: 0.1.0

Minimum user role required to post comments.

```ts
type CommentTier = 'guest' | 'registered' | 'author' | 'admin';
```

### databasePath

- **Type**: `string`
- **Default**: `'./data/community.db'`
- **Since**: 0.4.0

File path for the SQLite database. The directory is created automatically
if it does not exist. Can also be set via the `DATABASE_PATH` environment
variable.

### syncSchedule

- **Type**: `string`
- **Default**: `'*/30 * * * *'`
- **Since**: 0.4.0

Cron expression controlling how often feeds are synced from FreshRSS.
Uses standard 5-field cron syntax (minute, hour, day-of-month, month,
day-of-week).

Common values:

| Expression | Frequency |
|------------|-----------|
| `*/5 * * * *` | Every 5 minutes |
| `*/15 * * * *` | Every 15 minutes |
| `*/30 * * * *` | Every 30 minutes (default) |
| `0 * * * *` | Every hour |

### emailTemplateDir

- **Type**: `string`
- **Default**: `'./src/email-templates'`
- **Since**: 0.4.0

Directory containing custom email templates. Templates in this directory
override the built-in defaults. See [Email Setup](/guides/email-setup/)
for template details.

### email

- **Type**: `EmailConfig`
- **Default**: See below
- **Since**: 0.3.0

```ts
interface EmailConfig {
  from?: string;
  appName?: string;
}
```

| Property | Default | Description |
|----------|---------|-------------|
| `from` | `'Community RSS <noreply@localhost>'` | Email sender address |
| `appName` | `'Community RSS'` | App name used in email subjects and `{{appName}}` template variable |

## CSS Tokens

All CSS custom properties use the `--crss-` prefix. See the
[Theming](/guides/theming/) guide for the complete token list.

## Environment Variables

Environment variables can override or supplement options. See
[Configuration](/getting-started/configuration/#environment-variables)
for the full list.

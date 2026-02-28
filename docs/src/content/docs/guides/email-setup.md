---
title: Email Setup
description: Configure email delivery for magic links and notifications.
---

import { Aside, Tabs, TabItem } from '@astrojs/starlight/components';

## Overview

Community RSS sends transactional emails for:

- **Magic link sign-in** — passwordless authentication
- **Domain verification** — author feed verification
- **Notifications** — optional comment/reply alerts

## Providers

<Tabs>
<TabItem label="Development (Mailpit)">

Docker Compose includes [Mailpit](https://github.com/axllent/mailpit) for
local email testing. All emails are captured and viewable at
`http://localhost:8025`.

```ini
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@localhost
```

No additional setup is needed.

</TabItem>
<TabItem label="Production (Resend)">

For production, use [Resend](https://resend.com/) for reliable delivery:

```ini
RESEND_API_KEY=re_xxxxxxxxxxxx
SMTP_FROM=noreply@example.com
```

When `RESEND_API_KEY` is set, emails are sent via the Resend API instead
of raw SMTP. Remove `SMTP_HOST` and `SMTP_PORT` when using Resend.

</TabItem>
<TabItem label="Custom SMTP">

Any SMTP server can be used:

```ini
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_FROM=noreply@example.com
```

</TabItem>
</Tabs>

## Email Templates

Community RSS uses a **4-step resolution chain** for email rendering:

1. **Custom code templates** — Developer-registered rendering functions
2. **Astro templates** — `.astro` email components rendered via Container API (developer → package)
3. **Developer HTML** — `{{variable}}` templates in your `emailTemplateDir`
4. **Code-based fallbacks** — Minimal inline HTML

Astro templates are the primary rendering path. The CLI scaffolds editable
`.astro` templates into your project. Developers can also drop in a plain
`.html` file as a simpler alternative.

### Available Templates

| Template | Variables | Purpose |
|----------|-----------|---------|
| `SignInEmail.astro` | `url`, `appName`, `greeting`, `theme` | Sign-in magic link |
| `WelcomeEmail.astro` | `url`, `appName`, `greeting`, `theme` | Welcome email |
| `EmailChangeEmail.astro` | `verificationUrl`, `appName`, `greeting`, `theme` | Email change verification |

### Customising Astro Email Templates

The scaffolded `.astro` templates in `src/email-templates/` are yours to
edit. They import the shared `EmailLayout` from the core package:

```astro
---
import EmailLayout from '@community-rss/core/templates/email/EmailLayout.astro';

const { url, appName = 'My Community', greeting = 'Hi there,', theme = {} } = Astro.props;
const colors = theme.colors ?? {};
---

<EmailLayout appName={appName} theme={theme}>
  <p>{greeting}</p>
  <p>Click below to sign in:</p>
  <a
    href={url}
    style={`background-color: ${colors.primary ?? '#4f46e5'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;`}
  >
    Sign In
  </a>
</EmailLayout>
```

### Alternative: HTML Templates

For simpler customisations, create a `.html` file in the same directory.
Use `{{variable}}` placeholders and an HTML comment for the subject line:

```html
<!DOCTYPE html>
<html>
<body>
  <h1>Sign in to {{appName}}</h1>
  <p>Click the link below to sign in:</p>
  <a href="{{url}}">Sign In</a>
</body>
</html>
```

<Aside type="tip">
Templates are plain HTML files. You can use any HTML email tooling
(MJML, Maizzle, etc.) to generate them — just place the final HTML
in the template directory.
</Aside>

### Subject Lines

Subject lines are managed by the email service, not inside the templates
themselves. Override them via the `email.subjects` configuration:

```js
communityRss({
  email: {
    subjects: {
      'sign-in': ({ appName }) => `Log in to ${appName}`,
      'welcome': 'Welcome aboard!',
      'email-change': 'Please confirm your new email',
    },
  },
});
```

| Template | Default Subject |
|----------|----------------|
| `sign-in` | `Sign in to {appName}` |
| `welcome` | `Welcome to {appName}! Verify your account` |
| `email-change` | `Confirm your new email address — {appName}` |

For HTML templates, you can also embed a subject as an HTML comment at the
top of the file: `<!-- subject: My Custom Subject -->`

### Template Directory Configuration

Set the template directory in your Astro config:

```js
communityRss({
  emailTemplateDir: './src/email-templates',
});
```

The CLI scaffolds example `.astro` templates when you run `npx @community-rss/core init`.

### Theme Configuration

Pass brand colours to all email templates via the integration config:

```js
communityRss({
  email: {
    theme: {
      colors: {
        primary: '#4f46e5',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textMuted: '#64748b',
        border: '#e2e8f0',
      },
    },
  },
});
```

<Aside type="caution">
Email clients don't support CSS custom properties (`var()`). Use inline
styles with concrete colour values in email templates.
</Aside>

## Email Configuration

### Sender Address

Configure the sender address and app name:

```js
communityRss({
  email: {
    from: 'My Community <noreply@example.com>',
    appName: 'My Community',
  },
});
```

The `appName` value is available as `{{appName}}` in all email templates.

## Testing Emails

1. Start Mailpit via Docker Compose: `docker compose up -d`
2. Trigger a sign-in from your dev site
3. Open `http://localhost:8025` to view the captured email
4. Click the magic link to complete sign-in

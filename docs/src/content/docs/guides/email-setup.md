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

Community RSS uses a **5-step resolution chain** for email rendering:

1. **Custom code templates** — Developer-registered rendering functions
2. **Developer HTML** — `{{variable}}` templates in your `emailTemplateDir`
3. **Astro Container API** — `.astro` email components rendered server-side
4. **Package HTML** — Default `{{variable}}` templates shipped with the framework
5. **Code-based fallbacks** — Minimal inline HTML

Developer HTML templates take priority, so your customisations are always
used when present.

### Available Templates

| Template | Variables | Purpose |
|----------|-----------|---------|
| `sign-in.html` | `{{url}}`, `{{appName}}` | Sign-in magic link |
| `welcome.html` | `{{url}}`, `{{appName}}` | Welcome email |
| `email-change.html` | `{{verificationUrl}}`, `{{appName}}` | Email change verification |

### Customising Templates

Create your own templates in the `emailTemplateDir` directory:

```
src/
  email-templates/
    magic-link.html
    verify-domain.html
    welcome.html
```

Use `{{variable}}` placeholders that match the variables listed above:

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

### Template Directory Configuration

Set the template directory in your Astro config:

```js
communityRss({
  emailTemplateDir: './src/email-templates',
});
```

The CLI scaffolds example templates when you run `npx @community-rss/core init`.

## Astro Email Components (Container API)

The framework also ships `.astro` email components that render via the
Astro Container API. These are used as step 3 in the resolution chain
when no developer HTML template is found.

Built-in Astro email templates:
- `EmailLayout.astro` — Shared table-based layout
- `SignInEmail.astro` — Magic link sign-in
- `WelcomeEmail.astro` — Post-registration welcome
- `EmailChangeEmail.astro` — Email change verification

### Creating Custom Astro Email Templates

To create your own `.astro` email component:

```astro
---
// src/templates/email/MyEmail.astro
import EmailLayout from '@community-rss/core/templates/email/EmailLayout.astro';

interface Props {
  url: string;
  appName: string;
}

const { url, appName } = Astro.props;
---
<EmailLayout title={`Welcome to ${appName}`}>
  <tr>
    <td style="padding: 20px; text-align: center;">
      <h1 style="color: #0f172a;">Welcome!</h1>
      <a href={url} style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Get Started
      </a>
    </td>
  </tr>
</EmailLayout>
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

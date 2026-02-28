# Copilot Instructions for Community RSS Site

## Overview
This project is built with `@community-rss/core`, an Astro integration
that provides a self-hosted community RSS reader. The framework owns API
routes, middleware, and core components. You own pages, email templates,
`theme.css`, and proxy component wrappers.

## Design Tokens
The framework uses a three-tier CSS custom property system:

- **Tier 1 — Reference** (`--crss-ref-*`): Raw palette values
- **Tier 2 — System** (`--crss-sys-*`): Semantic roles (e.g., `--crss-sys-color-primary`)
- **Tier 3 — Component** (`--crss-comp-*`): Component-scoped overrides

Override tokens in `src/styles/theme.css` — your un-layered styles always
win over the framework's layered defaults. Never use hardcoded hex/rgb
colour values; always reference a `--crss-*` token.

```css
/* src/styles/theme.css — your overrides */
:root {
  --crss-sys-color-primary: #4f46e5;
  --crss-comp-card-bg: #1e293b;
}
```

## Astro Actions
Use Astro Actions for all server communication. Handlers are registered in
`src/actions/index.ts` — call them via the built-in action system:

```typescript
import { actions } from 'astro:actions';
const result = await actions.fetchArticles({ page: 1, tab: 'latest' });
```

Do NOT construct manual `fetch()` calls to `/api/v1/` endpoints. The
Action system handles serialisation, validation, and error handling.

## Component Customisation
Components accept `messages` and `labels` props for all user-facing text.
Override them in your page files:

```astro
<MagicLinkForm messages={{ heading: 'Welcome Back', submitLabel: 'Send Link' }} />
```

## Proxy Component Wrappers
Your `src/components/` files are thin wrappers around core components.
They import from `@community-rss/core/components/*` and own the `<style>`
block. Core owns logic — your styles survive package updates.

Rules for proxy wrappers:
- Import core component from `@community-rss/core/components/*`
- Pass all props through via `{...Astro.props}`
- No business logic, no API calls, no data transformation
- Only: styling overrides, slot content, surrounding markup

## Email Templates
Customise emails by editing the `.astro` files in `src/email-templates/`:
- `SignInEmail.astro` — Magic link email
- `WelcomeEmail.astro` — Sent after registration
- `EmailChangeEmail.astro` — Email change verification

These are full Astro components that import the shared `EmailLayout`
from the core package. Edit the markup, styles, or structure freely.
Theme values are available via the `theme` prop.

Alternatively, drop in a plain `.html` file (e.g., `sign-in.html`) with
`{{variable}}` placeholders — the framework will use it as an override.

Subject lines are set in the email service configuration or default
to sensible values per email type (e.g., "Sign in to {appName}").

## Protected Areas — DO NOT MODIFY
- **`node_modules/@community-rss/core/`** — Never fork or patch
- **Injected API routes** (`/api/v1/*`, `/api/auth/*`) — Never hand-edit
- **Framework middleware** — Never override or replace

Instead, use:
- `theme.css` for visual customisation
- `messages`/`labels` props for text customisation
- Action handlers for server logic customisation
- Proxy wrappers for component styling

## Developer-Owned Files
These files are yours to modify freely:
- `src/pages/*.astro` — Page routes
- `src/styles/theme.css` — Token overrides
- `src/email-templates/*.astro` — Astro email templates
- `src/components/*.astro` — Proxy wrapper components
- `src/actions/index.ts` — Action registration
- `astro.config.mjs` — Integration configuration

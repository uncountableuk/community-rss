# Copilot Instructions for Community RSS Site

## Overview
This project is built with `@community-rss/core`, an Astro integration
that provides a self-hosted community RSS reader. The framework owns API
routes, middleware, page routes, and core components. You customise your
site through a 4-level progressive hierarchy:

1. **Token overrides** in `theme.css` — change colours, spacing, typography
2. **Class-level CSS** in `theme.css` — override component rulesets
3. **Eject & Edit** — `npx crss eject pages/profile` for full control
4. **Custom Actions** — extend server-side behaviour

## Design Tokens
The framework uses a three-tier CSS custom property system:

- **Tier 1 — Reference** (`--crss-ref-*`): Raw palette values
- **Tier 2 — System** (`--crss-sys-*`): Semantic roles (e.g., `--crss-sys-color-primary`)
- **Tier 3 — Component** (`--crss-comp-*`): Component-scoped overrides

Override tokens in `src/styles/theme.css` — your un-layered styles always
win over the framework's layered defaults. Never use hardcoded hex/rgb
colour values; always reference a `--crss-*` token.

```css
/* src/styles/theme.css — token overrides (Level 1) */
:root {
  --crss-sys-color-primary: #4f46e5;
  --crss-comp-card-bg: #1e293b;
}

/* Class-level overrides (Level 2) — no !important needed */
.crss-header {
  position: sticky;
  top: 0;
}
```

## Pages
Pages are served automatically by the framework integration. No page
files are scaffolded by `npx crss init`. If you need to customise a
page, eject it:

```bash
npx crss eject pages/profile
```

This copies the page to `src/pages/profile.astro` and auto-ejects
any dependent layouts and components. The framework stops injecting
its version for that route.

## Astro Actions
Use Astro Actions for all server communication. The scaffolded
`src/actions/index.ts` spreads `coreActions` from the framework:

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

## Ejected Components
Use `npx crss eject components/FeedCard` to create a thin proxy wrapper
in `src/components/`. The proxy imports the core component and gives you
a local `<style>` block for customisation.

Rules for proxy wrappers:
- Import core component from `@community-rss/core/components/*`
- Pass all props through via `{...Astro.props}`
- No business logic, no API calls, no data transformation
- Only: styling overrides, slot content, surrounding markup

## Email Templates
Customise emails by editing the `.astro` files in `src/email-templates/`:
- `EmailLayout.astro` — Shared table-based layout (header, content slot, footer)
- `SignInEmail.astro` — Magic link email
- `WelcomeEmail.astro` — Sent after registration
- `EmailChangeEmail.astro` — Email change verification

All templates import `EmailLayout` from the same directory (`./EmailLayout.astro`).
Edit the layout to change the shared structure; edit individual templates to
change per-type content. Theme values are available via the `theme` prop.

Alternatively, drop in a plain `.html` file (e.g., `sign-in.html`) with
`{{variable}}` placeholders — the framework will use it as an override.

## Protected Areas — DO NOT MODIFY
- **`node_modules/@community-rss/core/`** — Never fork or patch
- **Injected API routes** (`/api/v1/*`, `/api/auth/*`) — Never hand-edit
- **Injected page routes** — Use `npx crss eject` to customise
- **Framework middleware** — Never override or replace

Instead, use:
- `theme.css` for visual customisation (Level 1 + 2)
- `npx crss eject` for structural customisation (Level 3)
- `messages`/`labels` props for text customisation
- Action handlers for server logic customisation (Level 4)

## Developer-Owned Files
These files are yours to modify freely:
- `src/styles/theme.css` — Token and class-level overrides
- `src/email-templates/*.astro` — Email templates
- `src/actions/index.ts` — Action registration + custom actions
- `astro.config.mjs` — Integration configuration
- Ejected files in `src/pages/`, `src/components/`, `src/layouts/`

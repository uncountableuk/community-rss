---
title: Customisation
description: Four levels of progressive customisation for pages, components, styles, and actions.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Community RSS follows a **progressive customisation** model. Start with
simple token overrides, escalate to class-level CSS, eject individual
pages for full control, or extend server-side behaviour with custom
actions.

| Level | Method | What it changes | Survives updates? |
|-------|--------|-----------------|-------------------|
| **1** | Token overrides in `theme.css` | Colours, spacing, typography | Yes |
| **2** | Class-level CSS in `theme.css` | Component layout & rulesets | Yes |
| **3** | Eject pages/components/layouts | Full page/component structure | No (manual merge) |
| **4** | Custom Astro Actions | Server-side behaviour | Yes |

<Aside type="tip">
Start at Level 1 and only escalate when you need deeper control.
Each level gives you more power but more maintenance responsibility.
</Aside>

## Level 1 — Token Overrides

Override CSS custom properties in `src/styles/theme.css`:

```css
:root {
  /* Brand colour change */
  --crss-sys-color-primary: #0d9488;
  --crss-sys-color-accent: #14b8a6;

  /* Component-level: make cards rounded */
  --crss-comp-card-radius: 1rem;

  /* Component-level: wider modals */
  --crss-comp-modal-max-width: 960px;
}
```

Your `theme.css` is **un-layered** — it always wins over the framework's
`@layer`-ed defaults without needing `!important`.

See the [CSS Tokens Reference](/api-reference/css-tokens/) for the full list.

## Level 2 — Class-Level Overrides

Target framework CSS classes directly in `theme.css`. Because the file
is un-layered, your rules automatically beat the framework:

```css
/* Sticky header */
.crss-header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(8px);
}

/* Flat card style (no hover lift) */
.crss-feed-card {
  box-shadow: none;
  border-bottom: 1px solid var(--crss-sys-color-border);
}

/* Pill-shaped primary buttons */
.crss-btn--primary {
  border-radius: 9999px;
  text-transform: uppercase;
}
```

### Available Classes

| Class | Component |
|-------|-----------|
| `.crss-feed-card` | FeedCard |
| `.crss-feed-grid` | FeedGrid |
| `.crss-tab-bar` | TabBar |
| `.crss-article-modal` | ArticleModal |
| `.crss-auth-button` | AuthButton |
| `.crss-magic-link-form` | MagicLinkForm |
| `.crss-signup-form` | SignUpForm |
| `.crss-consent-modal` | ConsentModal |
| `.crss-homepage-cta` | HomepageCTA |
| `.crss-header` | BaseLayout header |
| `.crss-btn` | Base button style |
| `.crss-btn--primary` | Primary button variant |

## Level 3 — Eject & Edit

Copy a page, component, or layout into your project for full control:

```bash
# Eject a single page
npx crss eject pages/profile

# Eject a component (creates a proxy wrapper)
npx crss eject components/FeedCard

# Eject a layout
npx crss eject layouts/BaseLayout

# See all available targets
npx crss eject --help
```

When you eject a page, the framework:
1. Copies the page source into your `src/pages/` directory
2. Auto-ejects any layouts and components the page depends on
3. Rewrites imports to point to your local copies
4. Stops serving the framework's version for that route

<Aside type="caution">
Ejected files are **your responsibility**. Future framework updates won't
automatically update ejected pages. You'll need to manually merge any
changes when upgrading.
</Aside>

### Component Proxies

Ejected components are **thin proxy wrappers** that import the core
component and re-export it with a `<slot />`:

```astro
---
import CoreFeedCard from '@community-rss/core/components/FeedCard.astro';
---
<CoreFeedCard {...Astro.props}>
  <slot />
</CoreFeedCard>
<style>
  /* Your custom styles here — survives package updates */
</style>
```

## Level 4 — Custom Actions

Server-side behaviour uses Astro Actions. The scaffolded
`src/actions/index.ts` spreads all core actions and lets you add your own:

```typescript
import { defineAction } from 'astro:actions';
import { coreActions } from '@community-rss/core/actions';

function wrapCoreActions(actions) {
  const wrapped = {};
  for (const [name, { input, handler }] of Object.entries(actions)) {
    wrapped[name] = defineAction({ input, handler });
  }
  return wrapped;
}

export const server = {
  ...wrapCoreActions(coreActions),
  // Your custom actions below:
  myCustomAction: defineAction({
    input: z.object({ query: z.string() }),
    handler: async (input) => { /* ... */ },
  }),
};
```

See the [Actions Reference](/api-reference/actions/) for the full API.

## Pages

Pages are served automatically by the framework integration. When you
run `npx crss init`, no page files are scaffolded — the framework
injects all 8 page routes at build time.

If you eject a page (Level 3), the framework detects your local file and
stops injecting its version for that route.

| Page | Route | Purpose |
|------|-------|---------|
| `index.astro` | `/` | Homepage / article feed |
| `profile.astro` | `/profile` | User profile |
| `terms.astro` | `/terms` | Terms & conditions |
| `article/[id].astro` | `/article/:id` | Single article view |
| `auth/signin.astro` | `/auth/signin` | Sign-in page |
| `auth/signup.astro` | `/auth/signup` | Sign-up page |
| `auth/verify.astro` | `/auth/verify` | Magic link verification |
| `auth/verify-email-change.astro` | `/auth/verify-email-change` | Email change confirmation |

## Email Templates

Customise email content by editing the scaffolded `.astro` templates in
your `emailTemplateDir` directory (default: `./src/email-templates/`).
Templates are full Astro components that receive props like `url`,
`appName`, `greeting`, and `theme`.

For simpler customisations, drop in a plain `.html` file using
`{{variable}}` placeholders.

See the [Email Setup](/guides/email-setup/#email-templates) guide for
template variables, theming, and examples.

## Server Islands

Auth-dependent UI (sign-in button, CTA) uses `server:defer` to stream
content after the initial page loads. Provide a `slot="fallback"` element
for loading skeletons:

```astro
<AuthButton server:defer>
  <div slot="fallback" class="auth-skeleton" />
</AuthButton>
```

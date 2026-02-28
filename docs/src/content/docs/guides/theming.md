---
title: Theming
description: Customise the visual appearance of your Community RSS site.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Community RSS uses a **three-tier CSS custom property system** for all
themeable values. Override these tokens to match your brand without
modifying framework source code.

For the complete token reference, see the
[CSS Tokens Reference](/api-reference/css-tokens/). For detailed styling
guidance including cascade layers and proxy components, see the
[Styling Guide](/guides/styling/).

## CSS Design Tokens

All framework tokens are prefixed with `--crss-` to avoid namespace
collisions with your own styles. Tokens are organised in three tiers:

| Tier | Prefix | Purpose |
|------|--------|---------|
| **Reference** | `--crss-ref-*` | Raw palette values |
| **System** | `--crss-sys-*` | Semantic roles (primary, surface, error) |
| **Component** | `--crss-comp-*` | Per-component overrides |

Backward-compatible flat aliases (`--crss-brand`, `--crss-surface-0`, etc.)
are also available.

### Key System Tokens

```css
:root {
  /* System tokens — semantic roles */
  --crss-sys-color-primary: #0ea5e9;
  --crss-sys-color-primary-hover: #0284c7;
  --crss-sys-color-secondary: #06b6d4;
  --crss-sys-color-surface: #f8fafc;
  --crss-sys-color-surface-alt: #ffffff;
  --crss-sys-color-on-surface: #0f172a;
  --crss-sys-color-on-surface-variant: #475569;
}
```

### Typography Tokens

```css
:root {
  --crss-font-family: system-ui, -apple-system, sans-serif;
  --crss-font-size-sm: 0.875rem;
  --crss-font-size-base: 1rem;
  --crss-font-size-lg: 1.125rem;
  --crss-font-size-xl: 1.25rem;
  --crss-line-height: 1.6;
}
```

### Spacing & Layout Tokens

```css
:root {
  --crss-spacing-xs: 0.25rem;
  --crss-spacing-sm: 0.5rem;
  --crss-spacing-md: 1rem;
  --crss-spacing-lg: 1.5rem;
  --crss-spacing-xl: 2rem;
  --crss-border-radius: 0.375rem;
  --crss-max-width: 72rem;
}
```

## Applying a Theme

### Option 1: Theme CSS File

Create a `theme.css` file (scaffolded by the CLI) and import it in your
layout:

```css
/* src/styles/theme.css */
:root {
  --crss-sys-color-primary: #7c3aed;
  --crss-sys-color-primary-hover: #6d28d9;
  --crss-font-family: 'Inter', sans-serif;
}
```

### Option 2: Inline in Layout

Override tokens directly in your layout's `<style>` tag:

```astro
---
// src/layouts/Layout.astro
import CommunityLayout from '@community-rss/core/layouts/CommunityLayout.astro';
---
<CommunityLayout>
  <slot />
</CommunityLayout>

<style is:global>
  :root {
    --crss-brand-primary: #059669;
  }
</style>
```

## Dark Mode

The framework respects `prefers-color-scheme`. Override dark mode tokens
with a media query:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --crss-sys-color-surface: #0f172a;
    --crss-sys-color-surface-alt: #1e293b;
    --crss-sys-color-on-surface: #f1f5f9;
    --crss-sys-color-on-surface-variant: #94a3b8;
    --crss-border: #334155;
  }
}
```

## Component-Level Overrides

Individual components can be styled by overriding component tokens
(`--crss-comp-*`) or by targeting their CSS classes. All framework
components use BEM-style class names prefixed with `crss-`:

```css
/* Override via component tokens */
:root {
  --crss-comp-card-bg: #eff6ff;
  --crss-comp-card-radius: 1rem;
  --crss-comp-modal-radius: 0.5rem;
}

/* Or target classes directly */
.crss-feed-card {
  border: 2px solid var(--crss-sys-color-primary);
}
```

<Aside type="tip">
Your `theme.css` is un-layered, so it always overrides framework defaults
without `!important`. See [CSS Cascade Layers](/guides/styling/#css-cascade-layers)
for details.
</Aside>

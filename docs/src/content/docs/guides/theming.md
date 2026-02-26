---
title: Theming
description: Customise the visual appearance of your Community RSS site.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Community RSS uses **CSS custom properties** (design tokens) for all
themeable values. Override these tokens to match your brand without
modifying framework source code.

## CSS Design Tokens

All framework tokens are prefixed with `--crss-` to avoid namespace
collisions with your own styles.

### Colour Tokens

```css
:root {
  --crss-brand-primary: #0ea5e9;
  --crss-brand-accent: #06b6d4;
  --crss-brand-muted: #94a3b8;
  --crss-bg-primary: #ffffff;
  --crss-bg-secondary: #f8fafc;
  --crss-text-primary: #0f172a;
  --crss-text-secondary: #475569;
  --crss-border-color: #e2e8f0;
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
  --crss-brand-primary: #7c3aed;
  --crss-brand-accent: #a78bfa;
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
    --crss-bg-primary: #0f172a;
    --crss-bg-secondary: #1e293b;
    --crss-text-primary: #f1f5f9;
    --crss-text-secondary: #94a3b8;
    --crss-border-color: #334155;
  }
}
```

## Component-Level Overrides

Individual components can be styled by targeting their CSS classes.
All framework components use BEM-style class names prefixed with `crss-`:

```css
.crss-article-card {
  border: 2px solid var(--crss-brand-primary);
}

.crss-auth-button {
  background: var(--crss-brand-accent);
}
```

<Aside type="tip">
Since page routes are scaffolded into your project, you have full control
over the page layout and can wrap or replace any component.
</Aside>

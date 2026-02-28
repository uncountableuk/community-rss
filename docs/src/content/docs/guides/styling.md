---
title: Styling Guide
description: How CSS design tokens, cascade layers, and theming work together.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Community RSS provides a complete styling system built on CSS custom
properties and cascade layers. You control your site's appearance through
token overrides — never by patching framework CSS.

## Token Tiers

The framework organises design tokens into three tiers:

1. **Reference** (`--crss-ref-*`) — Raw palette values and scale primitives
2. **System** (`--crss-sys-*`) — Semantic roles mapped to reference tokens
3. **Component** (`--crss-comp-*`) — Per-component overrides

```
Reference Tokens → System Tokens → Component Tokens
  (palette)         (meaning)        (scoped)
```

Most developers only need system and component tokens. Reference tokens
are useful when building a comprehensive theme.

See the [CSS Tokens Reference](/api-reference/css-tokens/) for the
complete token list.

## CSS Cascade Layers

Framework styles are organised into CSS `@layer` declarations:

```css
@layer crss-reset, crss-tokens, crss-base, crss-components, crss-utilities;
```

| Layer | Purpose |
|-------|---------|
| `crss-reset` | Browser normalisation |
| `crss-tokens` | Design token definitions |
| `crss-base` | Element defaults (headings, links, body) |
| `crss-components` | Component styles |
| `crss-utilities` | Utility classes |

Your `theme.css` is **un-layered**, which means it always takes precedence
over every framework layer. You never need `!important`.

<Aside type="tip">
Layers are injected automatically by the integration. You don't need to
import them manually.
</Aside>

## Applying a Theme

### Quick Start

Edit the scaffolded `src/styles/theme.css`:

```css
:root {
  /* Brand colours */
  --crss-sys-color-primary: #059669;
  --crss-sys-color-primary-hover: #047857;

  /* Typography */
  --crss-font-family: 'Inter', system-ui, sans-serif;

  /* Component-specific */
  --crss-comp-card-radius: 1rem;
  --crss-comp-card-bg: #f0fdf4;
}
```

### Dark Mode

Override tokens inside a `prefers-color-scheme` media query:

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

### Component-Level Overrides

Override tokens for specific components using proxy wrappers:

```astro
---
import CoreFeedCard from '@community-rss/core/components/FeedCard.astro';
---
<div class="featured-card">
  <CoreFeedCard {...Astro.props} />
</div>
<style>
  .featured-card :global(.crss-feed-card) {
    --crss-comp-card-bg: #eff6ff;
    --crss-comp-card-border: #3b82f6;
  }
</style>
```

## Common Theming Recipes

### Brand Colour Swap

```css
:root {
  --crss-sys-color-primary: #7c3aed;
  --crss-sys-color-primary-hover: #6d28d9;
  --crss-sys-color-secondary: #ec4899;
}
```

### Typography

```css
:root {
  --crss-font-family: 'Merriweather', Georgia, serif;
  --crss-font-size-base: 1.0625rem;
  --crss-line-height: 1.7;
}
```

### Compact Cards

```css
:root {
  --crss-comp-card-radius: 0.25rem;
  --crss-comp-card-shadow: none;
  --crss-comp-card-border: var(--crss-border);
}
```

## Proxy Component Pattern

Scaffolded component wrappers (`src/components/`) import core components
and own the `<style>` block. This separation means:

- **Your styles survive package updates** — they live in your project
- **Logic improvements flow through** — core updates apply automatically
- **No business logic in wrappers** — only styling, slots, and markup

See the [Customisation](/guides/customisation/) guide for the full
component customisation API.

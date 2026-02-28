---
title: CSS Tokens Reference
description: Complete reference for the three-tier CSS design token system.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Community RSS uses a **three-tier CSS custom property system** for all
themeable values. Every token is prefixed with `--crss-` to avoid
namespace collisions.

| Tier | Prefix | Purpose | File |
|------|--------|---------|------|
| **Reference** | `--crss-ref-*` | Raw palette values, scale primitives | `tokens/reference.css` |
| **System** | `--crss-sys-*` | Semantic roles mapped to references | `tokens/system.css` |
| **Component** | `--crss-comp-*` | Component-scoped overrides | `tokens/components.css` |

Backward-compatible **flat aliases** (`--crss-surface-0`, `--crss-text-primary`,
etc.) map to system tokens for ease of use.

## Tier 1 — Reference Tokens

Raw palette values. These define the available colour and scale primitives
but carry no semantic meaning.

### Grey Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--crss-ref-gray-50` | `#f8fafc` | Lightest background |
| `--crss-ref-gray-100` | `#f1f5f9` | Light background |
| `--crss-ref-gray-200` | `#e2e8f0` | Borders |
| `--crss-ref-gray-300` | `#cbd5e1` | Subtle borders |
| `--crss-ref-gray-400` | `#94a3b8` | Muted text |
| `--crss-ref-gray-500` | `#64748b` | Secondary text |
| `--crss-ref-gray-600` | `#475569` | Body text |
| `--crss-ref-gray-700` | `#334155` | Emphasis text |
| `--crss-ref-gray-800` | `#1e293b` | Heading text |
| `--crss-ref-gray-900` | `#0f172a` | Primary text |
| `--crss-ref-gray-950` | `#020617` | Darkest text |

### Brand Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--crss-ref-indigo-50` | `#eef2ff` | Brand tint |
| `--crss-ref-indigo-600` | `#4f46e5` | Brand primary |
| `--crss-ref-indigo-700` | `#4338ca` | Brand hover |
| `--crss-ref-violet-600` | `#7c3aed` | Brand accent |

### Feedback Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--crss-ref-red-50` | `#fef2f2` | Error background |
| `--crss-ref-red-200` | `#fecaca` | Error border |
| `--crss-ref-red-600` | `#dc2626` | Error accent |
| `--crss-ref-red-700` | `#b91c1c` | Error text (dark) |
| `--crss-ref-red-800` | `#991b1b` | Error text |
| `--crss-ref-green-50` | `#ecfdf5` | Success background |
| `--crss-ref-green-300` | `#86efac` | Success border |
| `--crss-ref-green-600` | `#16a34a` | Success accent |
| `--crss-ref-green-800` | `#065f46` | Success text |
| `--crss-ref-amber-500` | `#f59e0b` | Warning accent |
| `--crss-ref-blue-600` | `#2563eb` | Info accent |

## Tier 2 — System Tokens

Semantic roles that map references to meaning. These are what most
developers should use.

### Surface & Background

| Token | Maps To | Purpose |
|-------|---------|---------|
| `--crss-sys-color-surface` | `--crss-ref-gray-50` | Page background |
| `--crss-sys-color-surface-alt` | `white` | Card/elevated background |
| `--crss-sys-color-on-surface` | `--crss-ref-gray-900` | Text on surface |
| `--crss-sys-color-on-surface-variant` | `--crss-ref-gray-600` | Secondary text |

### Brand

| Token | Maps To | Purpose |
|-------|---------|---------|
| `--crss-sys-color-primary` | `--crss-ref-indigo-600` | Primary actions |
| `--crss-sys-color-primary-hover` | `--crss-ref-indigo-700` | Hover state |
| `--crss-sys-color-on-primary` | `white` | Text on primary |
| `--crss-sys-color-secondary` | `--crss-ref-violet-600` | Secondary accent |

### Feedback States

| Token | Maps To | Purpose |
|-------|---------|---------|
| `--crss-sys-color-success-bg` | `--crss-ref-green-50` | Success background |
| `--crss-sys-color-success-text` | `--crss-ref-green-800` | Success text |
| `--crss-sys-color-success-border` | `--crss-ref-green-300` | Success border |
| `--crss-sys-color-error-bg` | `--crss-ref-red-50` | Error background |
| `--crss-sys-color-error-text` | `--crss-ref-red-800` | Error text |
| `--crss-sys-color-error-border` | `--crss-ref-red-200` | Error border |
| `--crss-sys-color-error` | `--crss-ref-red-600` | Error accent |
| `--crss-sys-color-warning` | `--crss-ref-amber-500` | Warning accent |
| `--crss-sys-color-focus-ring` | `--crss-ref-indigo-600` | Focus outline |
| `--crss-sys-color-overlay-bg` | `rgba(0, 0, 0, 0.5)` | Modal overlay |

### Flat Aliases (Backward-Compatible)

These shorthand tokens map to system tokens for convenience:

| Alias | Maps To |
|-------|---------|
| `--crss-surface-0` | `--crss-sys-color-surface` |
| `--crss-surface-1` | `--crss-sys-color-surface-alt` |
| `--crss-text-primary` | `--crss-sys-color-on-surface` |
| `--crss-text-secondary` | `--crss-sys-color-on-surface-variant` |
| `--crss-text-muted` | ref gray-400 |
| `--crss-brand` | `--crss-sys-color-primary` |
| `--crss-brand-hover` | `--crss-sys-color-primary-hover` |
| `--crss-primary` | `--crss-sys-color-primary` |
| `--crss-border` | ref gray-200 |

## Tier 3 — Component Tokens

Override individual component visuals without affecting the system palette.

### Card Tokens

| Token | Default | Purpose |
|-------|---------|---------|
| `--crss-comp-card-bg` | `--crss-surface-1` | Card background |
| `--crss-comp-card-border` | `--crss-border` | Card border colour |
| `--crss-comp-card-radius` | `0.75rem` | Card border radius |
| `--crss-comp-card-shadow` | subtle shadow | Card box shadow |
| `--crss-comp-card-hover-shadow` | medium shadow | Card hover shadow |

### Modal Tokens

| Token | Default | Purpose |
|-------|---------|---------|
| `--crss-comp-modal-bg` | `--crss-surface-1` | Modal background |
| `--crss-comp-modal-border` | `--crss-border` | Modal border |
| `--crss-comp-modal-overlay-bg` | `--crss-sys-color-overlay-bg` | Overlay background |
| `--crss-comp-modal-radius` | `1rem` | Modal border radius |
| `--crss-comp-modal-shadow` | large shadow | Modal box shadow |

### Form Tokens

| Token | Default | Purpose |
|-------|---------|---------|
| `--crss-comp-form-focus-ring` | `--crss-sys-color-focus-ring` | Input focus ring |
| `--crss-comp-form-success-bg` | `--crss-sys-color-success-bg` | Success message bg |
| `--crss-comp-form-success-text` | `--crss-sys-color-success-text` | Success message text |
| `--crss-comp-form-success-border` | `--crss-sys-color-success-border` | Success message border |
| `--crss-comp-form-error-bg` | `--crss-sys-color-error-bg` | Error message bg |
| `--crss-comp-form-error-text` | `--crss-sys-color-error-text` | Error message text |
| `--crss-comp-form-error-border` | `--crss-sys-color-error-border` | Error message border |

## Overriding Tokens

### In `theme.css` (Level 1)

The simplest way to apply your brand:

```css
/* src/styles/theme.css */
:root {
  /* Remap system roles to your brand */
  --crss-sys-color-primary: #059669;
  --crss-sys-color-primary-hover: #047857;

  /* Override a single component */
  --crss-comp-card-bg: #1e293b;
  --crss-comp-card-radius: 1rem;
}
```

<Aside type="tip">
Your `theme.css` is un-layered, so it always wins over framework defaults.
You don't need `!important`.
</Aside>

### Class-Level Overrides (Level 2)

Target framework CSS classes directly in `theme.css`:

```css
/* Override rulesets without !important */
.crss-feed-card {
  border-radius: 0;
  box-shadow: none;
  border-bottom: 1px solid var(--crss-sys-color-border);
}

.crss-header {
  position: sticky;
  top: 0;
}
```

See the [Customisation Guide](/guides/customisation/#level-2--class-level-overrides)
for the full list of available classes.

## Token ↔ Component Mapping

Every Tier 3 token is consumed by at least one component. This table
shows which components use which token groups:

| Token Group | Components |
|-------------|-----------|
| `--crss-comp-btn-*` | AuthButton (`.crss-btn` base class) |
| `--crss-comp-card-*` | FeedCard |
| `--crss-comp-grid-*` | FeedGrid |
| `--crss-comp-tab-*` | TabBar |
| `--crss-comp-modal-*` | ArticleModal |
| `--crss-comp-form-*` | MagicLinkForm, SignUpForm |
| `--crss-comp-consent-*` | ConsentModal |
| `--crss-comp-auth-*` | AuthButton |
| `--crss-comp-cta-*` | HomepageCTA |
| `--crss-comp-header-*` | BaseLayout |

## CSS Cascade Layers

The framework uses CSS `@layer` to ensure consumer styles always win:

```
crss-reset → crss-tokens → crss-base → crss-components → crss-utilities
```

Your un-layered `theme.css` overrides everything. Framework styles never
use `!important`, so you always have the final word.

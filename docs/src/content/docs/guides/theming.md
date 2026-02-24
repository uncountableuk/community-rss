---
title: Customising Feed Cards
description: How to theme feed cards using CSS custom properties
---

Feed cards use CSS custom properties (design tokens) for all visual values, making them fully customisable without modifying framework code.

## Available Tokens

### Card Layout

| Token                        | Default     | Description                     |
|------------------------------|-------------|---------------------------------|
| `--crss-surface-0`           | `#ffffff`   | Card background colour          |
| `--crss-surface-2`           | `#e5e7eb`   | Card border colour              |
| `--crss-radius-md`           | `8px`       | Card border radius              |
| `--crss-space-md`            | `1rem`      | Card padding                    |
| `--crss-space-lg`            | `1.5rem`    | Grid gap between cards          |

### Typography

| Token                        | Default               | Description              |
|------------------------------|-----------------------|--------------------------|
| `--crss-font-size-xs`        | `0.75rem`             | Meta text (date, source) |
| `--crss-font-size-sm`        | `0.875rem`            | Summary text             |
| `--crss-font-size-lg`        | `1.125rem`            | Card title               |
| `--crss-font-family`         | `system-ui, ...`      | Font family              |

### Colours

| Token                        | Default     | Description                  |
|------------------------------|-------------|------------------------------|
| `--crss-text-primary`        | `#1a1a2e`   | Title colour                 |
| `--crss-text-secondary`      | `#4b5563`   | Summary text colour          |
| `--crss-text-muted`          | `#9ca3af`   | Meta text (date, author)     |
| `--crss-brand-primary`       | `#4f46e5`   | Source label, links          |
| `--crss-heart`               | `#ef4444`   | Heart icon colour            |
| `--crss-star`                | `#f59e0b`   | Star icon colour             |

## Overriding Tokens

Add a stylesheet to your project that overrides the tokens:

```css
/* src/styles/custom-theme.css */
:root {
  --crss-surface-0: #1a1a2e;
  --crss-text-primary: #e0e0e0;
  --crss-brand-primary: #00d4ff;
  --crss-heart: #ff6b9d;
  --crss-radius-md: 16px;
}
```

Import it in your layout or page:

```astro
---
// src/layouts/Layout.astro
---
<style is:global>
  @import '../styles/custom-theme.css';
</style>
<slot />
```

## Grid Layout

The feed grid uses CSS Grid with `auto-fill` and a minimum column width of 300px. Override the grid behaviour with:

```css
.crss-feed-grid {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--crss-space-xl);
}
```

## Card Hover Effect

By default, cards lift slightly on hover. Customise or disable:

```css
.crss-feed-card:hover {
  box-shadow: none;
  transform: none;
}
```

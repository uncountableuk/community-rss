# Layouts

This directory is for **layout overrides**. The framework provides a
`BaseLayout` that all pages use by default.

## How It Works

When you eject a layout, a proxy wrapper is created here. The proxy
re-exports the core layout with slot passthrough, giving you a place
to customize the page shell (header, footer, global styles).

## Available Layouts

| Layout | Description |
|--------|-------------|
| `BaseLayout.astro` | Main page layout with header, nav, and CSS tokens |

## Ejecting a Layout

```bash
npx crss eject layouts/BaseLayout
```

This creates a proxy wrapper with named slot passthrough:

```astro
---
import CoreBaseLayout from '@community-rss/core/layouts/BaseLayout.astro';
const props = Astro.props;
---
<CoreBaseLayout {...props}>
  <slot name="head" slot="head" />
  <slot name="header" slot="header" />
  <slot />
  <slot name="footer" slot="footer" />
</CoreBaseLayout>
```

## Learn More

See the [Progressive Customization guide](https://community-rss.dev/guides/customisation)
for the full customization hierarchy.

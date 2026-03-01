# Layouts

This directory is for **layout overrides**. The framework provides a
`BaseLayout` that all pages use by default.

## How It Works

When you eject a layout, a proxy wrapper is created here with all
available slot overrides as commented-out blocks. Uncomment any slot
to override that section.

## Available Layouts

| Layout | Slots |
|--------|-------|
| `BaseLayout.astro` | head, header, below-header, before-unnamed-slot, after-unnamed-slot, footer |

## Ejecting a Layout

```bash
npx crss eject layouts/BaseLayout
```

This creates a proxy with commented slot blocks:

```astro
---
import CoreBaseLayout from '@community-rss/core/layouts/BaseLayout.astro';
const props = Astro.props;
---
<CoreBaseLayout {...props}>
  {/* SLOT: head — Inject extra <head> content ... */}
  {/* <Fragment slot="head"> </Fragment> */}

  {/* SLOT: header — Replace the default header ... */}
  {/* <Fragment slot="header"> <nav>...</nav> </Fragment> */}

  <slot />

  {/* SLOT: footer — Replace the default footer ... */}
  {/* <Fragment slot="footer"> <footer>...</footer> </Fragment> */}
</CoreBaseLayout>
```

## Upgrading After a Framework Update

```bash
npx crss eject upgrade
```

Refreshes commented stubs while preserving your active overrides.

## Learn More

See the [Progressive Customization guide](https://community-rss.dev/guides/customisation)
for the full customization hierarchy.

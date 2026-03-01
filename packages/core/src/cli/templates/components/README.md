# Components

This directory is for **component overrides**. By default, all
components are imported directly from `@community-rss/core` by the
framework's injected pages.

## How It Works

When you eject a component, a **proxy wrapper** is created here with
all available named slots as commented-out blocks. Uncomment any slot
to override that section — core logic stays in the framework.

## Available Components

| Component | Slots |
|-----------|-------|
| `AuthButton.astro` | before-unnamed-slot, after-unnamed-slot |
| `FeedCard.astro` | before-unnamed-slot, after-unnamed-slot |
| `FeedGrid.astro` | before-unnamed-slot, after-unnamed-slot |
| `TabBar.astro` | before-unnamed-slot, after-unnamed-slot |
| `ArticleModal.astro` | header, body, footer, before/after-unnamed-slot |
| `MagicLinkForm.astro` | before-unnamed-slot, after-unnamed-slot |
| `SignUpForm.astro` | form, confirmation, before/after-unnamed-slot |
| `ConsentModal.astro` | before-unnamed-slot, after-unnamed-slot |
| `HomepageCTA.astro` | before-unnamed-slot, after-unnamed-slot |

## Ejecting a Component

```bash
npx crss eject components/FeedCard
```

This creates a proxy with commented slot blocks (shown truncated):

```astro
---
import CoreFeedCard from '@community-rss/core/components/FeedCard.astro';
const props = Astro.props;
---
<CoreFeedCard {...props}>
  {/* SLOT: before-unnamed-slot ... */}
  {/* <Fragment slot="before-unnamed-slot"> </Fragment> */}

  <slot />

  {/* SLOT: after-unnamed-slot ... */}
  {/* <Fragment slot="after-unnamed-slot"> </Fragment> */}
</CoreFeedCard>
<style>
  /* Your custom styles here */
</style>
```

## Upgrading After a Framework Update

```bash
npx crss eject upgrade
```

Refreshes commented stubs while preserving your active (uncommented) overrides.

## Learn More

See the [Progressive Customization guide](https://community-rss.dev/guides/customisation)
for the full customization hierarchy.

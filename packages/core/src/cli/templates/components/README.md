# Components

This directory is for **component overrides**. By default, all
components are imported directly from `@community-rss/core` by the
framework's injected pages.

## How It Works

When you eject a component, a thin **proxy wrapper** is created here.
The proxy re-exports the core component, giving you a place to add
custom styles or modify markup without touching the framework source.

## Available Components

| Component | Description |
|-----------|-------------|
| `AuthButton.astro` | Sign in/out button in the header |
| `FeedCard.astro` | Individual article card |
| `FeedGrid.astro` | Responsive article grid layout |
| `TabBar.astro` | Tab navigation (All/New/Popular) |
| `ArticleModal.astro` | Full article modal overlay |
| `MagicLinkForm.astro` | Sign-in email form |
| `SignUpForm.astro` | Registration form |
| `ConsentModal.astro` | Guest interaction consent dialog |
| `HomepageCTA.astro` | Homepage call-to-action banner |

## Ejecting a Component

```bash
npx @community-rss/core eject components/FeedCard
```

This creates a proxy wrapper that you can customize:

```astro
---
import CoreFeedCard from '@community-rss/core/components/FeedCard.astro';
const props = Astro.props;
---
<CoreFeedCard {...props}><slot /></CoreFeedCard>

<style>
  /* Your custom styles here */
</style>
```

## Learn More

See the [Progressive Customization guide](https://community-rss.dev/guides/customisation)
for the full customization hierarchy.

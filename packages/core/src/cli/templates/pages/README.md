# Pages

This directory is for **page overrides**. By default, all pages are
served automatically by the `@community-rss/core` integration — no
files needed here.

## How It Works

The framework injects page routes at build time. When you eject a page,
a proxy wrapper is created that imports the core page and exposes its
`content` slot. Your version takes priority and the framework's injected
version is skipped.

## Available Pages

| Route | File | Content Slot |
|-------|------|-------------|
| `/` | `index.astro` | Replaces the full page content (feed grid) |
| `/profile` | `profile.astro` | Replaces user profile content |
| `/terms` | `terms.astro` | Replaces terms page content |
| `/article/[id]` | `article/[id].astro` | Replaces article detail content |
| `/auth/signin` | `auth/signin.astro` | Replaces sign-in form area |
| `/auth/signup` | `auth/signup.astro` | Replaces sign-up form area |
| `/auth/verify` | `auth/verify.astro` | Replaces verification content |
| `/auth/verify-email-change` | `auth/verify-email-change.astro` | Replaces email change content |

## Ejecting a Page

```bash
npx crss eject pages/profile
```

This creates a proxy wrapper with a `content` slot override:

```astro
---
import CoreProfile from '@community-rss/core/pages/profile.astro';
const props = Astro.props;
---
<CoreProfile {...props}>
  {/* SLOT: content — Replace the entire page content. */}
  {/* <Fragment slot="content"> ... </Fragment> */}

  <slot />
</CoreProfile>
```

Uncomment the `content` slot and add your markup to replace the page content.

## Upgrading After a Framework Update

```bash
npx crss eject upgrade
```

Refreshes commented stubs while preserving your active overrides.

## Learn More

See the [Progressive Customization guide](https://community-rss.dev/guides/customisation)
for the full customization hierarchy.

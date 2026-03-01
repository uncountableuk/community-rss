---
title: CLI Reference
description: Command reference for the @community-rss/core CLI.
---

import { Aside } from '@astrojs/starlight/components';

The CLI is available as both `community-rss` and `crss` (shorthand).

## npx crss init

Scaffolds configuration files, email templates, signpost READMEs, and
an Astro Actions file into your project.

```bash
npx crss init [options]
```

### Options

| Flag | Description |
|------|-------------|
| `--force` | Overwrite existing files (default: skip existing) |

### Generated Files

#### Actions

| File | Purpose |
|------|---------|
| `src/actions/index.ts` | Astro Actions with `coreActions` spread |

#### Email Templates (3 files)

| File | Purpose |
|------|---------|
| `src/email-templates/magic-link.html` | Magic link sign-in email |
| `src/email-templates/verify-domain.html` | Domain verification email |
| `src/email-templates/welcome.html` | Welcome email for new users |

#### Signpost READMEs (3 files)

| File | Purpose |
|------|---------|
| `src/pages/README.md` | Explains page routing and how to eject |
| `src/components/README.md` | Explains component proxies and ejection |
| `src/layouts/README.md` | Explains layout customisation |

#### Configuration (4 files)

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro config with Node.js adapter and integration |
| `.env.example` | Environment variable template |
| `src/styles/theme.css` | CSS design token overrides |
| `docker-compose.yml` | Docker services (FreshRSS, MinIO, Mailpit) |

<Aside type="note">
Pages are **not** scaffolded — they are injected automatically by the
integration at build time. Use `npx crss eject pages/<name>` to take
local ownership of a specific page.
</Aside>

### Behaviour

- **Non-destructive by default** — existing files are skipped with a warning
- **`--force` flag** — overwrites all files, useful for re-scaffolding after
  a framework update
- **Project root detection** — finds the nearest `package.json`

### Example

```bash
# Initial setup
npx crss init

# Re-scaffold after upgrade
npx crss init --force
```

---

## npx crss eject

Generates a proxy wrapper for a page, component, layout, or actions file.
Proxies expose **named slots** as commented-out blocks — uncomment any
slot to override that section while keeping all other logic in the core.

```bash
npx crss eject <target> [options]
```

### Targets

#### Pages

Eject a page proxy to customise its content. The framework stops injecting its version for that route.

```bash
npx crss eject pages/profile
npx crss eject pages/auth/signin
npx crss eject pages/index
```

Available pages: `index`, `profile`, `terms`, `article/[id]`,
`auth/signin`, `auth/signup`, `auth/verify`, `auth/verify-email-change`.

When ejecting a page, any required layouts and component proxies are
**auto-ejected** if they don't already exist.

#### Components

Eject a component proxy wrapper:

```bash
npx crss eject components/FeedCard
npx crss eject components/ArticleModal
```

Creates a proxy in `src/components/` with all available slot overrides
as commented-out blocks. Add your own `<style>` block for custom styling.

Available components: `AuthButton`, `HomepageCTA`, `ConsentModal`,
`FeedGrid`, `TabBar`, `ArticleModal`, `MagicLinkForm`, `FeedCard`,
`SignUpForm`.

#### Layouts

```bash
npx crss eject layouts/BaseLayout
```

Creates a layout proxy with slot overrides for `head`, `header`,
`below-header`, `before-unnamed-slot`, `after-unnamed-slot`,
and `footer`.

#### Actions

```bash
npx crss eject actions
```

Regenerates `src/actions/index.ts` with the latest `coreActions` spread.

#### Special Targets

```bash
# Re-eject all previously ejected files (preserves customizations)
npx crss eject upgrade

# Eject every known target
npx crss eject all
```

### Options

| Flag | Description |
|------|-------------|
| `--force` | Full overwrite — resets all customizations |

### Proxy Format

Each ejected file is a proxy wrapper with commented `SLOT:` blocks:

```astro
---
import CoreFeedCard from '@community-rss/core/components/FeedCard.astro';
const props = Astro.props;
---
<CoreFeedCard {...props}>
  {/* =========================================
    SLOT: before-unnamed-slot
    Content injected before the main content area.
    =========================================
  */}

  {/* <Fragment slot="before-unnamed-slot">
  </Fragment> */}

  <slot />
</CoreFeedCard>
<style>
  /* Add your custom styles here */
</style>
```

Uncomment a `<Fragment slot="...">` block and add your content to
customise that section.

### Re-eject Behaviour

- **File with `SLOT:` markers** — merges: preserves uncommented slot
  overrides, refreshes commented stubs, preserves custom styles/imports
- **File without markers** — skips (use `--force` to overwrite)
- **`--force` flag** — full overwrite, resets all customizations
- **Auto-eject dependencies** — ejecting a page auto-ejects its layout
  and component dependencies

### `eject upgrade`

Scans your `src/` directory for previously ejected files and re-ejects
each one, preserving your active customizations while refreshing
framework stubs. Also replaces signpost READMEs with fresh copies.

Run this after every `npm update @community-rss/core`.

### `eject all`

Ejects every known layout, component, page, and actions target.
Existing files are merged (unless `--force` is used).

<Aside type="tip">
Ejected proxies survive framework updates. Only the slots you uncomment
are your responsibility — everything else is automatically refreshed
when you run `npx crss eject upgrade`.
</Aside>

---

## Programmatic Usage

Both commands are available as JavaScript modules:

```js
import { scaffold, findProjectRoot } from '@community-rss/core/cli/init.mjs';

await scaffold({
  projectRoot: findProjectRoot(),
  force: false,
});
```

```js
import { runEject } from '@community-rss/core/cli/eject.mjs';

await runEject({
  target: 'pages/profile',
  cwd: process.cwd(),
  force: false,
});
```

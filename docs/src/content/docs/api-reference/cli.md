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

Copies a page, component, layout, or actions file into your project for
full local control.

```bash
npx crss eject <target> [options]
```

### Targets

#### Pages

Eject a page to take local ownership. The framework stops injecting its
version for that route.

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

Creates a thin proxy in `src/components/` that imports the core component
with `<slot />` passthrough. Add your own `<style>` block.

Available components: `AuthButton`, `HomepageCTA`, `ConsentModal`,
`FeedGrid`, `TabBar`, `ArticleModal`, `MagicLinkForm`, `FeedCard`,
`SignUpForm`.

#### Layouts

```bash
npx crss eject layouts/BaseLayout
```

Creates a layout proxy with named slot passthrough (`default`, `head`).

#### Actions

```bash
npx crss eject actions
```

Regenerates `src/actions/index.ts` with the latest `coreActions` spread.

### Options

| Flag | Description |
|------|-------------|
| `--force` | Overwrite existing ejected files |

### Behaviour

- **Skip if exists** — won't overwrite existing files unless `--force` is used
- **Auto-eject dependencies** — ejecting a page auto-ejects its layout
  and component dependencies
- **Import rewriting** — ejected pages get imports rewritten from package
  paths to local relative paths

<Aside type="caution">
Ejected files are **your responsibility**. Future framework updates won't
automatically update them. Review changelogs when upgrading.
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

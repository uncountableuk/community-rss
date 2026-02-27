---
title: CLI Reference
description: Command reference for the @community-rss/core CLI.
---

import { Aside } from '@astrojs/starlight/components';

## npx @community-rss/core init

Scaffolds page routes, email templates, configuration files, and a
Docker Compose setup into your Astro project.

```bash
npx @community-rss/core init [options]
```

### Options

| Flag | Description |
|------|-------------|
| `--force` | Overwrite existing files (default: skip existing) |

### Generated Files

The `init` command creates the following files:

#### Page Routes (8 files)

| File | Purpose |
|------|---------|
| `src/pages/index.astro` | Homepage / article feed |
| `src/pages/article/[id].astro` | Single article view |
| `src/pages/feeds.astro` | Feed directory |
| `src/pages/submit.astro` | Feed submission form |
| `src/pages/profile.astro` | User profile |
| `src/pages/admin.astro` | Admin dashboard |
| `src/pages/auth/signin.astro` | Sign-in page |
| `src/pages/auth/signup.astro` | Sign-up page |

#### Email Templates (3 files)

| File | Purpose |
|------|---------|
| `src/email-templates/magic-link.html` | Magic link sign-in email |
| `src/email-templates/verify-domain.html` | Domain verification email |
| `src/email-templates/welcome.html` | Welcome email for new users |

#### Configuration (4 files)

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro config with Node.js adapter and integration |
| `.env.example` | Environment variable template |
| `src/styles/theme.css` | CSS design token overrides |
| `docker-compose.yml` | Docker services (FreshRSS, MinIO, Mailpit) |

### Behaviour

- **Non-destructive by default** — Existing files are skipped with a warning
- **`--force` flag** — Overwrites all files, useful for re-scaffolding after
  a framework update
- **Project root detection** — Finds the nearest `package.json` to determine
  the project root

<Aside type="tip">
Run `init` after upgrading `@community-rss/core` with `--force` to get
updated templates. Review the diff before committing.
</Aside>

### Example

```bash
# Initial setup
npx @community-rss/core init

# Re-scaffold after upgrade
npx @community-rss/core init --force
```

## Programmatic Usage

The CLI is also available as a JavaScript module:

```js
import { scaffold, findProjectRoot } from '@community-rss/core/cli/init.mjs';

await scaffold({
  projectRoot: findProjectRoot(),
  force: false,
});
```

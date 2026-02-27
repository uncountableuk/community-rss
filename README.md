# Community RSS Framework

A white-label **Astro integration** that transforms any Astro project into a
community-driven RSS reader. Install the NPM package, scaffold your pages,
and deploy to any VPS with Docker.

## Quick Start

```bash
# Create a new Astro project
npm create astro@latest my-community
cd my-community

# Add the framework
npm install @community-rss/core

# Scaffold pages, email templates, and config
npx @community-rss/core init

# Start developing
npm run dev
```

## What You Get

| Layer | What it does |
|-------|-------------|
| **11 API routes** | Articles, auth, feeds, comments, hearts — injected automatically |
| **8 page templates** | Homepage, article, auth, profile — scaffolded into your project, fully yours to customise |
| **3 email templates** | Sign-in, welcome, email-change — HTML with `{{variable}}` substitution |
| **SQLite database** | Zero-config persistent storage via better-sqlite3 + Drizzle ORM |
| **FreshRSS sync** | Scheduled feed aggregation from any FreshRSS instance |
| **Magic-link auth** | Passwordless authentication via better-auth |
| **Design tokens** | CSS custom properties (`--crss-*`) for full visual control |

## Architecture

**"Integration with overrides"** — the package injects backend logic
(API routes, middleware, database, scheduling) while you own the frontend
(pages, styles, email templates).

```
your-project/
├── src/pages/          ← Your pages (scaffolded, then yours to edit)
├── src/styles/         ← Your theme overrides
├── src/email-templates/← Your email templates
├── astro.config.mjs    ← Imports communityRss() integration
└── .env                ← Your environment variables
```

## Monorepo Structure (Contributors)

```
/
├── packages/core/   ← The @community-rss/core framework (published to NPM)
├── playground/      ← Ephemeral dev app (gitignored, rebuilt on demand)
├── docs/            ← Starlight documentation site
└── feature_plans/   ← Release planning documents
```

### Dev Workflow

The playground is **ephemeral** — it's not checked into Git. A reset
script tears it down and rebuilds it from the CLI scaffold, exactly
as a consumer would experience.

```bash
# First time / after cloning
npm install && npm run reset:playground

# Day-to-day development
npm run dev:playground              # Start Astro dev server

# After changing CLI templates or pages
npm run reset:playground            # Rebuilds pages, keeps your DB + test data

# Full clean (wipe database too)
npm run hardreset:playground        # Starts completely fresh
```

**Backend changes are instant** — API routes, middleware, components, and
utilities live in `packages/core/` and are symlinked into the playground
via NPM workspaces. Edit a route handler or component and the dev server
hot-reloads immediately.

**Page/template changes require a reset** — pages and email templates
are scaffolded (copied) into the playground by the CLI. After editing
CLI templates, run `npm run reset:playground` to rebuild. Your database
and test accounts are preserved by default.

### Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start playground + docs dev servers |
| `npm run dev:playground` | Start playground only |
| `npm run dev:docs` | Start docs site only |
| `npm run reset:playground` | Rebuild playground (keeps DB) |
| `npm run hardreset:playground` | Full clean rebuild (wipes DB) |
| `npm test` | Run all tests |
| `npm run test:coverage` | Coverage report (≥80% required) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Astro SSR + `@astrojs/node` |
| Database | SQLite (better-sqlite3) + Drizzle ORM |
| Auth | better-auth (magic links) |
| RSS Source | FreshRSS |
| Scheduling | node-cron |
| Storage | MinIO (S3-compatible) |
| Email | Nodemailer (Mailpit for dev) |
| Docs | Starlight |

## Licence

[GPL-3.0](LICENSE)
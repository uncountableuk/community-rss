---
title: Customisation
description: How to customise pages, components, email templates, and themes.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Community RSS follows an **"integration with overrides"** architecture.
The framework injects API routes and middleware, while you own the page
routes and can customise every visible aspect of your site.

## Pages

Page routes are **scaffolded** into your project when you run:

```bash
npx @community-rss/core init
```

This generates 8 page files in `src/pages/`:

| Page | Path | Purpose |
|------|------|---------|
| `index.astro` | `/` | Homepage / article feed |
| `article/[id].astro` | `/article/:id` | Single article view |
| `feeds.astro` | `/feeds` | Feed directory |
| `submit.astro` | `/submit` | Submit a new feed |
| `profile.astro` | `/profile` | User profile |
| `admin.astro` | `/admin` | Admin dashboard |
| `auth/signin.astro` | `/auth/signin` | Sign-in page |
| `auth/signup.astro` | `/auth/signup` | Sign-up page |

Since these files live in **your** project, you can:

- Modify the layout and structure
- Add custom sections or content
- Change the routing paths
- Remove pages you don't need

<Aside type="tip">
Running `npx @community-rss/core init` again will not overwrite existing
files. Use `--force` to regenerate all scaffolded files.
</Aside>

## Components

Framework components accept **`messages`** and **`labels`** props for
full text customisation. No user-facing strings are hard-coded.

```astro
---
import ArticleCard from '@community-rss/core/components/ArticleCard.astro';
---
<ArticleCard
  article={article}
  messages={{
    readMore: 'Continue reading',
    by: 'Written by',
  }}
  labels={{
    hearts: 'Likes',
    comments: 'Responses',
  }}
/>
```

### Available Components

| Component | Key Props |
|-----------|-----------|
| `ArticleCard` | `article`, `messages`, `labels` |
| `ArticleModal` | `article`, `messages` |
| `AuthButton` | `messages`, `labels` |
| `CommentSection` | `articleId`, `messages` |
| `FeedList` | `feeds`, `messages` |
| `HeartButton` | `articleId`, `labels` |

## Layouts

The framework provides a base layout that you can extend:

```astro
---
import CommunityLayout from '@community-rss/core/layouts/CommunityLayout.astro';
---
<CommunityLayout title="My Page">
  <header slot="header">
    <!-- Custom header -->
  </header>

  <main>
    <!-- Your content -->
  </main>

  <footer slot="footer">
    <!-- Custom footer -->
  </footer>
</CommunityLayout>
```

## Email Templates

Customise email content by editing the scaffolded `.astro` templates in
your `emailTemplateDir` directory (default: `./src/email-templates/`).
Templates are full Astro components that receive props like `url`,
`appName`, `greeting`, and `theme`.

For simpler customisations, you can also drop in a plain `.html` file
using `{{variable}}` placeholders.

See the [Email Setup](/guides/email-setup/#email-templates) guide for
template variables, theming, and examples.

## Theming

Override CSS design tokens to change colours, typography, and spacing.
The framework uses a **three-tier token system** — see the
[Styling Guide](/guides/styling/) for an overview and the
[CSS Tokens Reference](/api-reference/css-tokens/) for the full token list.

Your `theme.css` is un-layered, so it always overrides framework defaults
without needing `!important`.

## Astro Actions

Server communication uses Astro Actions instead of raw `fetch()`. The
CLI scaffolds `src/actions/index.ts` with all available handlers
pre-registered. You can customise input validation or add your own
actions alongside the framework's.

See the [Actions Reference](/api-reference/actions/) for the full API.

## Server Islands

Auth-dependent UI (sign-in button, CTA) uses `server:defer` to stream
content after the initial page loads. Provide a `slot="fallback"` element
for loading skeletons:

```astro
<AuthButton server:defer>
  <div slot="fallback" class="auth-skeleton" />
</AuthButton>
```

## Proxy Component Wrappers

Scaffolded components in `src/components/` are thin wrappers around
framework components. They import from `@community-rss/core/components/*`
and own the `<style>` block:

```astro
---
import CoreFeedCard from '@community-rss/core/components/FeedCard.astro';
---
<div class="my-feed-card">
  <CoreFeedCard {...Astro.props} />
</div>
<style>
  .my-feed-card :global(.crss-feed-card) {
    --crss-comp-card-bg: #1e293b;
  }
</style>
```

Rules:
- Pass all props through via `{...Astro.props}`
- No business logic, API calls, or data transformation
- Only: styling overrides, slot content, surrounding markup

## Configuration Files

The CLI also scaffolds configuration files:

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro + integration config |
| `.env.example` | Environment variable template |
| `src/styles/theme.css` | CSS design token overrides |
| `docker-compose.yml` | Docker services for local dev |

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

Customise email content by placing HTML templates in your
`emailTemplateDir` directory (default: `./src/email-templates/`).

See the [Email Setup](/guides/email-setup/#email-templates) guide for
template variables and examples.

## Theming

Override CSS design tokens to change colours, typography, and spacing.
See the [Theming](/guides/theming/) guide for the full token reference.

## Configuration Files

The CLI also scaffolds configuration files:

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro + integration config |
| `.env.example` | Environment variable template |
| `src/styles/theme.css` | CSS design token overrides |
| `docker-compose.yml` | Docker services for local dev |

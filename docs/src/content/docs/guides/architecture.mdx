---
title: Architecture Overview
description: Design principles and architectural patterns of the Community RSS framework.
---

import { Aside } from '@astrojs/starlight/components';

## Adopted Principles

Community RSS follows these architectural principles:

| Principle | Implementation |
|-----------|---------------|
| **Integration with Overrides** | Framework injects API routes and middleware; developers own pages |
| **Three-Tier Design Tokens** | Reference → System → Component token hierarchy |
| **CSS Cascade Layers** | Framework styles in `@layer`; consumer styles un-layered and always win |
| **Astro Actions** | Pure server handlers; consumer registers via `defineAction` |
| **Server Islands** | Auth-dependent UI streams via `server:defer` |
| **Container API Email** | Astro components for rich email rendering |
| **Proxy Component Pattern** | Core owns logic; scaffolded wrappers own styling |
| **Utils-First Architecture** | Business logic in `utils/`; components are thin wrappers |

## Astro Actions

Action handlers are pure functions with the signature:
```ts
(input: T, app: AppContext) => Promise<Result>
```

They live in `packages/core/src/actions/` and are exported from
`@community-rss/core/actions`. The core package **cannot** import
`astro:actions` — only consumer projects can.

### Consumer Registration

Consumers register handlers in their scaffolded `src/actions/index.ts`:

```ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { fetchArticlesHandler } from '@community-rss/core/actions';

export const server = {
  fetchArticles: defineAction({
    input: z.object({
      page: z.number().optional().default(1),
      tab: z.string().optional().default('latest'),
    }),
    handler: async (input, context) => {
      return fetchArticlesHandler(input, context.locals.app);
    },
  }),
};
```

### Available Handlers

| Handler | Input | Description | Since |
|---------|-------|-------------|-------|
| `fetchArticlesHandler` | `{ page, tab, feedId }` | Paginated article fetch | 0.5.0 |
| `checkEmailHandler` | `{ email }` | Check if email exists | 0.5.0 |
| `submitSignupHandler` | `{ email, name, agreedToTerms }` | Create pending signup | 0.5.0 |
| `updateProfileHandler` | `{ name, bio }` | Update user profile | 0.5.0 |
| `changeEmailHandler` | `{ newEmail }` | Initiate email change | 0.5.0 |
| `confirmEmailChangeHandler` | `{ token }` | Confirm email change | 0.5.0 |

## Server Islands

Auth-dependent UI components use `server:defer` to stream content after
the initial page shell loads:

```astro
<AuthButton server:defer>
  <div slot="fallback" class="skeleton" />
</AuthButton>
```

These components check authentication server-side via
`createAuth(app).api.getSession()` — no client-side `fetch()` needed.
Always provide a `slot="fallback"` for loading skeletons.

<Aside type="note">
Components using `server:defer` access context from `Astro.locals.app`,
not from props passed by the parent page.
</Aside>

## Container API Email Pipeline

Emails are rendered through a 5-step resolution chain:

1. **Custom code templates** — Developer-registered rendering functions
2. **Developer HTML** — `{{variable}}` templates in `emailTemplateDir`
3. **Astro Container API** — `.astro` email components rendered server-side
4. **Package HTML** — Default `{{variable}}` templates shipped with the framework
5. **Code-based fallbacks** — Minimal inline HTML

Astro email components live in `src/templates/email/` and use the
Container API + [juice](https://www.npmjs.com/package/juice) for CSS
inlining (required by email clients).

## Deferred Principles

These patterns were evaluated but deferred for future consideration:

| Pattern | Status | Reasoning |
|---------|--------|-----------|
| Middleware-based i18n | Deferred | Adds complexity; `messages` props cover most cases |
| Plugin system | Deferred | Focus on stable core API first |
| GraphQL API | Deferred | REST + Actions sufficient for current needs |
| Edge runtime | Deferred | SQLite requires Node.js; edge SQLite is experimental |

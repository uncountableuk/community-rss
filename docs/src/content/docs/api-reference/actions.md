---
title: Astro Actions
description: Server action handlers exported by the Community RSS framework.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Community RSS exports **pure action handlers** that can be registered
as Astro Actions in your project. Actions replace manual `fetch()` calls
with type-safe, validated server communication.

## Setup

The CLI scaffolds `src/actions/index.ts` automatically. If you need to
add it manually:

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import {
  fetchArticlesHandler,
  checkEmailHandler,
  submitSignupHandler,
  updateProfileHandler,
  changeEmailHandler,
  confirmEmailChangeHandler,
} from '@community-rss/core/actions';

export const server = {
  fetchArticles: defineAction({
    input: z.object({
      page: z.number().optional().default(1),
      tab: z.string().optional().default('latest'),
      feedId: z.string().optional(),
    }),
    handler: async (input, context) => {
      return fetchArticlesHandler(input, context.locals.app);
    },
  }),
  // ... additional actions
};
```

<Aside type="caution">
The `@community-rss/core` package cannot import `astro:actions` directly.
Action handlers are pure functions — your project registers them with Astro.
</Aside>

## Action Reference

### `fetchArticlesHandler`

Fetches a paginated list of articles with optional filtering.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | `number` | No | `1` | Page number |
| `tab` | `string` | No | `'latest'` | Sort tab (`latest`, `trending`) |
| `feedId` | `string` | No | — | Filter by feed ID |

**Returns:** `{ articles, totalPages, currentPage }`

```ts
// Client-side usage
import { actions } from 'astro:actions';
const result = await actions.fetchArticles({ page: 1, tab: 'latest' });
```

### `checkEmailHandler`

Checks whether an email address is already registered.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | `string` | Yes | Email to check |

**Returns:** `{ exists: boolean }`

### `submitSignupHandler`

Creates a pending signup record and sends a verification email.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | `string` | Yes | User's email |
| `name` | `string` | Yes | Display name |
| `agreedToTerms` | `boolean` | Yes | Terms acceptance |

**Returns:** `{ success: boolean, message: string }`

### `updateProfileHandler`

Updates the authenticated user's profile information.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | No | New display name |
| `bio` | `string` | No | New bio text |

**Returns:** `{ success: boolean }`

<Aside type="note">
Requires an authenticated session. Returns an error if not signed in.
</Aside>

### `changeEmailHandler`

Initiates an email change by sending a verification email to the new address.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `newEmail` | `string` | Yes | New email address |

**Returns:** `{ success: boolean, message: string }`

### `confirmEmailChangeHandler`

Confirms an email change using the verification token.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | `string` | Yes | Verification token |

**Returns:** `{ success: boolean }`

## Migrating from `fetch()`

Replace manual API calls with actions:

```diff
- // Before: manual fetch
- const res = await fetch('/api/v1/articles?page=1&tab=latest');
- const data = await res.json();

+ // After: Astro Actions
+ import { actions } from 'astro:actions';
+ const data = await actions.fetchArticles({ page: 1, tab: 'latest' });
```

Benefits:
- **Type safety** — Input validated by Zod, output typed
- **No URL construction** — Framework handles routing
- **Error handling** — Structured errors via Astro's action system
- **Forward compatible** — API shape maintained across versions

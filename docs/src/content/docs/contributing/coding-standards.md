---
title: Coding Standards
description: Code conventions and patterns for contributing to Community RSS.
---

import { Aside } from '@astrojs/starlight/components';

## Token Naming Conventions

All CSS custom properties use the `--crss-` prefix:

| Tier | Prefix | Example |
|------|--------|---------|
| Reference | `--crss-ref-` | `--crss-ref-gray-900` |
| System | `--crss-sys-` | `--crss-sys-color-primary` |
| Component | `--crss-comp-` | `--crss-comp-card-bg` |
| Flat alias | `--crss-` | `--crss-surface-0` |

Never use hardcoded hex/rgb values in components. Always reference tokens.

## CSS Layer Rules

All framework CSS must be placed inside `@layer` declarations:

```css
/* ✅ Correct */
@layer crss-components {
  .crss-feed-card { background: var(--crss-comp-card-bg); }
}

/* ❌ Wrong — un-layered styles conflict with consumer overrides */
.crss-feed-card { background: var(--crss-comp-card-bg); }
```

Layer order: `crss-reset, crss-tokens, crss-base, crss-components, crss-utilities`

## Action Handler Pattern

Action handlers are pure async functions:

```ts
// src/actions/domain.ts
export async function myHandler(
  input: MyInput,
  app: AppContext,
): Promise<MyResult> {
  // Use app.db, app.env, app.config
  return { success: true };
}
```

Rules:
- Accept `(input, app: AppContext)` — never raw `Request`
- Export from `src/actions/index.ts` barrel
- Re-export from `packages/core/index.ts` with `@since` tag
- Add Zod wrapper to scaffold template `cli/templates/actions/index.ts`
- Write tests in `test/actions/domain.test.ts`

## Server Island Components

Components using `server:defer`:
- Access context from `Astro.locals.app` (not parent props)
- Must provide `slot="fallback"` when used
- Perform server-side auth checks via `createAuth(app).api.getSession()`

## Import Standards

| Context | Import Style | Example |
|---------|-------------|---------|
| Source code | Relative | `../utils/build/auth` |
| Test code | Path alias | `@utils/build/auth` |
| Playground | Package | `@community-rss/core` |

<Aside type="caution">
Path aliases in source code break consumers. Always use relative imports
in `packages/core/src/`.
</Aside>

## JSDoc Requirements

All public exports must have JSDoc with `@since`:

```ts
/**
 * Calculates a trending score for an article.
 * @param hearts - Number of hearts
 * @param options - Scoring weights
 * @returns Normalised trending score
 * @since 0.5.0
 */
export function calculateTrendingScore(
  hearts: number,
  options?: TrendingOptions,
): number { ... }
```

## Component Rules

1. No business logic — extract to `utils/`
2. Accept `messages`/`labels` props for user-facing text
3. Use `--crss-*` tokens for all visual values
4. Place styles in `@layer crss-components` when outside scoped `<style>`
5. Use BEM-style class names with `crss-` prefix

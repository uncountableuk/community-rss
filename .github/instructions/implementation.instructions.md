---
applyTo: "packages/core/src/utils/**/*.ts,packages/core/src/components/**/*.astro,packages/core/src/layouts/**/*.astro,packages/core/src/routes/**/*.ts"
---

# Implementation Instructions

## Monorepo Context
You are working inside an NPM Workspaces monorepo. The framework lives in
`packages/core/` and the reference app in `playground/`. All business logic
belongs in `packages/core/src/utils/`. The playground imports the framework
only via `@community-rss/core`.

## Utils Organization
Before creating a new utility:
1. Search existing utils for similar functionality
2. Choose correct directory by execution context:
   - `utils/build/` — Runs in Node.js / Cloudflare Worker (cron, sync, queues)
   - `utils/client/` — Runs in browser (DOM, interactions UI)
   - `utils/shared/` — Pure functions (validation, formatting, scoring)
3. Database queries live in `src/db/` — not in utils

## Function Standards
- Export all functions that need testing
- Use TypeScript `interface` for parameter objects and return types
- Add JSDoc comments with `@param`, `@returns`, and `@since` version tags
- Keep functions pure when possible
- Public APIs (exported from `index.ts`) must be forward-compatible

## Component Standards
- Components are thin wrappers — NO business logic
- Import logic from `@utils/`
- Use CSS custom properties for all themeable values (no hard-coded colours)
- Provide sensible visual defaults that consumers can override

## Import Standards
- **MANDATORY**: Always use path aliases for ALL cross-directory imports
- Never use relative paths (`../`) for cross-directory imports
- Same-directory imports may use relative paths (`./sibling`)

### Path Alias Reference
| Path Alias | Maps To | Usage |
|------------|---------|-------|
| `@utils/*` | `src/utils/*` | Utility function imports |
| `@components/*` | `src/components/*` | Component imports |
| `@routes/*` | `src/routes/*` | Route handler imports |
| `@db/*` | `src/db/*` | Database queries & schema |
| `@core-types/*` | `src/types/*` | TypeScript interfaces |
| `@layouts/*` | `src/layouts/*` | Layout imports |

## Cloudflare Bindings
- Never hard-code binding names — reference typed `Env` interface
- D1 database accessed via `env.DB`
- R2 bucket via `env.MEDIA_BUCKET`
- Queues via `env.ARTICLE_QUEUE`
- All bindings typed in `src/types/env.d.ts`

## Styling
- Use CSS custom properties (e.g., `--crss-surface`, `--crss-text`, `--crss-brand`)
- Prefix all framework tokens with `--crss-` to avoid consumer namespace collisions
- Framework ships sensible defaults; consumers remap tokens via integration config

## Example Pattern
```typescript
// ✅ GOOD: packages/core/src/utils/shared/scoring.ts
export interface TrendingOptions {
  /** Weight for hearts (0-1). @since 0.1.0 */
  heartWeight?: number;
  /** Weight for comments (0-1). @since 0.1.0 */
  commentWeight?: number;
  /** Time window in hours. @since 0.1.0 */
  windowHours?: number;
}

/**
 * Calculates a trending score for an article.
 * @param hearts - Number of hearts
 * @param comments - Number of comments
 * @param options - Scoring weights and window
 * @returns Normalised trending score
 * @since 0.1.0
 */
export function calculateTrendingScore(
  hearts: number,
  comments: number,
  options: TrendingOptions = {}
): number {
  const { heartWeight = 0.6, commentWeight = 0.4 } = options;
  return hearts * heartWeight + comments * commentWeight;
}
```

```astro
---
// ✅ GOOD: packages/core/src/components/TrendingBadge.astro
import { calculateTrendingScore } from '@utils/shared/scoring';

const score = calculateTrendingScore(hearts, comments);
---
<span class="trending-badge">{score}</span>
<style>
  .trending-badge { color: var(--crss-brand); }
</style>
```

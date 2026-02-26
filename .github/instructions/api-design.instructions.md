---
applyTo: "packages/core/index.ts,packages/core/src/types/**/*.ts,packages/core/src/routes/**/*.ts"
---

# API Design Instructions

## Core Principle: Forward Compatibility
After 1.0.0, live implementations depend on this framework's public API.
Every design decision must prioritise stability and extensibility.

## Public API Surface
The public API is everything exported from `packages/core/index.ts`:
- The Astro integration factory: `communityRss(options?)`
- Configuration interfaces: `CommunityRssOptions`, `ThemeConfig`, etc.
- Type exports: `AppContext`, `EnvironmentVariables`, `CommunityRssError`
- Utility functions explicitly re-exported for consumer use

## CLI Surface
The `npx @community-rss/core init` command scaffolds developer-owned files:
- 8 page routes (developer-owned, not injected)
- 3 email templates (HTML with `{{variable}}` substitution)
- Configuration files (astro.config.mjs, .env.example, docker-compose.yml, theme.css)
- CLI supports `--force` (overwrite existing) and `--help` flags
- CLI must remain backward-compatible — new scaffold files are additive

## Design Rules

### Options Pattern (MANDATORY)
All configuration uses a single options object with optional properties:

```typescript
// ✅ GOOD — extensible, forward-compatible
export interface CommunityRssOptions {
  /** Maximum feeds per verified author. @since 0.1.0 */
  maxFeeds?: number;
  /** Comment permission level. @since 0.1.0 */
  commentTier?: 'verified' | 'registered' | 'guest';
  /** Trending algorithm weights. @since 0.2.0 */
  trending?: TrendingConfig;
}

export default function communityRss(
  options: CommunityRssOptions = {}
): AstroIntegration {
  const { maxFeeds = 5, commentTier = 'registered' } = options;
  // ...
}
```

```typescript
// ❌ BAD — positional params cannot be extended without breaking
export default function communityRss(
  maxFeeds: number,
  commentTier: string
): AstroIntegration { }
```

### Interface Over Type (MANDATORY for Public API)
Use `interface` for all public-facing shapes to allow declaration merging:

```typescript
// ✅ Allows consumers to augment
export interface CommunityRssOptions {
  maxFeeds?: number;
}

// ❌ Cannot be augmented by consumers
export type CommunityRssOptions = {
  maxFeeds?: number;
};
```

### Versioned JSDoc (MANDATORY)
Every public export must include `@since` tags:

```typescript
/**
 * Configures and returns the Community RSS Astro integration.
 * @param options - Framework configuration
 * @returns Astro integration instance
 * @since 0.1.0
 */
export default function communityRss(
  options?: CommunityRssOptions
): AstroIntegration;
```

### Route Architecture
The framework uses a split route architecture:

**Injected API routes** — owned by the package, injected during
integration setup:
- `GET /api/v1/articles` — article listing
- `POST /api/v1/interactions` — hearts, stars
- `ALL /api/auth/[...all]` — better-auth catch-all
- Admin routes under `/api/v1/admin/...`

**Scaffolded page routes** — developer-owned, created by CLI:
- 8 pages scaffolded to `src/pages/` via `npx @community-rss/core init`
- Pages are owned by the developer and can be customised freely
- Pages import components from `@community-rss/core/components/*`
- Pages fetch data client-side from the API routes

If a breaking route change is needed post-1.0.0, introduce `/api/v2/`
and keep `/api/v1/` working with a deprecation notice.
Auth routes (`/api/auth/*`) are managed entirely by better-auth's native
router via a single catch-all endpoint — do not create manual wrapper routes.

### Database Layer
Public API routes that touch the database must use Drizzle ORM query
helpers from `src/db/queries/` — never expose raw SQL or construct queries
inline in route handlers. The database is better-sqlite3 accessed via
`BetterSQLite3Database` from the `AppContext`. This ensures type safety
and keeps business logic testable.

### Admin Routes
Admin-only routes use the `/api/v1/admin/` namespace and must verify the
requesting user has an admin role before processing. Admin users bypass
domain verification for feed operations but still use the same API
contracts as regular users.

### SemVer Rules

#### Pre-1.0.0 (Current Phase)
- Breaking changes allowed but must be documented in the feature plan
- Use `0.MINOR.PATCH` — minor bumps may include breaking changes
- Design as if 1.0.0 is imminent: prefer stable patterns now

#### Post-1.0.0 (Strict SemVer)
- **PATCH** (x.y.Z): Bug fixes, no API changes
- **MINOR** (x.Y.0): New features, new optional parameters — fully backward-compatible
- **MAJOR** (X.0.0): Breaking changes — requires migration guide
- Deprecate before removing: mark with `@deprecated` JSDoc, log console warning, remove in next MAJOR

### Parameter Evolution
When adding capabilities to an existing function:

```typescript
// v0.1.0 — original
export interface SyncOptions {
  feedUrl: string;
}

// v0.3.0 — extended (non-breaking)
export interface SyncOptions {
  feedUrl: string;
  /** Override the default polling interval. @since 0.3.0 */
  intervalMinutes?: number;
  /** Skip image caching for this sync. @since 0.3.0 */
  skipImageCache?: boolean;
}
```

New properties are **always optional** with sensible defaults.

### Error Contracts
Public API errors must be structured and stable:

```typescript
export interface CommunityRssError {
  code: string;      // Machine-readable, e.g., 'FEED_NOT_FOUND'
  message: string;   // Human-readable description
  details?: unknown; // Optional diagnostic payload
}
```

Error codes are part of the public API — never rename or remove them
post-1.0.0 without a MAJOR bump.

## Checklist for New Public APIs
- [ ] Uses Options pattern (single config object, all optional)
- [ ] Defined with `interface` (not `type`)
- [ ] JSDoc with `@param`, `@returns`, `@since`
- [ ] Default values for all optional parameters
- [ ] Error codes documented
- [ ] Added to `packages/core/index.ts` exports
- [ ] API reference documentation written
- [ ] Forward-compatibility reviewed (can this evolve without breaking?)

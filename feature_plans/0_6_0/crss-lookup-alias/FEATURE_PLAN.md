# Feature Plan: `@crss-lookup/` Component Resolution Alias

**Version:** 0.6.0  
**Feature path:** `feature_plans/0_6_0/crss-lookup-alias/`

---

## 0. Requirements Check

No conflicts found with Reference Requirements. This feature strengthens the
progressive customisation model described in `reference-requirements/developer-experience.md`
by making consumer overrides take effect automatically throughout the component
tree, not just at page-level injection boundaries.

---

## 1. Overview

**Problem:** When a developer ejects `FeedCard.astro` and adds a `<p>Hello</p>`
to the `after-unnamed-slot`, those changes are invisible to the homepage grid
because `FeedGrid` (still using the core version) imports `FeedCard` via a
plain relative path (`./FeedCard.astro`). The relative import resolves to the
core package's own copy — bypassing the ejected proxy entirely.

The existing `crss-consumer-overrides` Vite plugin only redirects relative
imports that originate from *core page files*. Components and layouts that import
their own sub-dependencies as relative paths are invisible to it.

**Solution:** Introduce a `@crss-lookup/` virtual import prefix. Any core
`.astro` import of another ejectable component or layout uses this prefix
instead of a relative path. The integration's Vite plugin resolves
`@crss-lookup/components/X.astro` → _consumer proxy if it exists_, otherwise
the core file. This resolution fires for any importer anywhere (not just pages),
so ejected components automatically cascade.

**Who benefits:** Any developer who ejects a component — their override is
automatically picked up by all parent components, layouts, and pages that use it,
without also ejecting those parents.

---

## 2. Codebase Review

### Files modified

| File | Change |
|---|---|
| `packages/core/src/integration.ts` | Extend `crss-consumer-overrides` `resolveId()` to handle `@crss-lookup/` prefix |
| `packages/core/src/components/FeedGrid.astro` | `./FeedCard.astro` → `@crss-lookup/components/FeedCard.astro` |
| `packages/core/src/layouts/BaseLayout.astro` | Two relative imports → `@crss-lookup/components/...` |
| `packages/core/src/pages/index.astro` | Four relative imports → `@crss-lookup/...` |
| `packages/core/src/pages/terms.astro` | One relative import → `@crss-lookup/layouts/...` |
| `packages/core/src/pages/profile.astro` | One relative import → `@crss-lookup/layouts/...` |
| `packages/core/src/pages/auth/signin.astro` | Two relative imports + `@importfrom1` annotation |
| `packages/core/src/pages/auth/signup.astro` | Two relative imports + `@importfrom1` annotation |
| `packages/core/src/pages/auth/verify.astro` | One relative import → `@crss-lookup/layouts/...` |
| `packages/core/src/pages/auth/verify-email-change.astro` | One relative import → `@crss-lookup/layouts/...` |
| `packages/core/src/pages/article/[id].astro` | One relative import → `@crss-lookup/layouts/...` |
| `packages/core/src/pages/index.astro` | Three `@importfromN` annotation values → `@crss-lookup/...` |
| `packages/core/src/layouts/BaseLayout.astro` | `@importfrom1` annotation value → `@crss-lookup/...` |
| `packages/core/src/cli/eject.mjs` | Update `extraImports` filter and legacy re-eject regex to recognise `@crss-lookup/` |
| `.github/copilot-instructions.md` | Add `@crss-lookup/` import standard |
| `.github/instructions/implementation.instructions.md` | Document the alias in Import Standards |
| `.github/instructions/eject-annotations.instructions.md` | Document `@importfromN` → `@crss-lookup/` |

### Files NOT modified

- `packages/core/src/templates/email/*.astro` — internal email templates,
  not ejectable via `npx crss eject`, so relative `./EmailLayout.astro` imports
  remain unchanged
- `packages/core/src/cli/templates/email-templates/*.astro` — same reason  
- Non-ejectable utility imports (`../../db/queries/articles`, `../../types/context`)
  remain as relative imports

### No new dependencies

The Vite plugin (`integration.ts`) already has `existsSync`, `join`, `resolve`,
`dirname` from Node built-ins.

---

## 3. Architecture & API Design

### How `@crss-lookup/` resolves

The `crss-consumer-overrides` plugin's `resolveId()` hook processes every
`@crss-lookup/<category>/<FileName>.astro` specifier:

```
@crss-lookup/components/FeedCard.astro
  → <consumerRoot>/src/components/FeedCard.astro  (if exists)
  → <coreDir>/components/FeedCard.astro            (fallback)

@crss-lookup/layouts/BaseLayout.astro
  → <consumerRoot>/src/layouts/BaseLayout.astro  (if exists)
  → <coreDir>/layouts/BaseLayout.astro            (fallback)
```

The check does **not** gate on `importer` — the prefix itself is the signal.

### Circular import prevention

An ejected proxy (`playground/src/components/FeedCard.astro`) imports the core
component directly via `@community-rss/core/components/FeedCard.astro` (the
`CoreFeedCard` import in its frontmatter). This is a **bare package specifier**
resolved by Node.js package exports, never by this plugin. There is no cycle.

The `@crss-lookup/` alias is only used in *core source files* — and in
`@importfromN` annotation values that end up in ejected proxies as
_additional_ imports for slot content, not for the primary proxy component
import.

### `eject.mjs` changes

- **`extraImports` filter**: imports starting with `@crss-lookup/` join
  `@community-rss/core/` on the exclusion list — they are managed by the
  framework and must not be duplicated by the developer.
- **Legacy re-eject fallback regex**: updated to also match `@crss-lookup/`
  specifiers when inserting extra developer imports.
- **`@importfromN` annotation values** in source files changed from
  `@community-rss/core/components/X.astro` to `@crss-lookup/components/X.astro`
  so ejected proxies automatically use lookup resolution for their slot imports.

### Public API impact

**None.** No new exports are added to `packages/core/index.ts`. The alias is
entirely resolved by the Vite plugin at build/dev time — consumers never see
it in their own code unless they choose to use it.

### Forward-compatibility

Adding more ejectable components in future requires only that their intra-package
imports use `@crss-lookup/`. No registry or configuration changes needed.

---

## 4. Implementation Phases

### Phase 1: Vite Plugin
- [ ] Extend `crss-consumer-overrides` `resolveId()` in `integration.ts` for `@crss-lookup/`
- [ ] Keep existing relative-import interception from core pages intact

### Phase 2: Core `.astro` Import Migration
- [ ] `FeedGrid.astro` — `./FeedCard.astro` → `@crss-lookup/components/FeedCard.astro`
- [ ] `BaseLayout.astro` — 2 relative imports → `@crss-lookup/components/...`
- [ ] `pages/index.astro` — 4 relative imports → `@crss-lookup/...`
- [ ] `pages/terms.astro`, `pages/profile.astro`, `pages/article/[id].astro`,
  `pages/auth/(verify|verify-email-change).astro` — BaseLayout imports → `@crss-lookup/layouts/...`
- [ ] `pages/auth/signin.astro` — 2 relative imports → `@crss-lookup/...`
- [ ] `pages/auth/signup.astro` — 2 relative imports → `@crss-lookup/...`

### Phase 3: Annotation `@importfromN` Values
- [ ] `pages/index.astro` — 3 `@importfromN` values → `@crss-lookup/...`
- [ ] `pages/auth/signin.astro` — 1 `@importfromN` value → `@crss-lookup/...`
- [ ] `pages/auth/signup.astro` — 1 `@importfromN` value → `@crss-lookup/...`
- [ ] `layouts/BaseLayout.astro` — 1 `@importfromN` value → `@crss-lookup/...`

### Phase 4: `eject.mjs` Updates
- [ ] `extraImports` filter: exclude `@crss-lookup/` imports
- [ ] Legacy fallback regex: also match `@crss-lookup/` for extra-import insertion

### Phase 5: Documentation & AI Instructions
- [ ] `copilot-instructions.md` — Import Standards section
- [ ] `implementation.instructions.md` — Import Standards table
- [ ] `eject-annotations.instructions.md` — `@importfromN` convention

---

## 5. Test Strategy

No new unit tests are required for this change — the Vite plugin's `resolveId`
is a pure path resolution function that is exercised by the playground build.

The existing E2E test suite covers the full page render, so any regression in
component rendering will be caught by `npm run test:e2e`.

Manual verification: run `npm run reset:playground`, eject `FeedCard`, add
`<p>Hello</p>` to `after-unnamed-slot`, confirm it appears on every card.

---

## 6. Documentation Updates

- Import standard documented in AI instruction files (Phases 5)
- No Starlight doc pages added (internal architecture detail, not consumer-facing API)

---

## 7. Implementation Notes

### Phase 1: Vite Plugin — ✅ Completed
- [x] Extend `crss-consumer-overrides` `resolveId()` in `integration.ts` for `@crss-lookup/`
- [x] Keep existing relative-import interception from core pages intact

> **Notes:** The new `@crss-lookup/` branch in `resolveId` runs first, before
> the legacy relative-import guard. It does not gate on `importer` — only the
> prefix matters. Fallback always returns the core file path so Vite never gets
> an unresolved specifier.

### Phase 2: Core `.astro` Import Migration — ✅ Completed then Reverted (see Pivot note below)
- [x] `FeedGrid.astro` — initially migrated to `@crss-lookup/`, then reverted to `./FeedCard.astro`
- [x] `BaseLayout.astro` — initially migrated, then reverted to relative imports
- [x] All page `.astro` files — initially migrated, then reverted to relative imports

> **Notes:** Migration to `@crss-lookup/` was completed, then reverted after a
> runtime error in the playground. See "Phase 2 Pivot" in Problems & Constraints
> below. The actual cascade mechanism is the expanded Vite plugin scope (Phase 1)
> combined with existing relative imports. Non-ejectable imports (db queries,
> types, utils) and email template components were never changed.

### Phase 3: Annotation `@importfromN` Values — ✅ Completed
- [x] `pages/index.astro` — 3 `@importfromN` values → `@crss-lookup/...`
- [x] `pages/auth/signin.astro` — 1 `@importfromN` value → `@crss-lookup/...`
- [x] `pages/auth/signup.astro` — 1 `@importfromN` value → `@crss-lookup/...`
- [x] `layouts/BaseLayout.astro` — 1 `@importfromN` value → `@crss-lookup/...`

> **Notes:** The `corePath` used for the proxy's own `CoreXxx` import remains
> `@community-rss/core/...` — changing it to `@crss-lookup/` would cause
> circular resolution in ejected proxies.

### Phase 4: `eject.mjs` Updates — ✅ Completed
- [x] `extraImports` filter: exclude `@crss-lookup/` imports
- [x] Legacy fallback regex: also match `@crss-lookup/` for extra-import insertion

> **Notes:** Both the inner and fallback `extraImports` filters were updated
> together. 4 test assertions updated to reflect new `@crss-lookup/` paths.

### Phase 5: Documentation & AI Instructions — ✅ Completed
- [x] `copilot-instructions.md` — Import Standards section
- [x] `implementation.instructions.md` — Import Standards table
- [x] `eject-annotations.instructions.md` — `@importfromN` convention + examples

---

### Phase 2 Pivot: Core `.astro` files reverted to relative imports

After Phases 1–5 were completed and working in tests, a **runtime error**
appeared in the playground dev server:

```
Cannot find module '@crss-lookup/layouts/BaseLayout.astro'
imported from '/app/packages/core/src/pages/index.astro'
```

**Root cause**: Astro 5 / Vite 6 uses `RunnableDevEnvironment` for SSR module
loading. Its `fetchModule` path does **not** call the Vite plugin `resolveId`
hook for unrecognised / virtual specifiers — it only processes specifiers that
Vite already knows about via normal module graph traversal. The `@crss-lookup/`
prefix is an unknown virtual prefix in this path, so it is never resolved.

**Pivot**: All `@crss-lookup/` imports in core `.astro` source files were
reverted to their original relative imports. Instead of using the virtual
prefix as the interception signal, the Vite plugin was extended to intercept
_any relative `.astro` import from anywhere inside the core `src/` directory_
(not just from `corePagesDir` as before).

**Single-line change in `integration.ts`**:
```typescript
// Before (only core pages):
if (!importer.startsWith(corePagesDir)) return;
// After (all of core src/):
if (!importer.startsWith(coreDir)) return;
if (importer.includes('/node_modules/')) return;
```

The `corePagesDir` constant was removed (unused). The `@crss-lookup/` branch
in `resolveId` remains for consumer-authored code convenience.

The `@importfromN` annotation values in core `.astro` files remain as
`@crss-lookup/components/...` — these values are injected into _consumer_
proxy code, which runs in a consumer project context where the plugin processes
the prefix correctly via the normal Vite build path.

**What this means architecturally**: Core source files use standard relative
imports (intercepted by the expanded plugin). `@crss-lookup/` is a
consumer-code convenience prefix only. The cascading override behaviour is
achieved via the relative-import interception mechanism.

### Test Suite

All 611/611 tests pass after the revert and scope-expansion.

### Problems & Constraints

- Synthetic test fixtures in `re-eject.test.ts` and `annotation-parser.test.ts`
  that construct annotation objects directly were not changed — the parser is
  format-agnostic and those tests use their own hardcoded paths. Only assertions
  against real source file annotations needed updating.
- `@crss-lookup/` in core `.astro` source files does NOT work in Astro 5 /
  Vite 6 dev mode due to `RunnableDevEnvironment.fetchModule` bypassing Vite
  plugin `resolveId` hooks for unknown specifiers. Core files must use relative
  imports; the expanded plugin scope provides the override cascade instead.

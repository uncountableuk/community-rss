# Scaffold Shadow Proxies — Impact Assessment

## Executive Summary

The scaffold currently has an **inconsistent proxy strategy** that
undermines the "shadow and override" developer experience:

1. **Component proxies exist but are unused** — `FeedCard.astro`,
   `FeedGrid.astro`, and `TabBar.astro` are scaffolded into
   `src/components/` as proxy wrappers, but every page template imports
   components **directly from `@community-rss/core/components/*`**,
   bypassing the proxies entirely. The proxy wrappers have no effect.
2. **BaseLayout has no proxy at all** — all 8 page templates import
   `BaseLayout` directly from `@community-rss/core/layouts/BaseLayout.astro`.
   A developer who wants to add a site-wide banner, change the nav, or
   inject analytics must edit every page file individually.
3. **Actions are scaffolded as a full copy** — `src/actions/index.ts` is
   copied verbatim into the developer's project. Unlike components, there
   is no "proxy" layer — it's a wholesale code dump of Zod schemas,
   `defineAction()` calls, and handler wiring. This code is boilerplate
   that rarely needs modification, and when the core package adds new
   actions in a future release, the developer's scaffolded copy is
   instantly stale.
4. **Several core components lack proxy wrappers** — `MagicLinkForm`,
   `SignUpForm`, `ArticleModal`, `AuthButton`, `ConsentModal`, and
   `HomepageCTA` are imported directly from core in page templates with
   no scaffolded proxy wrapper available.

**The result**: the framework advertises a "customise by shadowing"
developer experience, but only partially implements it. Developers cannot
reliably customise layouts, most components, or actions without diving
into every page file's import statements.

This assessment proposes a **unified shadow proxy model**: every
developer-facing import (`BaseLayout`, all components, actions) goes
through a local proxy file that re-exports the core version by default.
Developers customise by editing the proxy — no other files need changing.

---

## 1. The Problem

### 1.1 What the Developer Expects

The scaffolded project should let a developer:

1. **Override a component** — copy/edit `src/components/FeedCard.astro` and
   every page that uses `FeedCard` picks up the modified version.
2. **Override the layout** — copy/edit `src/layouts/BaseLayout.astro` and
   every page picks up the modified layout.
3. **Add a new action** — edit `src/actions/index.ts` to add one custom
   action, without losing future core actions.
4. **Do nothing** — if no proxy files are touched, the app uses core
   defaults and receives automatic updates via `npm update`.

### 1.2 What Actually Happens Today

| Asset | Proxy scaffolded? | Pages use proxy? | Shadow override works? |
|-------|:-:|:-:|:-:|
| **BaseLayout** | No | N/A — imports from core | **No** |
| **FeedCard** | Yes | **No** — imports from core | **No** |
| **FeedGrid** | Yes | **No** — imports from core | **No** |
| **TabBar** | Yes | **No** — imports from core | **No** |
| **MagicLinkForm** | No | N/A — imports from core | **No** |
| **SignUpForm** | No | N/A — imports from core | **No** |
| **ArticleModal** | No | N/A — imports from core | **No** |
| **AuthButton** | No | N/A — imports from core | **No** |
| **ConsentModal** | No | N/A — imports from core | **No** |
| **HomepageCTA** | No | N/A — imports from core | **No** |
| **Actions** | Yes (full copy) | N/A — it's the only copy | Partial (stale risk) |

**Zero** shadow overrides actually work today. The proxy component
pattern was architected but never wired end-to-end.

### 1.3 Why the Current Component Proxies Don't Work

The homepage template:

```astro
import TabBar from '@community-rss/core/components/TabBar.astro';
import FeedGrid from '@community-rss/core/components/FeedGrid.astro';
```

The scaffolded proxies in `src/components/TabBar.astro` and
`src/components/FeedGrid.astro` exist but are never imported by any page.
They are dead code in the developer's project.

For the proxy pattern to work, pages must import from the local proxy:

```astro
import TabBar from '../components/TabBar.astro';
import FeedGrid from '../components/FeedGrid.astro';
```

### 1.4 The Actions Problem

The `src/actions/index.ts` file is special because Astro requires it to
exist in the consumer project — the core package **cannot** import
`astro:actions` or `astro:schema` (they are virtual modules only
available in the consumer's Vite pipeline). This is a genuine Astro
architectural constraint documented in the project's copilot-instructions.

However, the current approach copies ~95 lines of boilerplate that:

- Duplicates the Zod schemas already defined in the core action handlers
- Hard-codes the mapping between action names and handlers
- Becomes stale when core adds new action handlers in future releases
- Offers no clear "extend here" pattern for developer-specific actions

This warrants a redesign (see Section 2.3).

---

## 2. Proposed Solution

### 2.1 Unified Shadow Proxy Model

Every non-page, non-config file that a developer might want to customise
gets a **scaffold proxy** that re-exports the core version by default.
Page templates import from local proxies, never directly from core.

**Principle**: the developer's `src/` tree is the "shadow layer".
If a file exists in `src/layouts/`, `src/components/`, or
`src/actions/`, it takes precedence. The scaffolded proxy is the default
passthrough; the developer modifies it for customisation. If they want
a wholesale replacement, they can delete the proxy guts and write their
own from scratch — at their own risk.

#### Layout Proxy

New file: `src/layouts/BaseLayout.astro` (scaffolded)

```astro
---
/**
 * BaseLayout proxy — developer-owned layout wrapper.
 *
 * By default, this re-exports the core BaseLayout unchanged.
 * Customise here to add site-wide markup (banners, analytics,
 * custom nav, footer), or replace the layout entirely.
 *
 * @see https://community-rss.dev/guides/proxy-pattern
 * @since 0.6.0
 */
import CoreBaseLayout from '@community-rss/core/layouts/BaseLayout.astro';

interface Props {
  title: string;
  description?: string;
}

const props = Astro.props;
---

<CoreBaseLayout {...props}>
  <slot name="head" slot="head" />
  <slot name="header" slot="header" />
  <slot />
  <slot name="footer" slot="footer" />
</CoreBaseLayout>
```

#### Component Proxies (Expand Coverage)

In addition to the existing `FeedCard`, `FeedGrid`, and `TabBar` proxies,
scaffold proxies for all components that are referenced by page templates:

| Component | Template uses it? | Proxy scaffold needed? |
|-----------|:-:|:-:|
| FeedCard | Yes (index) | Already exists |
| FeedGrid | Yes (index) | Already exists |
| TabBar | Yes (index) | Already exists |
| HomepageCTA | Yes (index) | **New** |
| MagicLinkForm | Yes (signin) | **New** |
| SignUpForm | Yes (signup) | **New** |
| ArticleModal | No (page-internal) | No |
| AuthButton | No (BaseLayout-internal) | No |
| ConsentModal | No (BaseLayout-internal) | No |

Components only used internally by `BaseLayout` (AuthButton, ConsentModal)
do not need proxies — the developer overrides `BaseLayout.astro` to change
those. `ArticleModal` is not imported in the `article/[id].astro` template
(it's loaded client-side), so it also doesn't need a proxy.

#### Page Templates — Fix Imports

All 8 page templates change their imports to use **relative paths** pointing
at the local proxy files:

```astro
// Before (all pages)
import BaseLayout from '@community-rss/core/layouts/BaseLayout.astro';
import TabBar from '@community-rss/core/components/TabBar.astro';

// After
import BaseLayout from '../layouts/BaseLayout.astro';
import TabBar from '../components/TabBar.astro';
```

This applies to every `import BaseLayout`, `import TabBar`,
`import FeedGrid`, `import HomepageCTA`, `import MagicLinkForm`,
and `import SignUpForm` in the 8 page templates.

### 2.2 Detailed Import Mapping (Before → After)

| Page Template | Current Import | New Import |
|---------------|---------------|------------|
| `pages/index.astro` | `@community-rss/core/layouts/BaseLayout.astro` | `../layouts/BaseLayout.astro` |
| `pages/index.astro` | `@community-rss/core/components/TabBar.astro` | `../components/TabBar.astro` |
| `pages/index.astro` | `@community-rss/core/components/FeedGrid.astro` | `../components/FeedGrid.astro` |
| `pages/index.astro` | `@community-rss/core/components/HomepageCTA.astro` | `../components/HomepageCTA.astro` |
| `pages/auth/signin.astro` | `@community-rss/core/layouts/BaseLayout.astro` | `../../layouts/BaseLayout.astro` |
| `pages/auth/signin.astro` | `@community-rss/core/components/MagicLinkForm.astro` | `../../components/MagicLinkForm.astro` |
| `pages/auth/signup.astro` | `@community-rss/core/layouts/BaseLayout.astro` | `../../layouts/BaseLayout.astro` |
| `pages/auth/signup.astro` | `@community-rss/core/components/SignUpForm.astro` | `../../components/SignUpForm.astro` |
| `pages/auth/verify.astro` | `@community-rss/core/layouts/BaseLayout.astro` | `../../layouts/BaseLayout.astro` |
| `pages/auth/verify-email-change.astro` | `@community-rss/core/layouts/BaseLayout.astro` | `../../layouts/BaseLayout.astro` |
| `pages/article/[id].astro` | `@community-rss/core/layouts/BaseLayout.astro` | `../../layouts/BaseLayout.astro` |
| `pages/profile.astro` | `@community-rss/core/layouts/BaseLayout.astro` | `../layouts/BaseLayout.astro` |
| `pages/terms.astro` | `@community-rss/core/layouts/BaseLayout.astro` | `../layouts/BaseLayout.astro` |

### 2.3 Actions Redesign

The Astro constraint is real: `defineAction` and `z` from `astro:schema`
can only be imported in the consumer's Vite pipeline. The scaffolded
`src/actions/index.ts` therefore **must** exist in the developer's project.
However, the current approach conflates two concerns:

1. **Framework wiring** — registering core handlers with Zod schemas
   (boilerplate that should auto-update with the package)
2. **Developer extensions** — custom actions specific to the developer's app

#### Proposed: Re-export with Extension Point

Create a new barrel export from the core package that provides the action
definitions (handler + schema) as data, and a helper that the developer
calls in their scaffolded file:

**Core exports** (`@community-rss/core/actions`):

The core already exports handler functions. We additionally export the Zod
schemas as plain `zod` objects (not `astro:schema` — `zod` is a standard
dependency). The scaffolded actions file can import these and pass them to
`defineAction()`.

**New scaffolded `src/actions/index.ts`**:

```typescript
/**
 * Astro Actions — Community RSS
 *
 * This file registers core action handlers and is the place to add
 * your own custom actions. Core handlers are wired automatically
 * via `coreActions` — you don't need to touch them.
 *
 * To add a custom action, add it to the `server` export below.
 *
 * @since 0.6.0
 */
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { coreActions } from '@community-rss/core/actions';

export const server = {
  // Core actions — auto-updated with package upgrades
  ...coreActions,

  // === Your custom actions below ===
  // myAction: defineAction({
  //   input: z.object({ ... }),
  //   handler: async (input, context) => { ... },
  // }),
};
```

**New core export** (`@community-rss/core/actions`):

```typescript
import { coreActionDefinitions } from './definitions';

/**
 * Pre-built action registrations using standard zod (not astro:schema).
 *
 * Each entry is a `{ input, handler }` object compatible with
 * Astro's `defineAction()`. The consumer spreads these into their
 * `server` export — no per-handler wiring needed.
 */
export const coreActions = coreActionDefinitions;
```

> **Open question**: Astro's `defineAction()` requires `astro:schema`'s `z`,
> not standard `zod`. We need to verify whether passing standard `zod`
> schemas works at runtime (it likely does since `astro:schema` re-exports
> `zod`). If not, the alternative is generating the actions file via the
> integration's `injectScript` or a Vite virtual module, similar to how
> email templates work. This needs a spike.

#### Fallback: Keep Scaffolded Copy, Improve Comments

If the `coreActions` spread approach doesn't work due to `astro:schema`
constraints, the existing full-copy approach remains but should be improved:

- Add clear section markers: `// === CORE ACTIONS (do not edit) ===` and
  `// === YOUR CUSTOM ACTIONS ===`
- Add a `@generated` JSDoc tag to the core actions section
- Document in the scaffold that running `npx @community-rss/core init --force`
  will overwrite this file, and custom actions should go below the marker

### 2.4 Email Templates — No Change Needed

Email templates (`src/email-templates/`) already follow the correct
pattern: they are _fully developer-owned_ copies scaffolded into the
project. The `virtual:crss-email-templates` Vite plugin scans the
developer's directory first, falling back to package defaults. This is
the shadow model working correctly.

The `EmailLayout.astro` template uses relative imports
(`import EmailLayout from './EmailLayout.astro'`) — no core import
indirection needed because the entire email template set is
developer-owned.

**No changes required for email templates.**

---

## 3. Trade-offs & Risks

### 3.1 Breaking Change for Existing Scaffolds

**Risk**: Developers who have already scaffolded a project have page files
that import from `@community-rss/core/layouts/*` and
`@community-rss/core/components/*`. Running `npx @community-rss/core init`
will skip existing files (no `--force`). Their pages won't use the new
proxy imports.

**Mitigation**: This is a pre-1.0.0 change — breaking changes are permitted
with documentation. The upgrade path is:

1. Run `npx @community-rss/core init --force` to get new page templates
   (this overwrites existing files)
2. Or manually update imports in existing pages

Document a migration guide in the changelog. Consider adding a CLI
`migrate` command in a future release.

**Verdict**: Acceptable for pre-1.0.0. Document in changelog.

### 3.2 Relative Import Fragility

**Risk**: Relative imports (`../../layouts/BaseLayout.astro`) are more
fragile than package imports if a developer moves a page file to a
different directory depth.

**Mitigation**: Page files have well-defined locations dictated by Astro's
file-based routing. Developers rarely move pages to different directory
depths (it would change the URL). The relative paths are stable for the
standard scaffold structure. Additionally, Astro/Vite will surface a clear
compile error if a relative import is wrong.

**Verdict**: Low risk. Standard Astro file-based routing makes page
locations stable.

### 3.3 More Scaffolded Files

**Risk**: Adding proxy wrappers for `HomepageCTA`, `MagicLinkForm`,
`SignUpForm`, and `BaseLayout` means 4 additional scaffolded files.
The total scaffolded file count goes from 22 to 26.

**Mitigation**: These are small passthrough files (5–40 lines). They
reduce cognitive overhead by providing a single place to override each
asset. The alternative (editing imports across multiple pages) is worse.

**Verdict**: Net positive. More files, less confusion.

### 3.4 Actions `coreActions` Spread — Astro Schema Compatibility

**Risk**: Astro's `defineAction()` might require Zod schemas from
`astro:schema` specifically, not from the `zod` npm package. If so,
exporting pre-built action definitions from the core package won't work.

**Mitigation**: Requires a technical spike. If it fails, fall back to
the "improved scaffolded copy" approach (Section 2.3 Fallback).

**Verdict**: Medium risk. Spike needed before committing to this approach.

### 3.5 Proxy Overhead

**Risk**: Every component render goes through one extra Astro component
(the proxy) before reaching the core component.

**Mitigation**: Astro components render at build/SSR time — there is no
runtime overhead in the browser. The SSR overhead of one extra component
in the render tree is negligible (microseconds).

**Verdict**: No meaningful impact.

---

## 4. Scope of Changes

### 4.1 Files Modified

| File | Change |
|------|--------|
| `src/cli/templates/pages/index.astro` | Change 4 imports to relative paths |
| `src/cli/templates/pages/profile.astro` | Change 1 import to relative path |
| `src/cli/templates/pages/terms.astro` | Change 1 import to relative path |
| `src/cli/templates/pages/article/[id].astro` | Change 1 import to relative path |
| `src/cli/templates/pages/auth/signin.astro` | Change 2 imports to relative paths |
| `src/cli/templates/pages/auth/signup.astro` | Change 2 imports to relative paths |
| `src/cli/templates/pages/auth/verify.astro` | Change 1 import to relative path |
| `src/cli/templates/pages/auth/verify-email-change.astro` | Change 1 import to relative path |
| `src/cli/init.mjs` | Add new entries to `FILE_MAP` for layout + new component proxies |
| `src/cli/templates/actions/index.ts` | Redesign to use `coreActions` spread pattern (or improved copy) |
| `src/actions/index.ts` | Add `coreActions` export (if spread approach validated) |

### 4.2 Files Created

| File | Purpose |
|------|---------|
| `src/cli/templates/layouts/BaseLayout.astro` | Layout proxy wrapper (re-exports core) |
| `src/cli/templates/components/HomepageCTA.astro` | Component proxy wrapper |
| `src/cli/templates/components/MagicLinkForm.astro` | Component proxy wrapper |
| `src/cli/templates/components/SignUpForm.astro` | Component proxy wrapper |

### 4.3 Files NOT Modified

- **Core components** (`src/components/*.astro`) — no changes to core components
- **Core layout** (`src/layouts/BaseLayout.astro`) — no changes to core layout
- **API routes** (`src/routes/`) — no backend changes
- **Database** — no schema changes
- **Design tokens** — no CSS changes
- **Email templates** — already correct pattern
- **Integration** (`src/integration.ts`) — no route injection changes
- **Middleware** — no changes

### 4.4 Impact on Package Exports

The `package.json` exports map already includes:

```json
"./layouts/*": "./src/layouts/*",
"./components/*": "./src/components/*",
"./actions": "./src/actions/index.ts"
```

If the `coreActions` spread approach is adopted, the `./actions` export
would additionally export `coreActions`. This is a backward-compatible
additive change — existing named imports (`fetchArticlesHandler`, etc.)
remain available.

### 4.5 Estimated Effort

| Phase | Effort |
|-------|--------|
| Create BaseLayout proxy template | ~30 mins |
| Create 3 new component proxy templates | ~45 mins |
| Update 8 page template imports | ~1 hour |
| Update CLI `FILE_MAP` | ~15 mins |
| Actions spike (astro:schema compat) | ~2 hours |
| Actions redesign or improved copy | ~1 hour |
| Update/write tests (CLI scaffold tests) | ~2 hours |
| Playground reset and validation | ~30 mins |
| Documentation (Starlight + scaffold comments) | ~1 hour |
| **Total** | **~9 hours** |

---

## 5. Validation Plan

### 5.1 Shadow Override Verification

After implementation, verify the following scenarios:

- [ ] Developer edits `src/layouts/BaseLayout.astro` — all 8 pages show
      the modified layout without changing any page imports
- [ ] Developer edits `src/components/FeedCard.astro` — the homepage
      shows the modified card
- [ ] Developer edits `src/components/TabBar.astro` — the homepage
      shows the modified tab bar
- [ ] Developer does NOT edit any proxy file — all pages render
      identically to the current behaviour (core defaults)
- [ ] Developer deletes a proxy file — Astro shows a clear compile error
      (the relative import fails), guiding them to restore it

### 5.2 Actions Verification

- [ ] If `coreActions` spread: new actions added in core appear
      automatically after `npm update` without re-scaffolding
- [ ] Developer can add custom actions alongside core actions
- [ ] Existing action calls from client-side code continue to work

### 5.3 CLI Scaffold

- [ ] Fresh scaffold (`npx @community-rss/core init`) creates all proxy
      files in correct locations
- [ ] Running scaffold on existing project (no `--force`) skips existing
      proxy files — developer customisations are preserved
- [ ] Running scaffold with `--force` overwrites proxy files back to
      default passthrough

### 5.4 E2E

- [ ] All existing E2E tests pass against a freshly scaffolded playground
- [ ] Playground reset (`npm run reset:playground`) produces a working app

---

## 6. Impact on Developer Experience

### 6.1 What Developers Gain

- **Layout override**: edit one file (`src/layouts/BaseLayout.astro`) to
  change the header, footer, or inject analytics on every page
- **Component override**: edit any proxy in `src/components/` and all
  pages using that component pick up the change
- **Consistent mental model**: "my `src/` tree shadows core — if I put a
  file in the right place, it overrides the default"
- **Future-proof actions**: if `coreActions` spread works, new core
  actions appear automatically after package updates
- **Safe customisation path**: proxies are thin wrappers — developers can
  inspect them to understand what they're overriding. For deeper changes,
  they can replace the core import entirely (at their own risk)

### 6.2 What Developers Must Change (Upgrading from ≤0.5.x)

- Re-scaffold with `npx @community-rss/core init --force` to get new
  page templates with relative imports and new proxy files
- Or manually add proxy files and update page imports (migration guide
  provided in changelog)

### 6.3 Risk Model for Deep Customisation

The proxy pattern gives developers a safe customisation surface. Beyond
that, they can:

1. **Safe**: Override token values in `theme.css`
2. **Safe**: Override class styles in `theme.css` (after CSS overridability fix)
3. **Safe**: Edit proxy wrapper (add markup, swap out core component, change props)
4. **Safe**: Edit page template (change layout, structure, content)
5. **At own risk**: Copy core component source into proxy and modify it
   (loses automatic updates from package upgrades)
6. **At own risk**: Replace core layout entirely (loses future layout features)

Levels 1–4 are supported and documented. Levels 5–6 are possible but
explicitly labelled as detaching from automatic updates.

---

## 7. Relationship to Other 0.6.0 Work

### 7.1 CSS Overridability (Sibling Feature)

The CSS overridability feature (sibling assessment in this folder) migrates
component `<style>` blocks to `<style is:global>` + `@layer`. This is
**complementary**: CSS overridability gives developers token-level and
class-level control via `theme.css`, while scaffold shadow proxies give
developers structural control via Astro components. Together, they
complete the customisation story:

- **CSS layer**: `theme.css` tokens and class overrides (no file copy needed)
- **Component layer**: proxy wrappers for structural markup changes
- **Layout layer**: layout proxy for site-wide structural changes
- **Page layer**: page files for route-specific changes (already developer-owned)

### 7.2 Email Templates

Email templates already implement the shadow model correctly and serve as
the reference pattern for this work. No changes needed.

---

## 8. Decision Required

**Recommendation**: Implement this as part of the 0.6.0 release alongside
the CSS overridability work. Together, they deliver a complete and
consistent customisation story at every level (tokens, classes, components,
layouts, pages).

**Priority**: The page template import fix (Section 2.2) and BaseLayout
proxy (Section 2.1) should be done first — they have the highest
developer-facing impact with the least risk.

**Actions spike**: Conduct the `astro:schema` compatibility spike early
to determine which actions approach to take. If the spread approach works,
it significantly improves the developer upgrade experience. If not, the
improved-copy fallback is still an improvement over the current state.

**Open questions for review**:

1. Should `ArticleModal` also get a proxy wrapper? Currently it's loaded
   via client-side script injection in the `article/[id]` page, not
   via an Astro import. A proxy would only be useful if we refactor to a
   direct Astro import.
2. Should `AuthButton` and `ConsentModal` get proxies? They're only used
   inside `BaseLayout`, so the layout proxy covers them. But a developer
   who wants to change _only_ the auth button appearance (not the whole
   layout) would benefit from a separate proxy.
3. For the actions `coreActions` spread approach — is the team comfortable
   with the core package depending on `zod` directly (not just `astro:schema`)?
   The core already lists no `zod` dependency; this would add one.

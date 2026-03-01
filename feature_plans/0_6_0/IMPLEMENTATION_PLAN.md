# Release 0.6.0 — Developer Experience & Progressive Customization: Implementation Plan

## Overview

**Goal:** Complete the framework's customization architecture by fixing
CSS overridability, implementing progressive customization (injected
pages with shadow/eject), wiring the proxy component pattern end-to-end,
redesigning the actions scaffold, and shipping an `eject` CLI command.
At release completion, developers have a frictionless four-level
customization hierarchy from CSS tokens through to bespoke API routes.

**Key Milestone:** A freshly-initialized project consists of
`astro.config.mjs`, `.env`, `theme.css`, and optional shadow files. The
framework injects all pages by default. Developers override only what
they need. CSS class-level overrides work without `!important`. All
Tier 3 component tokens are functional. Existing E2E and unit tests pass.
≥80% unit test coverage maintained.

**Consolidates:** Three impact assessments in `feature_plans/0_6_0/`:

- [`css-overridability/IMPACT_ASSESSMENT.md`](css-overridability/IMPACT_ASSESSMENT.md)
  — Fixes the specificity gap preventing consumer CSS class overrides
- [`progressive-customisation/Progressive Customization Strategy.md`](progressive-customisation/Progressive%20Customization%20Strategy.md)
  — Moves from "scaffold everything" to "inject with shadow"
- [`scaffold-shadow-proxies/IMPACT_ASSESSMENT.md`](scaffold-shadow-proxies/IMPACT_ASSESSMENT.md)
  — Completes the proxy component pattern end-to-end

---

## The Progressive Customization Hierarchy

0.6.0 formalizes customization into four levels of increasing complexity
and upgrade risk:

| Level | Mechanism | What Changes | Upgrade Risk |
|-------|-----------|-------------|:---:|
| **1 — CSS Tokens & Classes** | `theme.css` custom properties + class overrides | Colours, fonts, spacing, component rulesets | None |
| **2 — Page Layouts** | Shadow a page via `npx crss eject pages/profile` | Route-specific layout and content | Low |
| **3 — Components** | Shadow a component via `npx crss eject components/FeedCard` | Component HTML structure / behaviour | Medium |
| **4 — API & Actions** | Custom routes, action overrides, middleware | Data flows and business logic | High |

**Principle:** A developer who never ejects anything gets a fully
functional, auto-updating application. Each eject is opt-in and local —
only the ejected file detaches from automatic updates.

---

## Codebase Review

### Current State (Post-0.5.0)

- **CSS Architecture:** Three-tier tokens defined, cascade layers declared,
  but 8/9 components use Astro scoped `<style>` blocks that defeat the
  layer system. Tier 3 component tokens are ~85% unused.
- **Page Model:** 8 pages scaffolded into developer's `src/pages/` with
  hard-coded `@community-rss/core` imports. No conditional injection.
- **Proxy Pattern:** 3 component proxies exist (`FeedCard`, `FeedGrid`,
  `TabBar`) but zero pages import them — they are dead code.
- **Layout:** No `BaseLayout` proxy. All 8 pages import directly from core.
- **Actions:** Full 95-line copy scaffolded with duplicated Zod schemas.
  Becomes stale when core adds new actions.
- **CLI:** `init` command scaffolds 22 files. No `eject`/`shadow` command.

### Files to Modify

| File | Change Summary |
|------|---------------|
| `src/components/AuthButton.astro` | `<style>` → `<style is:global>` + `@layer` + wire `--crss-comp-auth-*` |
| `src/components/FeedCard.astro` | Same + remove `:global()` duplicate block + wire `--crss-comp-card-*` |
| `src/components/FeedGrid.astro` | Same + wire `--crss-comp-grid-*` |
| `src/components/TabBar.astro` | Same + wire `--crss-comp-tab-*` + remove hardcoded values |
| `src/components/ArticleModal.astro` | Same + wire `--crss-comp-modal-*` + remove hardcoded transitions |
| `src/components/MagicLinkForm.astro` | Same + wire remaining `--crss-comp-form-*` |
| `src/components/SignUpForm.astro` | Same + wire remaining `--crss-comp-form-*` |
| `src/components/ConsentModal.astro` | Same + wire `--crss-comp-consent-*` + remove hardcoded `rgba()` |
| `src/components/HomepageCTA.astro` | Same + wire new `--crss-comp-cta-*` |
| `src/layouts/BaseLayout.astro` | Wire new `--crss-comp-header-*` tokens (already uses correct pattern) |
| `src/styles/tokens/components.css` | Add missing tokens (CTA, header, nav, form max-width, transition) |
| `src/integration.ts` | Add conditional page injection with user file detection |
| `src/cli/init.mjs` | Remove page/component entries from `FILE_MAP`; add signpost README entries; add layout proxy |
| `src/cli/templates/actions/index.ts` | Redesign to `coreActions` spread (or improved copy fallback) |
| `src/actions/index.ts` | Export `coreActions` map (if spike succeeds) |
| `src/cli/templates/theme.css` | Add Level 4 class override examples |

### Files to Create

| File | Purpose |
|------|---------|
| `src/cli/eject.mjs` | New `eject` CLI command — copies a framework file to developer's project with import rewriting |
| `src/cli/templates/layouts/BaseLayout.astro` | Layout proxy wrapper (re-exports core, provides slot passthrough) |
| `src/cli/templates/components/HomepageCTA.astro` | Component proxy wrapper (new) |
| `src/cli/templates/components/MagicLinkForm.astro` | Component proxy wrapper (new) |
| `src/cli/templates/components/SignUpForm.astro` | Component proxy wrapper (new) |
| `src/cli/templates/pages/README.md` | Signpost README for pages directory — explains shadow/eject model |
| `src/cli/templates/components/README.md` | Signpost README for components directory |
| `src/cli/templates/layouts/README.md` | Signpost README for layouts directory |

### Files Removed from Scaffold (Moved to Injectable)

These files will **no longer be scaffolded** by `init`. Instead, the
framework injects them as routes. Developers use `npx crss eject` to
take ownership when needed.

| Previously Scaffolded File | Now Injected By |
|---------------------------|-----------------|
| `src/pages/index.astro` | `injectRoute({ pattern: '/' })` |
| `src/pages/article/[id].astro` | `injectRoute({ pattern: '/article/[id]' })` |
| `src/pages/auth/signin.astro` | `injectRoute({ pattern: '/auth/signin' })` |
| `src/pages/auth/signup.astro` | `injectRoute({ pattern: '/auth/signup' })` |
| `src/pages/auth/verify.astro` | `injectRoute({ pattern: '/auth/verify' })` |
| `src/pages/auth/verify-email-change.astro` | `injectRoute({ pattern: '/auth/verify-email-change' })` |
| `src/pages/profile.astro` | `injectRoute({ pattern: '/profile' })` |
| `src/pages/terms.astro` | `injectRoute({ pattern: '/terms' })` |

### Files NOT Modified

- **Token CSS** (`reference.css`, `system.css`) — no structural changes
- **`layers.css`** — layer order is unchanged
- **API route handlers** (`src/routes/api/`) — no backend changes
- **Database** — no schema changes, no migrations
- **Email templates** — already follow the correct shadow model
- **Middleware** — no changes

---

## Architecture Decisions

### AD-1: Injected Pages with Conditional Override

**Decision:** Pages are injected from the core package by default. The
integration's `astro:config:setup` hook checks `fs.existsSync()` for each
page route. If the developer has a local file at the expected path, the
injection is skipped — Astro's file-based router uses the local file.

**Rationale:** This inverts the current model ("scaffold everything") to
"inject everything, eject what you need." Benefits:

- A fresh `init` produces a minimal project: `astro.config.mjs`, `.env`,
  `theme.css`, and signpost READMEs. No page boilerplate.
- Bug fixes and feature additions to default pages ship automatically
  via `npm update`.
- Developers take ownership only when they actively need to diverge.

**Trade-off:** Pre-0.6.0 projects have scaffolded pages that will shadow
the injected routes automatically (Astro prioritizes physical files). No
breakage — but those developers won't receive future page improvements
unless they delete their local copies or re-eject.

### AD-2: Page Templates Move into Core `src/pages/`

**Decision:** The 8 page templates move from
`src/cli/templates/pages/*.astro` to `src/pages/*.astro` within the core
package. They are now proper Astro page components that the integration
injects via `injectRoute()`.

**Rationale:** As injected routes, Astro needs these files to be resolvable
from the package — they must exist in the package source, not just as CLI
template strings. The `package.json` `exports` map gains a `./pages/*`
entry.

**Impact:** The CLI template copies are removed. The `eject` command copies
from the package source (or from `node_modules`).

### AD-3: Page Templates Use Local Proxy Imports

**Decision:** The injected page templates import layouts and components
from core directly (`../layouts/BaseLayout.astro`, `./FeedCard.astro`,
etc.) using package-internal relative imports. When a developer ejects a
page, the `eject` command rewrites these imports to point to the
developer's local proxy files (`../layouts/BaseLayout.astro` relative to
their `src/pages/`).

**Rationale:** Injected pages live inside the package — they can use
package-internal relative imports. Ejected pages live in the developer's
project — they must import from local proxies (which re-export core) so
that editing a proxy cascades to all ejected pages.

### AD-4: Component Proxies Are Optional

**Decision:** Component and layout proxies are NOT scaffolded by default.
The `init` command creates signpost README files in `src/components/`,
`src/layouts/`, and `src/pages/` directories. Developers use
`npx crss eject components/FeedCard` to generate a proxy on demand.

**Rationale:** Consistent with progressive customization: the developer's
project starts minimal. Proxies are only useful when customization is
needed. The signpost READMEs explain how to eject.

**Exception:** `src/actions/index.ts` must always be scaffolded because
Astro requires it to exist in the consumer's project (the `astro:actions`
virtual module constraint).

### AD-5: `eject` CLI Command Design

**Decision:** New CLI command: `npx @community-rss/core eject <target>`

Supported targets:
- `pages/<name>` — copies a page template, rewrites imports to local proxies
- `components/<name>` — creates a proxy wrapper that re-exports core
- `layouts/BaseLayout` — creates a layout proxy wrapper
- `actions` — resets `src/actions/index.ts` to latest scaffold template

The command:
1. Resolves the source file from the installed package
2. Copies it to the developer's `src/` directory
3. Rewrites internal relative imports to package public exports or local
   proxy paths (regex-based transform, not AST)
4. Prints a summary of what was created and what the developer can customize

**Rationale:** Developers need a safe, guided mechanism to take ownership
of framework files. Copy-paste from `node_modules` is error-prone
(imports break). The CLI handles import rewriting automatically.

### AD-6: `coreActions` Spread (Pending Spike)

**Decision:** Spike the `coreActions` spread pattern early (Phase 1). If
Astro accepts standard `zod` schemas in `defineAction()`, export a
pre-built action map from `@community-rss/core/actions` and simplify the
scaffolded `src/actions/index.ts` to a single spread + extension point.

**Zod singleton constraint:** Zod relies heavily on `instanceof` checks
internally. If the framework and the consumer resolve different copies of
Zod, schema validation will silently fail at the package boundary.
`zod` must be declared as a **strict `peerDependency`** in
`packages/core/package.json` (e.g., `"zod": "^3.x"`) to force a single
resolution in the consumer's `node_modules` tree. The Phase 0 spike must
verify this works before committing to the spread approach.

**Fallback:** If the spike fails (Astro requires `astro:schema`'s `z`
specifically, or the Zod singleton constraint cannot be satisfied), keep
the full-copy approach but improve it with:
- Clear `// === CORE ACTIONS (do not edit) ===` section markers
- A `@generated` JSDoc tag on the core section
- A clean `// === YOUR CUSTOM ACTIONS ===` extension point
- Documented `npx crss eject actions` to refresh the core section

### AD-7: Global Layered Styles for All Components

**Decision:** All component `<style>` blocks migrate from scoped to
`<style is:global>` wrapped in `@layer crss-components { ... }`.

**Rationale:** This simultaneously fixes three gaps:
1. Removes the specificity barrier (`[data-astro-cid-*]` → no attribute)
2. Activates cascade layers (un-layered consumer CSS always wins)
3. Wires Tier 3 tokens (components consume `--crss-comp-*` tokens)

**Risk Mitigation:** The `crss-` BEM naming convention already provides
de-facto scoping. No two components share class names.

---

## Implementation Phases

### Phase 0: Technical Spikes
- [ ] **Actions spike**: Test whether `defineAction()` accepts standard
      `zod` schemas exported from the core package. Create a minimal test
      in the playground: export `{ input: z.object({...}), handler }` from
      core, spread into consumer's `server` export. Verify runtime behavior.
- [ ] **Zod singleton spike**: Add `zod` as a strict `peerDependency` in
      `packages/core/package.json`. Verify that only one copy of Zod is
      resolved in the playground's `node_modules` tree (`npm ls zod`).
      Test that `instanceof` checks in schema validation pass across the
      package boundary (core → consumer). If Zod deduplication fails
      under npm workspaces, document the failure conditions.
- [ ] Document spike results in Implementation Notes
- [ ] **Decision gate**: If both spikes succeed → Phase 7a (coreActions
      spread). If either fails → Phase 7b (improved copy).

### Phase 1: CSS Overridability — Global Layered Styles
- [ ] Migrate `AuthButton.astro` `<style>` → `<style is:global>` +
      `@layer crss-components { ... }`
- [ ] Migrate `FeedCard.astro` — same + remove `:global()` duplicate block
- [ ] Migrate `FeedGrid.astro`
- [ ] Migrate `TabBar.astro` + replace hardcoded `0.4` opacity and
      `0.15s ease` transition
- [ ] Migrate `ArticleModal.astro` + replace 5× hardcoded `0.15s ease`
      transitions
- [ ] Migrate `MagicLinkForm.astro`
- [ ] Migrate `SignUpForm.astro`
- [ ] Migrate `ConsentModal.astro` + replace hardcoded `rgba(0,0,0,0.5)`
- [ ] Migrate `HomepageCTA.astro`
- [ ] **Validation**: Pages render identically with no visual changes

### Phase 2: Wire Tier 3 Component Tokens
- [ ] Replace all hardcoded / flat-token values in component styles with
      corresponding `--crss-comp-*` tokens
- [ ] Wire FeedCard styles to `--crss-comp-card-*` tokens
- [ ] Wire FeedGrid styles to `--crss-comp-grid-*` tokens
- [ ] Wire TabBar styles to `--crss-comp-tab-*` tokens
- [ ] Wire ArticleModal styles to `--crss-comp-modal-*` tokens
- [ ] Wire MagicLinkForm + SignUpForm styles to `--crss-comp-form-*` tokens
- [ ] Wire ConsentModal styles to `--crss-comp-consent-*` tokens
- [ ] Wire AuthButton styles to `--crss-comp-auth-*` tokens
- [ ] Wire HomepageCTA styles to new `--crss-comp-cta-*` tokens
- [ ] Wire BaseLayout header/nav to new `--crss-comp-header-*` tokens
- [ ] Add missing tokens to `components.css`:

| Token | Default | Component |
|-------|---------|-----------|
| `--crss-comp-cta-bg` | `var(--crss-sys-color-surface-1)` | HomepageCTA |
| `--crss-comp-cta-border` | `var(--crss-sys-color-surface-3)` | HomepageCTA |
| `--crss-comp-cta-radius` | `var(--crss-sys-radius-lg)` | HomepageCTA |
| `--crss-comp-cta-padding` | `var(--crss-sys-space-md) var(--crss-sys-space-lg)` | HomepageCTA |
| `--crss-comp-cta-text-color` | `var(--crss-sys-color-text-secondary)` | HomepageCTA |
| `--crss-comp-header-bg` | `var(--crss-sys-color-surface-0)` | BaseLayout |
| `--crss-comp-header-border` | `var(--crss-sys-color-border)` | BaseLayout |
| `--crss-comp-nav-max-width` | `1200px` | BaseLayout |
| `--crss-comp-form-max-width` | `400px` | MagicLinkForm, SignUpForm |

- [ ] **Token audit**: Verify every `--crss-comp-*` in `components.css` is
      consumed by at least one component. Remove any dead tokens.
- [ ] **Validation**: Token overrides in `theme.css` `:root {}` change
      components as expected. Class overrides work without `!important`.

### Phase 3: Remove Hardcoded Values
- [ ] ConsentModal: `rgba(0, 0, 0, 0.5)` → `var(--crss-comp-consent-overlay-bg)`
- [ ] TabBar: `0.4` opacity → `var(--crss-comp-tab-disabled-opacity)`
- [ ] TabBar: `0.15s ease` → `var(--crss-sys-transition-fast)`
- [ ] ArticleModal: `0.15s ease` (×5) → `var(--crss-sys-transition-fast)`
- [ ] MagicLinkForm: `400px` max-width → `var(--crss-comp-form-max-width)`
- [ ] SignUpForm: `400px` max-width → `var(--crss-comp-form-max-width)`
- [ ] BaseLayout: `1200px` max-width → `var(--crss-comp-nav-max-width)`
- [ ] **Validation**: No hardcoded colour, size, or transition values remain
      in any component `<style>` block

### Phase 4: Conditional Page Injection
- [ ] Move page templates from `src/cli/templates/pages/` to `src/pages/`
      in the core package (they become injectable route entrypoints)
- [ ] Update page template imports to use package-internal relative imports
      (these pages now live inside the core package)
- [ ] Add `"./pages/*": "./src/pages/*"` to `package.json` `exports` map
- [ ] Implement conditional `injectRoute()` in `integration.ts`:
      ```typescript
      const pageRoutes = [
        { pattern: '/', entrypoint: 'pages/index.astro', localPath: 'src/pages/index.astro' },
        { pattern: '/profile', entrypoint: 'pages/profile.astro', localPath: 'src/pages/profile.astro' },
        { pattern: '/terms', entrypoint: 'pages/terms.astro', localPath: 'src/pages/terms.astro' },
        { pattern: '/article/[id]', entrypoint: 'pages/article/[id].astro', localPath: 'src/pages/article/[id].astro' },
        { pattern: '/auth/signin', entrypoint: 'pages/auth/signin.astro', localPath: 'src/pages/auth/signin.astro' },
        { pattern: '/auth/signup', entrypoint: 'pages/auth/signup.astro', localPath: 'src/pages/auth/signup.astro' },
        { pattern: '/auth/verify', entrypoint: 'pages/auth/verify.astro', localPath: 'src/pages/auth/verify.astro' },
        { pattern: '/auth/verify-email-change', entrypoint: 'pages/auth/verify-email-change.astro', localPath: 'src/pages/auth/verify-email-change.astro' },
      ];

      for (const route of pageRoutes) {
        const userFile = new URL(`./${route.localPath}`, astroConfig.root);
        if (!fs.existsSync(userFile)) {
          injectRoute({
            pattern: route.pattern,
            entrypoint: new URL(`./${route.entrypoint}`, import.meta.url).pathname,
          });
        } else {
          logger.info(`  Skipping injected page ${route.pattern} — developer override detected`);
        }
      }
      ```
- [ ] Remove page template entries from `FILE_MAP` in `init.mjs`
- [ ] **Path normalization**: Ensure the `fs.existsSync()` check
      exclusively uses `new URL()` for all file path resolution (as shown
      in the code sample above). Never construct paths with string
      concatenation or `path.join()` — Astro and Vite are sensitive to
      `\` vs `/` on Windows. `new URL('./' + route.localPath, config.root)`
      guarantees forward-slash URL semantics on all platforms.
- [ ] **Validation**: Playground works with zero pages in `src/pages/`.
      All routes serve from injected pages. Adding a local page file
      overrides the injected version.

### Phase 5: CLI Scaffold Redesign (`init`)
- [ ] Remove page template entries from `FILE_MAP` (pages are now injected)
- [ ] Remove component proxy entries from `FILE_MAP` (proxies are on-demand
      via `eject`)
- [ ] Keep in `FILE_MAP`: actions, theme.css, config files, AI guidance,
      email templates
- [ ] Create signpost README templates:
      - `src/cli/templates/pages/README.md` — explains page injection model,
        lists available pages, shows eject command
      - `src/cli/templates/components/README.md` — explains component proxy
        pattern, lists available components, shows eject command
      - `src/cli/templates/layouts/README.md` — explains layout proxy,
        shows eject command
- [ ] Add README entries to `FILE_MAP`:
      - `{ template: 'pages/README.md', target: 'src/pages/README.md' }`
      - `{ template: 'components/README.md', target: 'src/components/README.md' }`
      - `{ template: 'layouts/README.md', target: 'src/layouts/README.md' }`
- [ ] Create empty directory scaffold entries for `src/pages/`,
      `src/components/`, `src/layouts/` (ensures directories exist)
- [ ] **Validation**: Fresh `npx @community-rss/core init` produces a
      minimal project with signpost READMEs and no page files

### Phase 6: `eject` CLI Command
- [ ] Create `src/cli/eject.mjs` with the following capabilities:
      - Parse target argument: `pages/<name>`, `components/<name>`,
        `layouts/<name>`, `actions`
      - Resolve source file from installed package
        (`node_modules/@community-rss/core/src/`)
      - Copy to developer's `src/` directory at the correct path
      - **Import rewriting**: For pages, rewrite package-internal relative
        imports to point to local proxy paths. For components, generate
        a proxy wrapper that re-exports the core component. For layouts,
        generate a proxy wrapper with slot passthrough.
      - Skip if target file already exists (print warning, suggest `--force`)
      - `--force` flag to overwrite existing files
      - **Conversational CLI output**: When ejecting a page triggers
        auto-ejection of layout and component proxies, the output must
        clearly explain *why* each additional file was created. A single
        `eject pages/profile` may produce 4–6 files; without explanation
        this is disorienting. Format example:
        ```
        ✔ Created src/pages/profile.astro
          ↳ Auto-created src/layouts/BaseLayout.astro (layout proxy — profile.astro imports this)
          ↳ Auto-created src/components/AuthButton.astro (component proxy — profile.astro imports this)
        
        You can now customize these files. Proxies re-export the core
        component — edit the wrapper to change markup or styles.
        ```
      - Print final summary: what was created, what imports were rewritten,
        what the developer can customize
- [ ] Register CLI entry point in `package.json` `bin` field:
      `"crss": "./src/cli/bin.mjs"` (or update existing `init` entry)
- [ ] Add `eject` subcommand handling — route `npx crss eject <target>`
      or `npx @community-rss/core eject <target>`
- [ ] Implement import rewriting rules:
      - **Pages**: Replace `../layouts/BaseLayout.astro` (package-internal)
        with `../layouts/BaseLayout.astro` (developer-local) — also auto-eject
        the layout proxy if it doesn't exist. Replace
        `../components/FeedCard.astro` with `../components/FeedCard.astro` —
        also auto-eject component proxies for any components the page imports.
      - **Components**: Generate proxy template:
        ```astro
        ---
        import CoreComponent from '@community-rss/core/components/<Name>.astro';
        const props = Astro.props;
        ---
        <CoreComponent {...props}><slot /></CoreComponent>
        ```
      - **Layouts**: Generate proxy template with named slot passthrough
      - **Actions**: Copy latest scaffold template (overwrite core section)
- [ ] **Validation**: `npx crss eject pages/profile` creates a working
      local page that renders identically to the injected version

### Phase 7a: Actions Redesign — `coreActions` Spread (If Spike Succeeds)
- [ ] Add `zod` as a **`peerDependency`** in `packages/core/package.json`
      (strict range, e.g., `"zod": "^3.23.0"`). This forces a single
      Zod instance in the consumer's tree, preventing `instanceof`
      failures at the package boundary. Also add `zod` to `devDependencies`
      so the core package's own tests can resolve it.
- [ ] Create action definition map in `src/actions/definitions.ts` — each
      entry is `{ input: z.object({...}), handler }` using standard `zod`
- [ ] Export `coreActions` from `@community-rss/core/actions`
- [ ] Create new scaffold template `src/cli/templates/actions/index.ts`:
      ```typescript
      import { coreActions } from '@community-rss/core/actions';
      export const server = {
        ...coreActions,
        // === Your custom actions below ===
      };
      ```
- [ ] Verify all existing Action calls work with the new wiring
- [ ] **Validation**: `actions.fetchArticles()` resolves correctly in
      the playground. New actions added to core appear after `npm update`.

### Phase 7b: Actions Redesign — Improved Copy (If Spike Fails)
- [ ] Update scaffold template with clear section markers:
      `// === CORE ACTIONS (auto-generated — do not edit below) ===`
      `// === YOUR CUSTOM ACTIONS (add below) ===`
- [ ] Add `@generated` JSDoc tag to the core actions section
- [ ] Document in scaffold comments: `npx crss eject actions` refreshes
      the core section while preserving custom actions below the marker
- [ ] Implement `eject actions` to only overwrite the core section (parse
      markers, preserve content below the custom marker)
- [ ] **Validation**: Existing actions work. Developer-added custom
      actions survive an `eject actions` refresh.

### Phase 8: Update `theme.css` Scaffold Template
- [ ] Add Level 4 (class-level) override examples to `theme.css` template:
      ```css
      /* ─── Class-Level Overrides (Level 4) ─────────────── */
      /* Override entire rulesets for fine-grained control.     */
      /* No !important needed — consumer styles always win.     */
      /*                                                        */
      /* .crss-feed-card { border-radius: 0; box-shadow: none; } */
      /* .crss-header { position: sticky; top: 0; z-index: 10; } */
      /* .crss-btn--primary { text-transform: uppercase; }       */
      ```
- [ ] Improve existing token override examples with more practical
      use-cases (dark mode snippet, brand colour change)
- [ ] **Validation**: Scaffold template comments are accurate post-migration

### Phase 9: Testing
- [ ] **CSS specificity test**: Verify that consumer un-layered CSS
      (`.crss-feed-card { background: X }`) beats framework layered CSS
      (`@layer crss-components { .crss-feed-card { background: Y } }`).
      Test for all 9 components.
- [ ] **Token wiring test**: Verify every `--crss-comp-*` token defined in
      `components.css` is consumed by at least one component. Automated
      CSS parse test — no dead tokens.
- [ ] **Conditional injection test** (unit): Mock `fs.existsSync` to
      test that `integration.ts` skips injection when developer file exists,
      and injects when it doesn't
- [ ] **CLI `init` test**: Verify fresh scaffold produces:
      - `src/actions/index.ts` ✓
      - `src/styles/theme.css` ✓
      - `src/pages/README.md` ✓
      - `src/components/README.md` ✓
      - `src/layouts/README.md` ✓
      - No `.astro` page files in `src/pages/`
- [ ] **CLI `eject` tests**:
      - `eject pages/profile` creates `src/pages/profile.astro` with
        rewritten imports
      - `eject components/FeedCard` creates a proxy wrapper in
        `src/components/FeedCard.astro`
      - `eject layouts/BaseLayout` creates a layout proxy with slot
        passthrough
      - `eject actions` refreshes the actions file
      - Running `eject` on existing file without `--force` skips and warns
      - Running `eject` with `--force` overwrites
- [ ] **Actions test** (if coreActions spread): Verify `coreActions` export
      contains all expected action definitions with valid schemas
- [ ] **Visual regression**: All 8 pages render identically pre/post
      migration (manual + E2E)
- [ ] **E2E regression**: All existing Playwright tests pass without
      modification against a playground with zero ejected files
- [ ] **E2E: ejected page**: Eject `pages/profile`, verify profile page
      still works in E2E
- [ ] **Dynamic content**: FeedCard infinite scroll works — dynamically
      injected cards are styled correctly (previously required `:global()`
      duplication)
- [ ] Verify ≥80% coverage maintained on statements, branches, functions,
      lines

### Phase 10: Documentation
- [ ] **Starlight: Progressive Customization guide** — new page at
      `docs/src/content/docs/guides/customisation.md`:
      - The 4-level hierarchy with examples
      - When to use each level
      - How to eject pages/components/layouts
      - What happens to automatic updates after ejecting
- [ ] **Starlight: CSS Overrides guide** — update
      `docs/src/content/docs/guides/styling.md`:
      - Level 4 (class-level) overrides now work
      - Updated examples showing token + class overrides together
      - Remove any `!important` workaround guidance
- [ ] **Starlight: CLI reference** — update
      `docs/src/content/docs/api-reference/cli.md`:
      - Document `eject` command with all targets
      - Update `init` command docs for new minimal scaffold
- [ ] **Starlight: Component tokens reference** — update
      `docs/src/content/docs/api-reference/css-tokens.md`:
      - Complete Tier 3 token inventory with component mappings
      - Show which tokens affect which components
- [ ] **JSDoc**: Add/update `@since 0.6.0` on all new exports, CLI
      commands, component token wiring changes
- [ ] **Signpost README content**: Ensure all three signpost READMEs
      (`pages/`, `components/`, `layouts/`) have accurate, actionable
      content with example `eject` commands and links to docs

### Phase 11: `.github` Instruction & AI Guidance Updates
- [ ] Update `.github/copilot-instructions.md`:
      - Add Progressive Customization section explaining the 4-level
        hierarchy
      - Update "Route split" to document injected pages + conditional
        override
      - Add `eject` CLI to Protected Areas
      - Update Architecture notes with AD-1 through AD-7 summaries
      - Update Anti-Patterns: add ❌ "Scaffold page files from init"
        and ❌ "Import components directly from core in page templates
        (use local proxies)"
- [ ] Update `.github/instructions/implementation.instructions.md`:
      - Add section on page injection vs scaffolding
      - Update Component Standards to reference global layered styles
      - Add `eject` command reference
- [ ] Update `.github/instructions/feature-plan.instructions.md`:
      - Add "Conditional Injection" to Phase 4/5 templates
      - Add `eject` target to CLI scaffold phase template
- [ ] Update scaffolded AI guidance files:
      - `src/cli/templates/.github/copilot-instructions.md` — explain
        progressive customization for framework consumers
      - `src/cli/templates/.cursor/rules/community-rss.mdc` — same for
        Cursor IDE users
- [ ] Update `.github/skills/feature-implementation/SKILL.md` with the
      new patterns

### Phase 12: Playground Reset & Smoke Test
- [ ] Update `scripts/reset-playground.sh` to work with the new minimal
      scaffold (no page files, pages served via injection)
- [ ] Run full playground reset: `npm run reset:playground`
- [ ] Verify all pages render correctly (served via injection)
- [ ] Verify `npx crss eject pages/profile` works and the ejected page
      renders
- [ ] Verify theme.css token and class overrides work
- [ ] Run full test suite: `npm run test:run` — all pass
- [ ] Run E2E suite: `npm run test:e2e` — all pass
- [ ] Run coverage check: `npm run test:coverage` — ≥80% maintained

### Phase 13: Upgradeable Component Ejection

Implements the Proxy Ejection Pattern described in
[`upgradeable-ejection/IMPACT_ASSESSMENT.md`](upgradeable-ejection/IMPACT_ASSESSMENT.md).
Every ejectable artefact (component, layout, page) becomes a wrapper
around the core version using Astro named slots with fallback content
as the override mechanism.

#### Phase 13a: Core Component & Layout Slot Architecture
- [x] `BaseLayout.astro`: Remove `hasHeaderSlot` / `hasFooterSlot` checks;
      wrap default header in `<slot name="header">...</slot>` with
      existing nav+AuthButton as fallback; wrap footer in
      `<slot name="footer">...</slot>`; add empty `<slot name="below-header" />`
      between header and main content; add
      `<slot name="before-unnamed-slot" />` and
      `<slot name="after-unnamed-slot" />` around `<slot />`
- [x] `ArticleModal.astro`: Wrap header section in
      `<slot name="header">`, body (title + content) in
      `<slot name="body">`, footer in `<slot name="footer">`;
      add generic wrapper slots
- [x] `SignUpForm.astro`: Wrap `<form>` in `<slot name="form">`,
      confirmation panel in `<slot name="confirmation">`; add generic
      wrapper slots
- [x] Add generic wrapper slots (`before-unnamed-slot`,
      `after-unnamed-slot`) to all remaining components:
      AuthButton, FeedCard, FeedGrid, TabBar, MagicLinkForm,
      ConsentModal, HomepageCTA
- [x] **Validation**: All pages render identically with no visual changes.
      All existing tests pass.

#### Phase 13b: Core Page Slot Architecture
- [x] Wrap `<main>` content of each core page in
      `<slot name="content">...</slot>` with existing markup as fallback:
      `index.astro`, `profile.astro`, `terms.astro`, `article/[id].astro`,
      `auth/signin.astro`, `auth/signup.astro`, `auth/verify.astro`,
      `auth/verify-email-change.astro`
- [x] Add `<slot name="before-unnamed-slot" />` and
      `<slot name="after-unnamed-slot" />` to each page (inside
      BaseLayout, around the content slot)
- [x] **Validation**: All pages still render correctly. Existing tests pass.

#### Phase 13c: Create Slot Registry
- [x] Create `src/cli/slot-registry.mjs` with entries for all ejectable
      artefacts: 9 components + 1 layout + 8 pages
- [x] Each registry entry defines: core import path, alias name,
      additional imports (with `usedBy` slot reference), ordered slot
      list (name, type, description, placeholder content), default slot flag
- [x] Export `SLOT_REGISTRY`, `KNOWN_COMPONENTS`, `KNOWN_LAYOUTS`,
      `PAGE_REGISTRY` from the registry (migrate from eject.mjs)

#### Phase 13d: Rewrite Proxy Generators
- [x] Rewrite `generateComponentProxy()` to read from `SLOT_REGISTRY`
      and produce commented slot blocks for all named + generic slots
- [x] Rewrite `generateLayoutProxy()` to produce commented slot blocks
      for head, header, below-header, before/after-unnamed-slot, footer
- [x] Create `generatePageProxy()` to produce proxy that imports core
      page; includes commented `content` slot + generic wrapper slots;
      includes commented-out imports for components used by that page
- [x] Update page eject path to use `generatePageProxy()` instead of
      file-copy + import rewriting
- [x] Remove `rewritePageImports()` function (no longer needed)
- [x] **Validation**: `eject pages/profile`, `eject components/FeedCard`,
      `eject layouts/BaseLayout` all produce correct proxy format

#### Phase 13e: Re-eject Parser & Merge Logic
- [x] Implement `parseEjectedFile()` — text-based parser that identifies:
      commented slot blocks (by `SLOT: <name>` marker), uncommented
      `<Fragment slot="xxx">` overrides, frontmatter, style block,
      and other developer content
- [x] Implement `mergeSlotContent()` — rebuilds file: for each slot in
      registry order, emits developer's uncommented override if present,
      else emits fresh commented block. Preserves `<slot />`, style block.
- [x] Modify `eject()` to detect existing files WITHOUT `--force`: if
      file exists and contains `SLOT:` markers → re-eject (merge); if
      no markers → legacy proxy, inject slot stubs around existing content
- [x] Update `--force` flag: reverts to full overwrite (replace entire
      file with fresh proxy)
- [x] **Validation**: Re-eject on a modified proxy preserves uncommented
      content and refreshes commented stubs

#### Phase 13f: `eject upgrade` & `eject all` Commands
- [x] Implement `ejectUpgrade()` — scan `src/components/`, `src/layouts/`,
      `src/pages/` for files matching known ejectable targets; re-eject each
- [x] Implement `ejectAll()` — eject every known target (fresh or re-eject);
      also eject actions
- [x] Update `eject upgrade` to also replace signpost READMEs in each
      directory with fresh copies from core templates
- [x] Route `eject upgrade` and `eject all` in `bin.mjs`
- [x] Update `runEject()` help text for new subcommands
- [x] **Validation**: `eject upgrade` and `eject all` work correctly

#### Phase 13g: Update Tests
- [x] Update `test/cli/eject.test.ts` — change proxy assertions to verify
      commented slot blocks, generic wrapper slots, new page proxy format
- [x] Create `test/cli/slot-registry.test.ts` — verify registry has entries
      for all components/layouts/pages; slot names unique; imports valid
- [x] Create `test/cli/eject-reejection.test.ts` — re-eject preserves
      uncommented content; refreshes comment blocks; handles legacy proxies
- [x] Create `test/cli/eject-upgrade-all.test.ts` — `upgrade` processes
      existing ejections; `all` ejects everything; README replacement
- [x] **Validation**: All tests pass. Coverage ≥80%.

#### Phase 13h: Documentation & AI Guidance Updates
- [x] Update `docs/src/content/docs/guides/customisation.md` — rewrite
      Eject section for slot proxy pattern, add best practices
- [x] Update `docs/src/content/docs/api-reference/cli.md` — document
      `eject upgrade`, `eject all`, re-eject behaviour, slot reference
- [x] Update signpost READMEs (pages, components, layouts) with slot
      proxy examples and available slot lists
- [x] Update `.github/copilot-instructions.md` — Proxy Component Pattern,
      Upgradeable Ejection, eject CLI
- [x] Update `.github/instructions/implementation.instructions.md` —
      Slot Architecture section, generic wrapper slot requirement
- [x] Update consumer AI guidance templates (copilot + cursor)

#### Phase 13i: Playground Smoke Test
- [x] Reset playground: `npm run reset:playground`
- [x] Verify pages render via injection (no ejected files)
- [x] Eject `layouts/BaseLayout` — verify slot proxy format, page renders
- [x] Eject `pages/profile` — verify page proxy format, page renders
- [x] Uncomment a slot override — verify it replaces the default
- [x] Re-eject — verify uncommented content preserved, stubs refreshed
- [x] Run `eject upgrade` — verify batch processing
- [x] Run full test suite: `npm run test:run`
- [x] Run coverage: `npm run test:coverage` — ≥80%

### Phase 14: Article Page SSR Migration

Implements the findings from
[`article-ssr/IMPACT_ASSESSMENT.md`](article-ssr/IMPACT_ASSESSMENT.md).
Migrates the article detail page (`/article/[id]`) from Client-Side
Rendering (CSR) to Server-Side Rendering (SSR). The original CSR approach
was a workaround for Cloudflare Workers constraints that was carried
forward after the 0.4.0 platform migration.

**Architectural rule established:** All pages MUST use SSR for initial
content rendering unless explicitly approved otherwise. The homepage is
the sole approved CSR exception (infinite scroll requires client-side
pagination continuation).

#### Phase 14a: SSR Implementation for `article/[id].astro`
- [x] Move fetch logic from `<script>` block into Astro frontmatter:
      import `getArticleById` from `../../db/queries/articles`, access
      `Astro.locals.app` for DB, query article by `id` param
- [x] Handle missing/invalid article: return 404 Response when article
      not found or `id` missing
- [x] Replace empty HTML shell with SSR-populated template: title,
      author, date, content (`set:html`), original link
- [x] Pass dynamic `title` and `description` to `BaseLayout` props for
      SEO (article title, article summary)
- [x] Remove entire `<script define:vars={{ id }}>` block (~60 lines)
- [x] Remove loading state (`#article-loading`) and error state
      (`#article-error`) divs (no longer needed — server handles this)
- [x] Remove `style="display: none;"` from article container
- [x] Preserve all CSS styles, slot architecture, and `crss-` class names
- [x] **Validation**: Article page renders full content on first load.
      No client-side JavaScript needed for article display.

#### Phase 14b: Unit Tests for SSR Article Page
- [x] Create `test/pages/article.test.ts` to verify SSR logic:
      - `getArticleById` is called with correct `id` parameter
      - 404 returned when article not found
      - 404 returned when `id` param missing
      - Article data correctly shapes the response
- [x] Run full test suite: `npm run test:run` — all pass
- [x] Verify ≥80% coverage maintained

#### Phase 14c: Documentation & AI Guidance — SSR Page Rendering Policy
- [x] Update `.github/copilot-instructions.md`:
      - Add "Page Rendering" section: all pages use SSR by default;
        document the homepage as the sole approved CSR exception
      - Update Architecture notes to reflect SSR article page
- [x] Update `.github/instructions/implementation.instructions.md`:
      - Change "Pages fetch data client-side from API routes" in Route
        Architecture section to document SSR data fetching pattern
      - Add SSR page rendering standard: pages query DB in frontmatter
        via `Astro.locals.app`, only use CSR for paginated continuations
- [x] Update `docs/src/content/docs/contributing/architecture.md`:
      - Update Route Split section to reflect SSR rendering for pages
- [x] Update consumer AI guidance templates:
      - `src/cli/templates/.github/copilot-instructions.md`
      - `src/cli/templates/.cursor/rules/community-rss.mdc`
- [x] **Validation**: All documentation references SSR as the default
      rendering approach for pages

#### Phase 14d: Commit & Verify
- [x] Run `npm run test:run` — all tests pass
- [x] Run `npm run test:coverage` — ≥80% maintained
- [x] Commit each sub-phase separately with descriptive messages

---

## Test Strategy

### New Test Files

| File | Type | Tests |
|------|------|-------|
| `test/cli/eject.test.ts` | Unit | Eject command: page/component/layout/actions targets, import rewriting, force flag, error handling |
| `test/cli/init.test.ts` | Unit | Updated: verify minimal scaffold, no page files, signpost READMEs created |
| `test/integration/conditional-injection.test.ts` | Unit | Integration hook: inject when no user file, skip when user file exists |
| `test/styles/css-overridability.test.ts` | Unit | Token audit: every `--crss-comp-*` consumed; no dead tokens; no hardcoded values in component styles |
| `e2e/flows/progressive-customization.spec.ts` | E2E | Fresh scaffold renders all pages; ejected page works; CSS overrides apply |

### Updated Test Files

| File | Change |
|------|--------|
| `test/cli/init.test.ts` | Remove assertions for scaffolded page files; add assertions for signpost READMEs |
| `test/integration/integration-factory.test.ts` | Add tests for conditional page injection logic |

### Phase 13 Test Files

| File | Type | Tests |
|------|------|-------|
| `test/cli/slot-registry.test.ts` | Unit | Registry completeness, slot uniqueness, import validity |
| `test/cli/eject-reejection.test.ts` | Unit | Re-eject preservation of uncommented content, comment block refresh, legacy proxy handling |
| `test/cli/eject-upgrade-all.test.ts` | Unit | Batch upgrade of all ejections, eject-all coverage, README replacement |

### Phase 14 Test Files

| File | Type | Tests |
|------|------|-------|
| `test/pages/article.test.ts` | Unit | SSR frontmatter logic: article found, not found (404), missing ID (404), DB access |

### Testing Principles (Additions)

| Principle | Implementation |
|-----------|---------------|
| CSS token audit is automated | Parse `components.css` for defined tokens; parse component files for consumed tokens; assert full coverage |
| CLI eject tests use temp dirs | Create temp project structure, run eject, verify file content |
| Injection tests mock filesystem | `vi.mock('fs')` to control `existsSync` for conditional injection |

---

### Phase 15: Annotation-Driven Ejection System

**Supersedes** the hand-authored `slot-registry.mjs` approach. All registry
data moves into `@eject-*` annotations inside the `.astro` source files.
`eject.mjs` reads annotations at runtime; no intermediate file is generated
or committed. Full specification in
`feature_plans/0_6_0/slot-registry-maintenance/IMPACT_ASSESSMENT.md`.

#### Phase 15a: Annotate Source Files

- [ ] Add `@eject-module`, `@alias`, and `@eject-dependency` comment block
      to frontmatter of all 9 component `.astro` files
- [ ] Add same block to `layouts/BaseLayout.astro`
- [ ] Add same block to all 8 page `.astro` files (conditional-injection pages
      only; API routes are excluded)
- [ ] Add `@eject-slot` + `@description` annotation above every currently-
      registered ejectable named slot across all annotated files
- [ ] Add `@additionalimportN` / `@importfromN` pairs to slots that require
      additional imports (replace `additionalImports[]` from the registry)
- [ ] Ensure every ejectable `<slot name="...">` uses the block form
      (`<slot name="...">default content</slot>`) so the placeholder can be
      extracted verbatim — not the self-closing form
- [ ] Verify unnamed `<slot />` is present in layout and pages (passthrough
      detection is automatic)

#### Phase 15b: Rewrite `eject.mjs` — Annotation Parser

- [ ] Implement `parseAnnotations(sourceFilePath)` in `eject.mjs`:
  - Reads `.astro` file relative to `__dirname` (package-internal path)
  - Extracts `@eject-module` block: alias, `@eject-dependency` entries
  - Extracts non-import frontmatter lines as props definition
  - Locates each `@eject-slot` annotation + following `<slot name>` tag;
    extracts slot name, description, additional imports, default content
  - Detects unnamed `<slot />` (passthrough flag)
- [ ] Replace all usages of `SLOT_REGISTRY` and `PAGE_REGISTRY` imports in
      `eject.mjs` with calls to `parseAnnotations()`
- [ ] Replace `KNOWN_COMPONENTS`, `KNOWN_LAYOUTS` derivation with a
      filesystem walk of `src/components/` and `src/layouts/` filtered by
      presence of `@eject-module`
- [ ] Replace `PAGE_REGISTRY` with a filesystem walk of `src/pages/`
      (excluding `api/`) filtered by `@eject-module`; derive `file` and
      `imports` from `@eject-dependency` annotations
- [ ] Update `generateProxy()` to use the parsed annotation data directly
      (no `entry.slots`, `entry.propsDefinition`, `entry.additionalImports`)
- [ ] All `additionalimportN` imports for a file included unconditionally in
      the `@start-eject-import` block; remove per-slot conditional-uncomment
      logic from `mergeSlotContent`

#### Phase 15c: Implement New Re-eject Algorithm

- [ ] Implement `reEject(existingProxy, parsedAnnotations)` replacing the
      existing `parseEjectedFile` / `mergeSlotContent` workflow:
  1. Regenerate `@start-eject-import` … `@end-eject-import` block
  2. Strip all `{/* … */}` comment blocks from the body
  3. For each live `<Fragment slot="name">`, look up the current annotation
     by slot name; insert a fresh comment block immediately above it
  4. Remove live `<Fragment>` blocks whose slot name no longer exists in
     the current annotations (orphan removal)
  5. Append commented blocks for new slots (in annotations, no live fragment)
  6. Preserve `<style>` block content unchanged
- [ ] Add `--force` path: fresh `generateProxy()` output only (no merge)
- [ ] Update `writeOrMerge()` to use `reEject()` instead of the old merge

#### Phase 15d: Purge Old Registry Code

- [ ] Delete `packages/core/src/cli/slot-registry.mjs`
- [ ] Remove all `import { SLOT_REGISTRY, … }` references from `eject.mjs`
      and `bin.mjs`
- [ ] Delete or rewrite all test files that import from `slot-registry.mjs`
- [ ] Remove `SLOT_REGISTRY` / `PAGE_REGISTRY` / `KNOWN_COMPONENTS` /
      `KNOWN_LAYOUTS` from the public API surface (`index.ts`) if exported
- [ ] Remove `slot-registry.mjs` references from all documentation and
      `copilot-instructions.md`

#### Phase 15e: AI Instructions

**Framework developer instructions**
(`packages/core/src/cli/templates/.github/instructions/eject-annotations.instructions.md`
and the corresponding framework-facing `.github/instructions/` file):

- [ ] Document the `@eject-module` / `@eject-slot` annotation contract
- [ ] Rule: every new ejectable component/layout/page must have `@eject-module`
- [ ] Rule: every ejectable named slot must have `@eject-slot` + `@description`
- [ ] Rule: slots should use block form (`<slot name>default</slot>`) so
      examples are available in the generated proxy
- [ ] Rule: aim for many small, granular named slots over few large ones
- [ ] Rule: after modifying a component, run `npx crss eject <target>` and
      inspect the generated proxy to verify annotation correctness
- [ ] Rule: `src/` path in `package.json` `files` must never be removed
- [ ] Remove all instructions referencing hand-editing `slot-registry.mjs`

**Consumer developer instructions** (in the CLI scaffold template
`packages/core/src/cli/templates/.github/`):

- [ ] Explain the `@start-eject-import` / `@end-eject-import` block and that
      it is safe to regenerate (do not put custom imports inside it)
- [ ] Explain how to activate a slot: uncomment the `<Fragment>` block
- [ ] Explain that the comment above each active fragment shows the current
      core default — compare it to see if your override needs updating
- [ ] Explain the re-eject workflow (`npx crss eject <target>`) and what
      changes vs. what is preserved
- [ ] Explain that removed slots (orphans) are automatically cleaned up on
      re-eject
- [ ] Explain that developer-added imports must go *outside* the
      `@start-eject-import` markers to survive a re-eject

#### Phase 15f: Testing

- [ ] Write `test/cli/annotation-parser.test.ts`:
  - `parseAnnotations()` extracts correct alias, dependencies, props, slots
  - Handles self-closing slots (empty placeholder)
  - Handles multiple `@additionalimportN` pairs
  - Detects unnamed slot passthrough
  - Returns `null` / throws for files without `@eject-module`
- [ ] Write `test/cli/proxy-generator.test.ts`:
  - `generateProxy()` produces correct `@start-eject-import` / `@end-eject-import`
  - All additional imports included unconditionally
  - Commented `<Fragment>` blocks contain verbatim default slot content
  - `<slot />` passthrough included only when unnamed slot detected
- [ ] Write `test/cli/re-eject.test.ts`:
  - Active fragments receive updated comment above them
  - Stale comments are stripped and regenerated
  - Orphan live fragments are removed
  - New slots are appended as commented blocks
  - `@start-eject-import` block is regenerated; `<style>` is preserved
  - `--force` produces a clean regeneration
- [ ] Write `test/cli/annotation-validity.test.ts` (replaces drift tests):
  - Every `.astro` file in `src/components/` and `src/layouts/` either has
    `@eject-module` or is explicitly excluded (no unknown files)
  - Every `@eject-slot` annotation is immediately followed by a named `<slot>`
  - Every `@eject-module` file has `@alias` defined
  - `@additionalimportN` / `@importfromN` pairs are complete (no orphaned keys)
- [ ] All old `slot-registry.mjs`-dependent tests deleted
- [ ] Coverage ≥80% maintained

#### Phase 15g: Documentation

- [ ] Update Starlight docs: replace "slot registry" references with
      "eject annotations"
- [ ] Add annotation format reference page to docs
- [ ] Update `eject` CLI help text to explain annotation-driven discovery
- [ ] Update `README.md` note about `src/` in `files`

### Phase 15 File Changes

| File | Action |
|------|--------|
| `packages/core/src/cli/slot-registry.mjs` | **Deleted** |
| `packages/core/src/cli/eject.mjs` | **Rewritten** |
| `packages/core/src/components/*.astro` | **Annotated** (9 files) |
| `packages/core/src/layouts/BaseLayout.astro` | **Annotated** |
| `packages/core/src/pages/**/*.astro` | **Annotated** (8 files) |
| `packages/core/test/cli/annotation-parser.test.ts` | **New** |
| `packages/core/test/cli/proxy-generator.test.ts` | **New** |
| `packages/core/test/cli/re-eject.test.ts` | **New** |
| `packages/core/test/cli/annotation-validity.test.ts` | **New** |
| `packages/core/test/cli/eject.test.ts` (old registry tests) | **Purged/replaced** |
| `.github/instructions/eject-annotations.instructions.md` | **New** |
| `packages/core/src/cli/templates/.github/` (consumer instructions) | **Updated** |
| `packages/core/index.ts` | Remove any `SLOT_REGISTRY` exports |
| `docs/src/content/docs/` | Update relevant pages |

---

## Migration Guide (for Pre-0.6.0 Projects)

Documented in the changelog and in the Starlight docs upgrade guide.

### Automatic (No Action Needed)

- **CSS fixes**: Component styles are now properly layered. Token and
  class overrides in `theme.css` work automatically. If you used
  `!important` as a workaround, you can safely remove it (leaving it
  causes no harm).

### If You Want Injected Pages (Recommended)

1. Delete all scaffolded page files from `src/pages/` (keep any you've
   customized)
2. Run `npm update @community-rss/core`
3. Pages are now served from the framework. You'll receive automatic
   improvements.

### If You Want to Keep Scaffolded Pages

No action needed. Your existing `src/pages/` files will shadow the
injected routes. However, you should update imports to use local
proxies:

1. Run `npx crss eject layouts/BaseLayout` to create a layout proxy
2. Update each page's imports from `@community-rss/core/layouts/...` to
   `../layouts/BaseLayout.astro`
3. Run `npx crss eject components/<name>` for any component you want to
   customize

### Actions File

Run `npx crss eject actions` to get the latest scaffold template.
Back up any custom actions you've added first.

---

## Risk Register (0.6.0 Additions)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Injected pages conflict with developer's file-based routing | Route collision warnings in Astro output | `fs.existsSync()` check before `injectRoute()` prevents injection when local file exists |
| `eject` import rewriting misses an import pattern | Ejected page has broken imports | Comprehensive regex tests; documented manual fixup for edge cases |
| Pre-0.6.0 projects confused by new model | Developer uncertainty on upgrade | Clear migration guide; existing scaffolded files shadow injected routes automatically (no breakage) |
| `coreActions` spread fails due to `astro:schema` constraint or Zod instance boundary | Actions redesign blocked | Spike first (Phase 0) — test both `defineAction()` acceptance and Zod singleton resolution via `peerDependency`. Fallback to improved-copy approach (Phase 7b) ready. |
| Global styles with `crss-` prefix collide with consumer classes | Style bleed | Already mitigated: BEM naming, unique `crss-` prefix. No components share class names. Same strategy as Bootstrap/Tailwind. |
| Signpost READMEs clutter developer's repo | Minor annoyance | Developers can delete READMEs or add to `.gitignore`. They're informational only. |
| `eject` command path resolution varies across OS/package managers | Command fails on Windows/pnpm/yarn | Use `import.meta.resolve` or `require.resolve` for cross-platform package resolution; test on multiple platforms |
| Windows path separators cause false negatives in conditional injection | Pages injected even though developer file exists at the path | Strictly use `new URL()` for all file path resolution in the `astro:config:setup` hook (never `path.join()` or string concatenation). `new URL()` always produces forward-slash paths regardless of OS. |

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 0: Technical spikes | ~2 hours |
| Phase 1: CSS overridability | ~2 hours |
| Phase 2: Wire Tier 3 tokens | ~2 hours |
| Phase 3: Remove hardcoded values | ~30 mins |
| Phase 4: Conditional page injection | ~3 hours |
| Phase 5: CLI scaffold redesign | ~1.5 hours |
| Phase 6: `eject` CLI command | ~4 hours |
| Phase 7a/b: Actions redesign | ~2 hours |
| Phase 8: Theme.css improvements | ~30 mins |
| Phase 9: Testing | ~4 hours |
| Phase 10: Documentation | ~3 hours |
| Phase 11: `.github` instruction updates | ~2 hours |
| Phase 12: Playground reset & smoke test | ~1 hour |
| Phase 13: Upgradeable component ejection | ~8 hours |
| Phase 14: Article page SSR migration | ~4 hours |
| Phase 15: Annotation-driven ejection system | ~10 hours |
| **Total** | **~49.5 hours** |

---

## Implementation Notes

*This section is initially empty. It will be populated during
implementation as phases are completed.*

### Phase 0: Technical Spikes — Completed

- **Actions spike result**: `astro:schema` re-exports standard `zod` v3.
  `defineAction()` accepts standard `z.object({...})` schemas — no special
  Astro wrapper required. Verified by code inspection of Astro 5.x source.
- **Zod singleton result**: `npm ls zod` confirms zod v3.25.76 is
  deduplicated across the workspace. Astro, the core package, and the
  playground all resolve to a single zod v3 copy at the workspace root.
  better-auth uses zod v4 separately but this doesn't affect Astro Actions.
  Adding `"zod": "^3.23.0"` as a peerDependency will enforce singleton
  resolution for consumers outside the monorepo.
- **Decision gate**: Both spikes pass → proceeding with Phase 7a
  (coreActions spread pattern).

### Phase 1: CSS Overridability — Completed

- Migrated all 9 component `<style>` blocks to `<style is:global>` +
  `@layer crss-components { ... }`:
  AuthButton, FeedCard, FeedGrid, TabBar, ArticleModal, MagicLinkForm,
  SignUpForm, ConsentModal, HomepageCTA.
- FeedCard: Removed the entire `:global()` duplicate block (~70 lines).
  Since all styles are now global + layered, dynamically-created cards
  (infinite scroll) are styled automatically without duplication.
- ArticleModal: Removed `:global()` wrappers from content element selectors
  (img, a, pre, blockquote) — now direct selectors within the layer.
- BaseLayout was already using `<style is:global>` + `@layer crss-components`
  — no change needed.
- All 442 tests pass.

### Phase 2: Wire Tier 3 Tokens — Completed

- Wired all 9 components + BaseLayout to their respective Tier 3 tokens:
  - AuthButton → `--crss-comp-auth-*` and `--crss-comp-btn-*` tokens
  - FeedCard → `--crss-comp-card-*` tokens (bg, border, radius, padding,
    hover-shadow, hover-lift, title/meta/summary sizes)
  - FeedGrid → `--crss-comp-grid-*` tokens (gap, min-col, padding)
  - TabBar → `--crss-comp-tab-*` tokens (gap, padding, font-size, color,
    active-color, border-color, disabled-opacity)
  - ArticleModal → `--crss-comp-modal-*` tokens (overlay-bg, bg, radius,
    max-width, padding, title-size, meta-size)
  - MagicLinkForm → `--crss-comp-form-*` tokens (gap, max-width,
    input-padding, input-border, input-radius, input-bg, focus-ring)
  - SignUpForm → Same form tokens + confirm panel wired to sys tokens
  - ConsentModal → `--crss-comp-consent-*` tokens (overlay-bg, bg,
    radius, padding, max-width, shadow, title-size)
  - HomepageCTA → `--crss-comp-cta-*` tokens (bg, border, radius,
    padding, text-color)
  - BaseLayout → `--crss-comp-header-*` tokens (bg, border) +
    `--crss-comp-nav-max-width`
- Added missing tokens to `components.css`: CTA section (5 tokens),
  Header section (3 tokens), `--crss-comp-form-max-width`.
- All flat aliases (e.g., `--crss-surface-0`, `--crss-text-primary`)
  replaced with either Tier 3 `--crss-comp-*` or Tier 2 `--crss-sys-*`
  tokens in component style blocks.
- All 442 tests pass.

### Phase 3: Remove Hardcoded Values — Completed

- Done alongside Phase 2 since same style blocks were being modified.
- ConsentModal: `rgba(0, 0, 0, 0.5)` → `var(--crss-comp-consent-overlay-bg)`
- TabBar: `opacity: 0.4` → `var(--crss-comp-tab-disabled-opacity)`
- TabBar: `0.15s ease` (×2) → `var(--crss-sys-transition-fast)`
- ArticleModal: `0.15s ease` (×5) → `var(--crss-sys-transition-fast)`
- MagicLinkForm: `max-width: 400px` → `var(--crss-comp-form-max-width)`
- SignUpForm: `max-width: 400px` (×2, form + confirm panel) →
  `var(--crss-comp-form-max-width)`
- BaseLayout: `max-width: 1200px` → `var(--crss-comp-nav-max-width)`
- FeedCard: `0.15s` transition fallback removed (was
  `var(--crss-transition-fast, 0.15s)`) — now uses
  `var(--crss-sys-transition-fast)`
- FeedGrid: `300px` min-col → `var(--crss-comp-grid-min-col)`
- ArticleModal: `800px` max-width → `var(--crss-comp-modal-max-width)`
- ConsentModal: `480px` max-width → `var(--crss-comp-consent-max-width)`
- No hardcoded colour, size, or transition values remain in any
  component `<style>` block.
- All 442 tests pass.

### Phase 4: Conditional Page Injection — Completed

- Copied all 8 page templates from `src/cli/templates/pages/` to
  `src/pages/` in the core package (index, profile, terms,
  article/[id], auth/signin, auth/signup, auth/verify,
  auth/verify-email-change).
- Rewrote all imports from `@community-rss/core/layouts/...` and
  `@community-rss/core/components/...` to relative imports
  (`../layouts/...`, `../../layouts/...` etc.) so pages work as
  package-internal entrypoints.
- Added `"./pages/*": "./src/pages/*"` to `package.json` exports map.
- Added conditional `injectRoute()` to `integration.ts`: for each of
  8 page routes, checks `existsSync(new URL('./' + localPath, astroConfig.root))`
  — if no local file exists, injects the framework page; if a developer
  file exists, skips injection and logs a message.
- Used `new URL()` exclusively for path resolution (no `path.join()` or
  string concatenation) to ensure Windows compatibility.
- Added `AstroConfig` to the import from `'astro'`.
- Logger fallback: `setupLogger ?? { info: () => {}, warn: () => {} }`
  for test environments where logger isn't provided.
- All 442 tests pass.

### Phase 5: CLI Scaffold Redesign — Completed

- Removed 8 page entries and 3 component proxy entries from `FILE_MAP`
  (total entries reduced from 22 to 14).
- Created 3 signpost README templates:
  - `pages/README.md`: Lists all 8 available pages, explains injection
    model, shows eject command.
  - `components/README.md`: Lists all 9 available components, explains
    proxy pattern, shows eject command with example proxy code.
  - `layouts/README.md`: Lists BaseLayout, explains layout proxy with
    named slot passthrough example.
- Added README entries to `FILE_MAP` (3 entries).
- Updated FILE_MAP JSDoc to explain why pages/components are excluded.
- Updated test assertions: file count 22→14, signpost READMEs verified,
  page and component absence asserted.
- All 442 tests pass.

### Phase 6: `eject` CLI Command — Completed

- Created `src/cli/eject.mjs` with full eject functionality:
  - `pages/<name>`: Copies page from core `src/pages/`, rewrites imports
    to point to local layout/component proxies. Auto-ejects layout and
    component proxies if they don't already exist locally.
  - `components/<name>`: Generates a proxy wrapper that re-exports the
    core component with `<slot />` passthrough and a `<style>` block.
  - `layouts/<name>`: Generates a proxy wrapper with named slot
    passthrough (`head`, `header`, default, `footer`).
  - `actions`: Copies the latest actions scaffold template.
- Page registry defines 8 pages with their layout/component dependencies
  — auto-ejection creates only what's needed.
- Conversational CLI output: `↳ Auto-created` messages explain why each
  dependency file was created.
- `--force` flag to overwrite existing files; skips by default.
- Created `src/cli/bin.mjs` as unified CLI entry point that routes
  `init` and `eject` subcommands. Backward compatible — no subcommand
  defaults to `init`.
- Updated `package.json` bin: `"community-rss"` and `"crss"` both point
  to `bin.mjs`.
- Added 15 new tests in `test/cli/eject.test.ts` covering pages,
  components, layouts, actions, auto-ejection, force/skip, and errors.
- All 457 tests pass (442 existing + 15 new).

### Phase 7: Actions Redesign — Completed

Implemented Phase 7a (`coreActions` spread) since the Phase 0 spike
confirmed Zod singleton deduplication works across the workspace.

- Created `src/actions/definitions.ts` exporting `coreActions` — a map of
  6 action definitions (`fetchArticles`, `checkEmail`, `submitSignup`,
  `updateProfile`, `changeEmail`, `confirmEmailChange`), each with a Zod
  input schema and an async handler that extracts `context.locals.app`.
- Exported `coreActions` and `ActionDefinition` from the barrel
  `src/actions/index.ts` (backward-compatible — existing handler + type
  exports are preserved).
- Added `zod: "^3.23.0"` as both `peerDependencies` and `devDependencies`
  in `packages/core/package.json` to ensure singleton resolution.
- Rewrote `src/cli/templates/actions/index.ts` scaffold to use
  `coreActions` spread pattern with a `wrapCoreActions()` helper that
  wraps each `{ input, handler }` entry with `defineAction()`.
- Updated `test/cli/init.test.ts` assertion from "handler imports" to
  "coreActions spread" verification.
- Added `test/actions/definitions.test.ts` with 9 tests covering: key
  enumeration, Zod schema validation (valid + invalid inputs), and handler
  type checks for all 6 actions.
- Phase 7b (improved copy fallback) was not needed.
- All 466 tests pass (457 existing + 9 new).

### Phase 8: Theme.css Improvements — Completed

- Expanded `src/cli/templates/theme.css` from 47 lines to ~130 lines with
  comprehensive documentation of the four-level customisation hierarchy:
  Level 1 (Token Overrides), Level 2 (Class-Level Overrides), Level 3
  (Eject & Edit), Level 4 (Custom Actions).
- Added practical "Brand Colour Change" example (indigo → teal).
- Added "Dark Mode" example using `@media (prefers-color-scheme: dark)`
  with system + component token remaps.
- Added Level 2 class-level override section with examples: sticky header,
  flat card style, pill-shaped buttons — all targeting `.crss-*` classes.
- Listed all available framework classes in the Level 2 section header.
- Added more Tier 3 component token examples (modal, form, header).
- Updated init test to verify `LEVEL 1`, `LEVEL 2`, `.crss-feed-card`,
  and `prefers-color-scheme: dark` are present in scaffolded theme.css.
- All 466 tests pass.

### Phase 9: Testing — Completed

- Created `test/styles/css-architecture.test.ts` with 7 tests covering:
  - All 10 `.astro` files (9 components + 1 layout) use `@layer crss-components`
  - All use `<style is:global>` (no scoped styles)
  - No `:global()` wrappers remain (redundant with `is:global`)
  - No hardcoded hex colour values in component styles
  - All class selectors use `crss-` prefix (namespace enforcement)
- Created token wiring audit tests:
  - Parses `components.css` to extract all `--crss-comp-*` declarations
  - Parses all `.astro` files to extract all `var(--crss-comp-*)` references
  - Asserts every defined token is consumed (no dead tokens)
  - Asserts every consumed token is defined (no undefined references)
- Created `test/integration/conditional-injection.test.ts` with 6 tests:
  - Injects all 8 page routes when no developer files
  - Skips all page routes when developer files exist
  - Logs skip message for each developer override
  - Selectively injects only missing pages
  - Always injects API routes regardless of `existsSync`
  - Page entrypoints point to package `src/pages/`
- Fixed dead tokens discovered by audit:
  - Wired `--crss-comp-btn-*` (bg, color, radius, padding, font-size) into
    AuthButton `.crss-btn` base class
  - Wired `--crss-comp-modal-shadow` into ArticleModal `.crss-modal`
  - Wired `--crss-comp-form-bg`, `--crss-comp-form-border`,
    `--crss-comp-form-radius`, `--crss-comp-form-padding` into form containers
  - Wired `--crss-comp-form-label-size`, `--crss-comp-form-label-color`
    into `.crss-form-label`
  - Removed 3 dead auth-button-specific tokens (replaced by generic btn tokens)
- Coverage: 87.81% statements, 88.46% branches, 89.16% functions — all above 80%
- All 480 tests pass (466 existing + 14 new).

### Phase 10: Documentation — Completed

- Rewrote `docs/src/content/docs/guides/customisation.md` — now documents
  the 4-level progressive customisation hierarchy (Token Overrides,
  Class-Level CSS, Eject & Edit, Custom Actions) with code examples,
  available classes table, ejection workflow, and component proxy pattern.
  Updated page table to match current 8 routes. Removed outdated proxy
  component and configuration file sections.
- Updated `docs/src/content/docs/guides/styling.md` — replaced proxy
  wrapper pattern with class-level overrides section and eject command
  reference. Removed `:global()` examples.
- Rewrote `docs/src/content/docs/api-reference/cli.md` — documented
  `npx crss eject` command with all targets (pages, components, layouts,
  actions), options, auto-ejection behaviour, and import rewriting.
  Updated `init` section to reflect minimal scaffold (no pages, READMEs
  instead). Added programmatic API examples for both commands.
- Updated `docs/src/content/docs/api-reference/css-tokens.md` — added
  Level 2 class-level override section, Token ↔ Component mapping table
  showing all 10 token groups and their consuming components.
- Updated all 3 signpost README templates to use `npx crss` shorthand.
- All 480 tests pass.

### Phase 11: `.github` Instruction Updates — Completed

- Updated `.github/copilot-instructions.md`:
  - Architecture line now mentions 4-level progressive customisation
  - Route split updated: page routes conditionally injected, not scaffolded
  - Added `npx crss eject` to Protected Areas section
  - Astro Actions section documents `coreActions` spread pattern
  - CSS section documents `<style is:global>`, `crss-` prefix, no `:global()`
  - Anti-patterns updated: replaced "inject page routes" with "scaffold page
    files from init"; added `astro:actions` import and `node_modules` patch 
- Updated `.github/instructions/implementation.instructions.md`:
  - Route Architecture: pages conditionally injected, eject command reference
  - Astro Actions: `coreActions` spread pattern documented
  - Component Standards: `<style is:global>`, `@layer crss-components`,
    `crss-` prefix, no `:global()`, token references required
- Updated `src/cli/templates/.github/copilot-instructions.md`:
  - Added 4-level progressive customisation overview
  - Pages section: auto-served, eject for customisation
  - Actions: `coreActions` spread pattern
  - Ejected Components section replaces Proxy Wrappers
  - Protected Areas: added injected page routes
  - Developer-Owned Files: reflects ejection model
- Updated `src/cli/templates/.cursor/rules/community-rss.mdc`:
  - Added Progressive Customisation section
  - Pages: auto-served, eject for customisation
  - Actions: `coreActions` spread
  - Components: eject-based model
  - Protected Areas: added page routes
- All 480 tests pass.

### Phase 12: Playground Reset & Smoke Test — Completed

- Ran `npm run reset:playground` — 14 files scaffolded (no pages, no
  component proxies). Database preserved via `--keep-db`.
- Verified playground `src/pages/` contains only `README.md` signpost.
- Verified `npx crss eject pages/profile` creates `src/pages/profile.astro`
  and auto-ejects `src/layouts/BaseLayout.astro` proxy with correct imports.
- Verified profile page imports from local `../layouts/BaseLayout.astro`
  (not from core), and BaseLayout proxy re-exports from
  `@community-rss/core/layouts/BaseLayout.astro`.
- Fixed `integration-factory.test.ts` — test expected 11 routes (API only)
  but conditional page injection now adds 8 page routes (total 19).
  Updated assertion and added page route pattern verification.
- All 480 tests pass (40 files). Coverage: 87.81% stmts, 88.44% branches,
  88.33% functions — all above 80% threshold.
- `reset-playground.sh` required no changes — already calls `init.mjs`
  which scaffolds the minimal set.

---

### Post-Phase 12: Acceptance Testing Bug Fixes

Five bugs discovered during hands-on acceptance testing of the playground.
All fixed and committed on the `0_6_0` branch. Test count rose from 480
to 481 (new integration-factory test for the Vite plugin).

#### Bug Fix 1 — Page Style Scoping Blocks Theme Overrides (ea6a887)

**Problem:** All 8 page files (`src/pages/*.astro`) used Astro's scoped
`<style>` blocks. Scoped styles inject `data-astro-cid-*` attributes
that create higher specificity than un-layered consumer class selectors
in `theme.css`. A consumer rule like `.crss-signin-title { background:
red; }` was silently defeated by the scoped equivalent.

**Root Cause:** Phases 1–3 converted component styles to
`<style is:global>` + `@layer crss-components` but missed page files.
Pages also contain component-level styles (e.g., `.crss-homepage`,
`.crss-signin-title`) that must participate in the cascade layer system.

**Fix:** Converted all 8 source page files and all 8 CLI template page
files (16 files total) from `<style>` to `<style is:global>` with
`@layer crss-components { ... }` wrapping all rulesets.

**Files Modified:**
- `src/pages/index.astro`, `src/pages/profile.astro`,
  `src/pages/terms.astro`, `src/pages/article/[id].astro`
- `src/pages/auth/signin.astro`, `src/pages/auth/signup.astro`,
  `src/pages/auth/verify.astro`, `src/pages/auth/verify-email-change.astro`
- `src/cli/templates/pages/` — same 8 files (CLI eject copies)

#### Bug Fix 2 — Consumer `theme.css` Never Loaded (c4f9d6e)

**Problem:** The integration injected framework CSS (layers, tokens) via
`injectScript('page-ssr', ...)` but never loaded the consumer's
`src/styles/theme.css`. Consumer token overrides and class-level
overrides had no effect.

**Root Cause:** The integration's `astro:config:setup` hook was missing
a step to detect and inject the consumer's theme file.

**Fix:** Added `existsSync()` check for `<astroRoot>/src/styles/theme.css`
in `integration.ts`. When present, appends an `injectScript('page-ssr',
'import "…/src/styles/theme.css";')` call **after** all framework CSS
injections. This ensures theme.css loads last (un-layered) and wins the
cascade.

**Files Modified:** `src/integration.ts`

#### Bug Fix 3 — Injected Pages Bypass Consumer Proxy Files (aa1fc1d)

**Problem:** Ejecting `layouts/BaseLayout` created a proxy file in the
consumer's `src/layouts/BaseLayout.astro`, but the framework's injected
pages (living inside `packages/core/src/pages/`) import
`../layouts/BaseLayout.astro` using package-internal relative paths.
Vite resolved these to the core package's own layout — the consumer's
proxy was never used.

**Root Cause:** AD-3 (page templates use local proxy imports) assumed
that Astro/Vite would resolve relative paths through the consumer's
file tree. In practice, injected pages execute from within
`node_modules/@community-rss/core/src/pages/`, so relative `../layouts/`
resolves back into the core package.

**Fix:** Added a `crss-consumer-overrides` Vite plugin to `integration.ts`
with a `resolveId` hook. When an import:
1. Originates from core's `src/pages/` directory
2. Targets a `.astro` file in `layouts/` or `components/`
3. And the consumer has a local file at the same name

…the plugin redirects to the consumer's local file. The consumer proxy
imports from `@community-rss/core/layouts/*` (bare package specifier),
so no circular resolution occurs.

**Files Modified:** `src/integration.ts`
**Tests Added:** `test/integration/integration-factory.test.ts` — new test
verifying plugin registration, `resolveId` behaviour for matching and
non-matching imports.

#### Bug Fix 4 — Vite Plugin Needs `enforce: 'pre'` (5eb4b74)

**Problem:** Even with the `crss-consumer-overrides` plugin registered,
the consumer's ejected `BaseLayout` proxy was still not being used.

**Root Cause:** Vite's built-in filesystem resolver handles relative
`.astro` imports **before** normal plugin `resolveId` hooks are called.
The plugin's `resolveId` was never invoked because Vite resolved the
import internally first.

**Debugging Approach:** `console.log` output was swallowed by the dev
server process. Switched to `appendFileSync('/tmp/crss-resolve.log', ...)`
for file-based debug logging. This confirmed `resolveId` was being called
(and working) once `enforce: 'pre'` was added.

**Fix:** Added `enforce: 'pre' as const` to the plugin object. This
ensures the plugin runs before Vite's default resolution phase, matching
the pattern used by Astro's own `astro:build` plugin.

**Files Modified:** `src/integration.ts`
**Tests Updated:** `test/integration/integration-factory.test.ts` — added
`expect(plugin.enforce).toBe('pre')` assertion.

#### Bug Fix 5 — Layout Proxy Slot Forwarding Hides Default Header (eba1861)

**Problem:** After ejecting `layouts/BaseLayout`, the default header
(`<header class="crss-header">` with nav and AuthButton) disappeared.
The rendered HTML jumped straight from `<body>` to `<main>`.

**Root Cause:** The generated proxy template forwarded all named slots:
```astro
<slot name="header" slot="header" />
<slot name="footer" slot="footer" />
```
Astro's `Astro.slots.has('header')` detects a forwarded named slot as
"provided" — even when no page fills it with content. The core layout's
conditional check `hasHeaderSlot ? <slot name="header" /> : <DefaultHeader />`
evaluated to `true`, rendering an empty slot instead of the default nav.

**Fix:** Removed header and footer slot forwarding from the proxy
template. The proxy now only forwards the default slot and the `head`
slot. The core layout's default header and footer render by default.
Developers who want a custom header add explicit `slot="header"` content
in their proxy.

**Files Modified:** `src/cli/eject.mjs` (`generateLayoutProxy` function)
**Tests Updated:** `test/cli/eject.test.ts` — changed assertions from
`toContain('slot name="header"')` to `not.toContain(...)`.

---

### Phase 13a: Core Component & Layout Slot Architecture — ✅ Completed

- [x] `BaseLayout.astro`: Removed `hasHeaderSlot` / `hasFooterSlot` checks;
      wrapped default header in `<slot name="header">...</slot>` with
      existing nav+AuthButton as fallback; added `<slot name="footer" />`
      (empty default — renders nothing unless developer provides content);
      added `<slot name="below-header" />`, `<slot name="before-unnamed-slot" />`,
      `<slot name="after-unnamed-slot" />` around `<slot />`
- [x] `ArticleModal.astro`: Wrapped header section in `<slot name="header">`,
      body (title + content) in `<slot name="body">`, footer in
      `<slot name="footer">`; added generic wrapper slots
- [x] `SignUpForm.astro`: Wrapped `<form>` in `<slot name="form">`,
      confirmation panel in `<slot name="confirmation">`; added generic
      wrapper slots (`before-unnamed-slot`, `after-unnamed-slot`) between
      form and confirmation; added JSDoc warning about script element IDs
- [x] Added generic wrapper slots (`before-unnamed-slot`,
      `after-unnamed-slot`) to: AuthButton, FeedCard, FeedGrid, TabBar,
      MagicLinkForm, ConsentModal, HomepageCTA
- [x] **Validation**: All 481 tests pass. No visual changes.

> **Notes:** The footer slot in BaseLayout changed from conditional
> rendering (`hasFooterSlot && <footer>...`) to an empty `<slot name="footer" />`
> — this means the footer element is no longer auto-wrapped in a `<footer>` tag.
> Developers providing footer content should include their own `<footer>` element.
> This simplifies the slot pattern and is consistent with the header approach.

> For SignUpForm, the generic wrapper slots are placed between the form
> and confirmation slots, allowing developers to inject content between
> the two panels. The `<script>` block warning was added to the JSDoc
> because the form slot replacement would break client-side event wiring
> if element IDs change.

### Phase 13b: Core Page Slot Architecture — ✅ Completed

- [x] All 8 core pages wrapped with `<slot name="content">` super-slot
      around their `<main>` block
- [x] Generic wrapper slots (`before-unnamed-slot`, `after-unnamed-slot`)
      added to each page inside BaseLayout, after the content slot
- [x] **Validation**: All 481 tests pass. No visual changes.

> **Notes:** The pattern places `<slot name="content">` immediately inside
> `<BaseLayout>` wrapping `<main>...</main>`, then generic wrapper slots
> after `</slot>` for the content, but still inside `<BaseLayout>`. Style
> and script blocks remain inside `<BaseLayout>` and outside the slots.
> The `article/[id].astro` page required an additional replacement since
> its `</main>` closing tag was not adjacent to `</BaseLayout>`.

### Phase 13c: Create Slot Registry — ✅ Completed

- [x] Created `src/cli/slot-registry.mjs` with 18 entries (9 components +
      1 layout + 8 pages)
- [x] Each entry has: `corePath`, `alias`, `slots` (ordered array with
      name/type/description/placeholder/isDefault), `additionalImports`
      (with `usedBy` reference)
- [x] Exported `SLOT_REGISTRY`, `KNOWN_COMPONENTS`, `KNOWN_LAYOUTS`,
      `PAGE_REGISTRY` — ready to replace inline definitions in eject.mjs

> **Notes:** `KNOWN_COMPONENTS` and `KNOWN_LAYOUTS` are now derived from
> `SLOT_REGISTRY` keys via `.filter()` + `.map()`. `PAGE_REGISTRY` is a
> separate export (not derived) to maintain the `file` + `imports` structure
> needed by the existing eject logic for auto-ejecting dependencies. The
> `additionalImports` field on registry entries captures the same info from
> a different angle (slot-centric vs page-centric).

### Phase 13d: Rewrite Proxy Generators — ✅ Completed

- [x] Rewrote `eject.mjs` — complete overhaul (~280 lines → ~280 lines)
- [x] All three proxy generators (`generateComponentProxy`,
      `generateLayoutProxy`, `generatePageProxy`) now delegate to a
      single `generateProxy(registryKey)` function that reads from
      `SLOT_REGISTRY`
- [x] Removed inline `PAGE_REGISTRY`, `KNOWN_COMPONENTS`, `KNOWN_LAYOUTS`,
      `CORE_SRC`, and `rewritePageImports()` — all replaced by imports
      from `slot-registry.mjs`
- [x] Page eject path now produces proxy wrappers (same pattern as
      components/layouts) instead of copying the core page file
- [x] Each ejected file contains: frontmatter with core import +
      commented additional imports, commented `{/* SLOT: <name> */}`
      blocks with `<Fragment slot="name">` placeholders, `<slot />`
      passthrough for default slot, empty `<style>` block

> **Notes:** Introduced a shared `generateSlotBlock()` helper that produces
> a standardised comment-wrapped `<Fragment>` block for each slot. The old
> `rewritePageImports()` regex-based import rewriting is fully eliminated —
> page proxies now import directly from `@community-rss/core/pages/...`
> just like component/layout proxies. Three existing tests fail as expected:
> (1) page eject test expected relative imports to local layouts instead of
> core import; (2) nested page test expected `../../layouts/` depth-relative
> import; (3) layout proxy test expected `slot name="head"` string and no
> header/footer slots. All will be updated in Phase 13g.

### Phase 13e: Re-eject Parser & Merge Logic — ✅ Completed

- [x] `parseEjectedFile(content)` — strips `{/* */}` JSX comments, then
      regex-matches uncommented `<Fragment slot="...">` blocks into
      `activeSlots` Map. Also extracts custom style content (ignoring the
      default placeholder comment) and developer-added import lines
- [x] `mergeSlotContent(freshProxy, parsed)` — for each active slot, finds
      the matching `SLOT: <name>` comment header + commented Fragment block
      via regex and replaces with the developer's uncommented content.
      Preserves custom styles and extra imports.
- [x] `writeOrMerge(relPath, freshProxy)` — new inner helper in `eject()`:
      creates new files, re-ejects existing files with `SLOT:` markers,
      skips legacy files without markers, or overwrites with `--force`
- [x] Primary eject paths (pages/components/layouts) now use `writeOrMerge`;
      auto-ejected dependencies still use `writeFile` (skip if exists)

> **Notes:** The parser uses a two-pass approach: first strips all JSX
> comments (`{/* ... */}`) to isolate active content, then regex-matches
> `<Fragment slot="name">` blocks. This avoids false positives from
> commented-out fragments. The merge regex matches both the `SLOT: <name>`
> comment header and the adjacent commented fragment as one unit, replacing
> both with the developer's active content. Manual validation confirmed:
> active slots preserved, custom styles preserved, commented stubs refreshed,
> `<slot />` passthrough retained. Same 3 test failures as Phase 13d.

### Phase 13f: `eject upgrade` & `eject all` Commands — ✅ Completed

- [x] `ejectUpgrade({ cwd })` — scans `src/components/`, `src/layouts/`,
      and `src/pages/` for files matching known ejectable targets; calls
      `eject()` with `force: false` for each (triggering re-eject/merge).
      Also replaces signpost READMEs from CLI templates.
- [x] `ejectAll({ cwd, force })` — ejects every known layout, component,
      page, and actions target. Ejects layouts first since pages depend on
      them via auto-eject.
- [x] `runEject()` updated to route `upgrade` and `all` targets to the
      new functions. Help text updated with new subcommands.
- [x] No changes to `bin.mjs` needed — it already delegates all eject
      args to `runEject()`, which now handles the routing.

> **Notes:** `ejectUpgrade()` intentionally uses `force: false` to trigger
> the merge path for files with `SLOT:` markers. Files without markers
> (legacy format) are skipped with a message. The `ejectAll()` function
> orders ejections: layouts → components → pages → actions, ensuring
> auto-ejected layout proxies for pages don't conflict with explicitly
> ejected ones. README replacement uses the existing template files at
> `src/cli/templates/{components,layouts,pages}/README.md`. The messages
> array in the result includes README update entries separately so the CLI
> prints them alongside file creation messages.

### Phase 13g: Update Tests — ✅ Completed

- [x] Fixed 3 failing tests in `test/cli/eject.test.ts`:
  - Page eject test: asserts proxy import from `@community-rss/core/pages/`
    and `SLOT: content` marker (was: local layout import)
  - Nested auth page test: asserts core import + `SLOT: content` (was:
    depth-relative imports)
  - Layout proxy test: asserts all `SLOT:` markers for head, header,
    below-header, before/after-unnamed-slot, footer + commented Fragments
- [x] Created `test/cli/slot-registry.test.ts` — 17 tests covering:
  registry structure, corePath/alias/slot validation, unique slot names,
  exactly one default slot per entry, valid slot types, KNOWN_COMPONENTS/
  KNOWN_LAYOUTS derivation, PAGE_REGISTRY cross-references
- [x] Created `test/cli/eject-reejection.test.ts` — 12 tests covering:
  parseEjectedFile (active slots, styles, imports), mergeSlotContent
  (slot replacement, style/import preservation, default slot retention),
  eject() re-eject flow (merge on SLOT: markers, skip on legacy, --force)
- [x] Created `test/cli/eject-upgrade-all.test.ts` — 13 tests covering:
  ejectUpgrade (re-ejects existing, skips non-existent, preserves slots,
  skips legacy), ejectAll (all layouts/components/pages/actions, no
  layout duplication, force overwrite)

> **Notes:** 527 tests passing across 43 files (481 → 527, +46 new).
> Coverage: ~87.7% statements, ~88.4% branches, ~88.4% functions — well
> above the 80% threshold. The `eject-upgrade-all.test.ts` tests revealed
> that `ejectAll()` correctly avoids duplicating the BaseLayout proxy
> (ejected once explicitly in layouts, then pages skip auto-eject because
> it already exists).

### Phase 13h: Documentation & AI Guidance Updates — ✅ Completed

- [x] Rewrote Level 3 section in `docs/src/content/docs/guides/customisation.md`
      — full proxy ejection pattern with code examples, upgrade workflow,
      auto-ejected dependencies explanation
- [x] Rewrote CLI eject section in `docs/src/content/docs/api-reference/cli.md`
      — new targets (`upgrade`, `all`), proxy format code example, re-eject
      behaviour details, removed obsolete "import rewriting" language
- [x] Updated all 3 signpost READMEs with slot tables, proxy format examples,
      `eject upgrade` instructions
- [x] Updated `.github/copilot-instructions.md` — Proxy Component Pattern
      section now describes slot blocks, `SLOT:` markers, re-eject workflow;
      added Upgradeable Ejection section with slot-registry reference
- [x] Updated `.github/instructions/implementation.instructions.md` — added
      Slot Architecture section with generic wrapper requirements, structural
      slot guidance, fallback content vs `has()` warning
- [x] Updated consumer AI guidance: `.github/copilot-instructions.md` template
      now covers proxy slot overrides + `eject upgrade`; `.cursor/rules/`
      template updated similarly

> **Notes:** Updated 9 documentation/guidance files total. The customisation
> guide Level 3 table now shows "Survives updates? Yes (via `eject upgrade`)"
> instead of the previous "No (manual merge)". The CLI reference gained
> ~60 lines of new content for the proxy format, re-eject, upgrade/all, and
> slot reference sections. Signpost READMEs now include slot tables for each
> target type.

### Phase 13i: Playground Smoke Test — ✅ Completed

- [x] Reset playground — 14 files created, clean state (no .astro in src/)
- [x] Eject `layouts/BaseLayout` — proxy created with `SLOT:` markers, correct
      `CoreBaseLayout` import, commented `AuthButton` import
- [x] Eject `pages/profile` — page proxy created with `SLOT: content`, layout
      NOT auto-ejected (already existed), correct `CoreProfilePage` import
- [x] Added active footer override: uncommented `<Fragment slot="footer">`
      with custom `<footer class="crss-footer">` content
- [x] Re-ejected `layouts/BaseLayout` — "preserved your customizations"
      message; active footer override retained at line 77
- [x] Ran `eject upgrade` — re-ejected both layout and page, refreshed all 3
      signpost READMEs, footer override preserved
- [x] Fixed `integration-factory.test.ts` — added selective `existsSync` mock
      that returns `false` for `/src/pages/` paths but delegates to real
      implementation for everything else. The test was fragile: it used
      `file:///app/playground/` as root without mocking `existsSync`, so
      ejected playground files caused page injection to be skipped.
- [x] Full test suite: **527 tests passing** across 43 test files
- [x] Coverage: **87.74%** statements, 88.39% branches, 88.42% functions —
      all above 80% threshold

> **Notes:** The integration-factory test was using the real playground path
> (`file:///app/playground/`) and relying on no page files existing there.
> Since playground is ephemeral and may have ejected files during dev, added
> a `vi.hoisted()` mock for `existsSync` that selectively returns false for
> page file paths. This makes the test deterministic regardless of playground
> state. Used `vi.hoisted()` per project convention for mock variables
> referenced in `vi.mock()` factories.

---

### Test Summary (Post-Phase-13)

- **527 tests** passing across 43 test files
- Coverage: ~87.7% statements, ~88.4% branches, ~88.4% functions
- All thresholds (≥80%) met
- Integration factory test made deterministic (selective existsSync mock)

### Acceptance Testing Status

**In Progress.** Manual testing against the playground revealed all five
bugs above. Further acceptance testing is planned to verify:

- [ ] Token overrides via `theme.css` (Tier 1, 2, 3) render correctly
- [ ] Class-level overrides in `theme.css` beat framework styles
- [ ] Ejected pages use consumer proxy layouts/components
- [ ] Ejected components render correctly as thin wrappers
- [ ] E2E test suite passes against running playground
- [ ] All pages render without console errors in browser

### Phase 14a: SSR Implementation — ✅ Completed

- [x] Moved fetch logic from `<script>` block into Astro frontmatter:
      imports `getArticleById` from `../../db/queries/articles`, accesses
      `(Astro.locals as { app?: AppContext }).app` for DB
- [x] Handles missing/invalid article: returns `new Response('Not Found', { status: 404 })`
- [x] Replaced empty HTML shell with SSR-populated template: `{article.title}`,
      `{article.authorName}`, `{article.publishedAt?.toLocaleDateString()}`,
      `set:html={article.content || ''}`, conditional original link
- [x] Passes dynamic `pageTitle` (`${article.title} — Community RSS`) and
      `pageDescription` (article summary) to BaseLayout for SEO
- [x] Removed entire `<script define:vars={{ id }}>` block (~60 lines)
- [x] Removed loading state (`#article-loading`) and error state
      (`#article-error`) divs
- [x] Removed `style="display: none;"` from article container
- [x] Preserved all CSS, slot architecture, and `crss-` class names

> **Notes:** Reduced file from 243 to 165 lines. The `AppContext` type is
> cast via `(Astro.locals as { app?: AppContext }).app` because the injected
> page can't import Astro's `App.Locals` type augmentation. The page now
> returns proper 404 HTTP status for missing articles instead of showing a
> client-side error div — this is the correct SSR behaviour.

### Phase 14b: Unit Tests — ✅ Completed

- [x] Created `test/pages/article.test.ts` with 20 tests covering:
      SSR data fetching, server-side error handling, SEO metadata,
      no client-side rendering artifacts, template rendering, slot
      architecture, CSS architecture
- [x] Full test suite: **544 tests** across 44 test files — all pass
- [x] Coverage: 87.74% stmts, 88.39% branches, 88.42% functions — ≥80%

> **Notes:** Tests validate the SSR architecture by reading the source file
> and asserting against its content (no Astro runtime needed). Fixed one
> assertion: `.crss-article__header` exists in template but not in CSS —
> changed to `.crss-article__back` which is defined in the `<style>` block.

### Phase 14c: Documentation & AI Guidance — ✅ Completed

- [x] Updated `.github/copilot-instructions.md`: Added Page Rendering
      subsection under Architecture; added CSR anti-pattern; removed
      duplicate anti-pattern entries
- [x] Updated `.github/instructions/implementation.instructions.md`:
      Changed "Pages fetch data client-side from API routes" to document
      SSR data fetching via `Astro.locals.app` in frontmatter
- [x] Updated `docs/src/content/docs/contributing/architecture.md`:
      Changed "Scaffolded page routes" to "Injected page routes" with SSR
      description
- [x] Updated consumer AI guidance: both copilot-instructions.md template
      and cursor .mdc template now document SSR rendering

> **Notes:** Updated 5 files total. The implementation.instructions.md
> change was the most impactful — it was the primary place where "Pages
> fetch data client-side" was documented as the pattern. The architecture
> docs also corrected "Scaffolded page routes" to "Injected page routes"
> since pages are conditionally injected, not scaffolded.

### Phase 14d: Final Verify — ✅ Completed

- [x] `npm run test:run` — 544 tests passing across 44 test files
- [x] `npm run test:coverage` — 87.74% stmts, 88.39% branches, 88.42% functions
- [x] All sub-phases committed separately with descriptive messages

---

### Test Summary (Post-Phase-14)

- **544 tests** passing across 44 test files (was 527 post-Phase-13)
- Coverage: ~87.7% statements, ~88.4% branches, ~88.4% functions
- All thresholds (≥80%) met
- New test file: `test/pages/article.test.ts` (20 tests)

### Phase 15: Annotation-Driven Ejection System — In Progress

- [x] Phase 15a: Annotate source files
- [x] Phase 15b: Rewrite `eject.mjs` — annotation parser
- [x] Phase 15c: New re-eject algorithm
- [x] Phase 15d: Purge old registry code
- [x] Phase 15e: AI instructions (framework + consumer)
- [ ] Phase 15f: Testing
- [ ] Phase 15g: Documentation

**Phase 15a Implementation Notes:**
- Added `@eject-module`, `@alias`, and `@eject-dependency` annotation blocks
  to all 9 component `.astro` files, `layouts/BaseLayout.astro`, and all 8
  page `.astro` files (18 files total).
- Added `@eject-slot` + `@description` annotations above every ejectable
  named slot across all annotated files.
- Added `@additionalimportN` / `@importfromN` pairs to slots requiring
  additional imports: BaseLayout header (AuthButton), index content (TabBar,
  FeedGrid, HomepageCTA), auth/signin content (MagicLinkForm), auth/signup
  content (SignUpForm).
- Self-closing slots (`before-unnamed-slot`, `after-unnamed-slot`,
  `below-header`, `head`, `footer`) kept as-is — parser will produce
  empty-placeholder `<Fragment>` blocks per Decision 3.
- Block-form slots with default content (header, body, footer on
  ArticleModal; form, confirmation on SignUpForm; header on BaseLayout;
  content on all pages) already use the required block form.
- All 544 tests pass after annotation. No functional changes to
  component/page behaviour.
- Issue: initial replacement accidentally consumed `<main>` opening tags
  from page files; fixed immediately in a follow-up edit batch.

**Phase 15b Implementation Notes:**
- Fully rewrote `src/cli/eject.mjs` (~580 lines) — annotation-driven,
  no dependency on `slot-registry.mjs`.
- New `parseAnnotations(filePath)` reads `.astro` files and extracts:
  `alias`, `dependencies`, `propsDefinition`, `slots[]`, `hasUnnamedSlot`,
  `corePath`. Returns `null` for non-annotated files.
- New `discoverComponents()`, `discoverLayouts()`, `discoverPages()` walk
  the filesystem and filter by `@eject-module` presence — replaces
  `KNOWN_COMPONENTS`, `KNOWN_LAYOUTS` and `PAGE_REGISTRY` exports.
- `generateProxy()` signature changed to `(annotations, registryKey)` —
  builds proxy from annotation data with `@start-eject-import` /
  `@end-eject-import` markers. All additional imports are unconditionally
  live (never commented out).
- `generateSlotBlock()` uses annotation `name`, `description`,
  `defaultContent` — identical format to old output but sourced from
  annotation data rather than the registry.
- `eject()` resolves dependencies via `@eject-dependency` annotation
  instead of `PAGE_REGISTRY.imports`. Page dependencies auto-eject with
  `↳ Auto-created` messages (matching Phase 6 spec).
- `ejectAll()` uses `discoverLayouts()` → `discoverComponents()` →
  `discoverPages()` → `actions` instead of `KNOWN_*` constants.
- `runEject()` CLI help text now shows dynamically discovered targets.
- Retained `parseEjectedFile()` and `mergeSlotContent()` — updated to
  work without `SLOT_REGISTRY` dependency; `mergeSlotContent()` lost the
  third `registryKey` parameter.
- Updated 1 test in `eject-reejection.test.ts` that tested old conditional
  import commenting behaviour; new assertion verifies imports are always
  live. Removed stale `registryKey` third argument from `mergeSlotContent`
  calls.
- All 544 tests pass. No regression.

**Phase 15c Implementation Notes:**
- Implemented `reEject(existingContent, annotations, registryKey)` in
  `eject.mjs` (~100 lines). The function:
  1. Parses developer customizations via `parseEjectedFile()`
  2. Regenerates the managed `@start-eject-import` … `@end-eject-import`
     block from current annotations
  3. Preserves active `<Fragment slot="name">` overrides for slots that
     still exist in annotations (adds fresh comment header above each)
  4. Removes orphan live fragments (slot removed from annotations)
  5. Adds commented blocks for new slots not previously present
  6. Preserves developer `<style>` content and extra imports
- Updated `writeOrMerge()` to call `reEject()` when an existing ejected
  proxy is detected (has `SLOT:` or `@start-eject-import` markers).
  Previously skipped; now merges and reports `↳ Re-ejected`.
- `--force` path unchanged: writes fresh `generateProxy()` output (no merge).
- Fixed critical bug in `parseAnnotations()`: the `@eject-slot` regex
  `\{\/\*\s*@eject-slot` did not match the actual annotation format
  `{\n  /* @eject-slot` where `{` and `/*` are on separate lines. Updated
  regex to `\{\s*\/\*\s*@eject-slot` to match both inline and multiline
  JSX expression forms. Same fix applied to unnamed-slot detection regex.
- Updated 2 tests in `eject-reejection.test.ts` and 1 test in
  `eject-upgrade-all.test.ts` that expected "skip" behavior — now expect
  "re-eject" behavior (preserves customizations, refreshes managed content).
- All 544 tests pass. No regression.

**Phase 15d Implementation Notes:**
- Deleted `src/cli/slot-registry.mjs` (830 lines) — superseded entirely by
  annotation-driven parser in `eject.mjs`.
- Deleted `test/cli/slot-registry.test.ts` (20 tests) — tested the deleted
  module's exports and structure.
- Updated `test/cli/eject-upgrade-all.test.ts` to import
  `discoverComponents`, `discoverLayouts`, `discoverPages` from `eject.mjs`
  instead of `KNOWN_COMPONENTS`, `KNOWN_LAYOUTS`, `PAGE_REGISTRY` from
  `slot-registry.mjs`.
- Updated `.github/copilot-instructions.md` — replaced slot-registry
  reference with annotation-driven description.
- No exports of `SLOT_REGISTRY` etc. existed in `index.ts` — no changes
  needed there.
- `eject.mjs` already had no imports from `slot-registry.mjs` (removed in
  Phase 15b).
- All 524 tests pass (43 files). 20 tests removed with the deleted file;
  equivalent coverage now provided by annotation-parser tests in Phase 15f.

**Phase 15e Implementation Notes:**
- Created `.github/instructions/eject-annotations.instructions.md` —
  framework developer rules for maintaining `@eject-module` and
  `@eject-slot` annotations in `.astro` source files. Covers: annotation
  contract, required/optional fields, block vs. self-closing slot guidance,
  granularity principles, verification workflow, format reference.
- Created `packages/core/src/cli/templates/.github/instructions/eject-customization.instructions.md`
  — consumer developer guide for working with ejected proxy wrappers.
  Covers: managed import block (don't put custom imports inside),
  activating slot overrides, re-eject workflow, `--force` path, tips.
- Confirmed no stale `slot-registry` references in consumer-facing
  `copilot-instructions.md` template.
- All 524 tests pass. No regression.

---

### Known Issues

- Consumer's `playground/src/styles/theme.css` contains a typo:
  `bbackground: red;` instead of `background: red;`. This is in the
  ephemeral playground only (not in framework code).

---

### Problems & Constraints

- **Astro slot detection is declaration-based, not content-based:**
  Forwarding a named slot via `<slot name="x" slot="x" />` in a proxy
  causes `Astro.slots.has('x')` to return `true` in the wrapped
  component, even when no page provides content for that slot. This is
  a fundamental Astro behaviour that required changing the proxy pattern
  to avoid forwarding header/footer slots by default (Bug Fix 5).

- **Vite plugin ordering requires `enforce: 'pre'` for import redirection:**
  Vite's built-in filesystem resolver runs before normal plugin
  `resolveId` hooks. Any plugin that needs to intercept relative `.astro`
  imports must use `enforce: 'pre'` to run in the pre-resolution phase.
  This matches the pattern used by Astro's own internal plugins.

---

### Review Feedback (2026-02-28)

External review of the plan was received and incorporated. Summary of
changes made:

1. **Zod `peerDependency` requirement** (AD-6, Phase 0, Phase 7a, Risk
   Register): Zod uses `instanceof` checks internally. If the framework
   and consumer resolve different copies, schema validation silently fails
   at the package boundary. `zod` must be a strict `peerDependency` to
   force singleton resolution. Phase 0 spike expanded to verify this.
   Phase 7a updated: `zod` moves to `peerDependency` (not `dependencies`).

2. **Conversational `eject` CLI output** (AD-5, Phase 6): When a page
   eject triggers auto-ejection of layout/component proxies, the CLI
   must clearly explain *why* each additional file was created. Seeing
   4–6 files appear from a single command is disorienting without context.
   Phase 6 now includes a required output format with `↳ Auto-created`
   annotations.

3. **Windows path normalization** (Phase 4, Risk Register): Astro and
   Vite are sensitive to `\` vs `/` on Windows. The `fs.existsSync()`
   check in conditional page injection must exclusively use `new URL()`
   for path construction — never `path.join()` or string concatenation.
   Explicit task added to Phase 4; dedicated risk register entry added.

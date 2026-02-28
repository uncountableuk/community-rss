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

### Testing Principles (Additions)

| Principle | Implementation |
|-----------|---------------|
| CSS token audit is automated | Parse `components.css` for defined tokens; parse component files for consumed tokens; assert full coverage |
| CLI eject tests use temp dirs | Create temp project structure, run eject, verify file content |
| Injection tests mock filesystem | `vi.mock('fs')` to control `existsSync` for conditional injection |

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
| **Total** | **~27.5 hours** |

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

### Phase 2: Wire Tier 3 Tokens — Not Started

### Phase 3: Remove Hardcoded Values — Not Started

### Phase 4: Conditional Page Injection — Not Started

### Phase 5: CLI Scaffold Redesign — Not Started

### Phase 6: `eject` CLI Command — Not Started

### Phase 7: Actions Redesign — Not Started

### Phase 8: Theme.css Improvements — Not Started

### Phase 9: Testing — Not Started

### Phase 10: Documentation — Not Started

### Phase 11: `.github` Instruction Updates — Not Started

### Phase 12: Playground Reset & Smoke Test — Not Started

---

### Problems & Constraints

*None yet. Will be populated during implementation.*

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

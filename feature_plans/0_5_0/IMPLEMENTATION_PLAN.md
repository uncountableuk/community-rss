# Release 0.5.0 — Architecture Refinement: Implementation Plan

## Overview

**Goal:** Adopt best-of-breed architectural principles from the
[Astro Framework Architecture Guidelines](./Astro%20Framework%20Architecture%20Guidelines.md)
without adding new user-facing functionality. At release completion, the
application looks and behaves identically to 0.4.0. All existing tests pass
(updated for new patterns). A new comprehensive E2E test suite validates
every page and user flow.

**Key Milestone:** Visual and functional parity with 0.4.0. All 309+
existing unit/integration tests pass. New Playwright E2E tests pass across
Chromium, Firefox, and WebKit. ≥80% unit test coverage maintained.

**Spec Reference:** Sections 5.8–5.14, 7.1, 8.1–8.3 of the
[Framework Spec](../0_0_1/Community-RSS-Framework-Spec.md).

**Guiding Principle:** This is a structural refactoring release. No new
features, no new routes, no new database tables. The app's external
behaviour is unchanged.

---

## Guidelines Assessment

### Adopted (Implementing in 0.5.0)

| Guideline | What We're Doing | Spec Section |
|-----------|-----------------|--------------|
| Three-Tier Design Token System | Split flat `--crss-*` tokens into Reference → System → Component hierarchy | §5.8 |
| CSS Cascade Layers | Add `@layer` declarations for deterministic cascade ordering | §5.9 |
| Automatic Token Injection | Use `injectScript('page-ssr')` to inject token CSS into every page automatically | §5.8, §5.9 |
| Astro Actions | Replace raw `fetch()` with type-safe RPC for existing endpoints | §5.10 |
| Server Islands | Use `server:defer` for auth-dependent UI (`AuthButton`, homepage CTA) | §5.11 |
| Container API Email Pipeline | Render `.astro` email components via Container API + `juice` inlining; token-to-value resolution for email clients | §5.12 |
| Proxy Component Architecture | Refactor components for clean logic/presentation separation; thin scaffold wrappers | §5.13 |
| E2E Testing (Playwright) | Full reference app testing: every page and user flow | §5.14 |
| AI-Native Architecture | Dual-target AI guidance: `.github/` (Copilot) + `.cursor/rules/` (Cursor) at both framework-developer and framework-user levels | §7.1 |
| Middleware Ordering | Integration middleware runs with `order: 'pre'` to populate `Astro.locals` before user code | §5.6 |
| Decoupled Client Logic | Already implemented in `utils/client/`; audit and document | §8.1 |

### Deferred (Documented, Not Implemented)

| Guideline | Reason | Target |
|-----------|--------|--------|
| Codemods (AST migrations) | No breaking changes yet; premature pre-1.0.0 | 1.0.0+ |
| CLI `diff` / `update` command | Scaffold files rarely change; implement when breaking changes arrive | Pre-1.0.0 |
| Full Inversion of Control | Config-based extension sufficient; pluggable interfaces premature | 1.0.0+ |
| RSSProvider Interface | FreshRSS is sole ingestion engine; abstraction premature | 1.0.0+ |
| Dependency Injection | Swappable DB/auth is a future concern | 1.0.0+ |
| Build-Time Token Transformation | Container API approach supersedes JSON token extraction | N/A |

### Not Adopted (Impractical)

| Guideline | Reason |
|-----------|--------|
| WebSocket real-time updates | RSS is poll-based; not in project scope |
| RSS feed generation via `astro:build:done` | We consume feeds, not generate them |
| Full DI container | Over-engineered for fixed technology stack |

---

## Codebase Review

### Files to Create

#### Styles — Three-Tier Token System
| File | Purpose |
|------|---------|
| `packages/core/src/styles/tokens/reference.css` | Raw values: colour palette, spacing scale, typography, borders, shadows, transitions |
| `packages/core/src/styles/tokens/system.css` | Semantic mappings: primary, background, surface, text, success, error, etc. |
| `packages/core/src/styles/tokens/components.css` | Component-scoped tokens: `--crss-comp-btn-*`, `--crss-comp-card-*`, etc. |
| `packages/core/src/styles/layers.css` | `@layer` declarations, ordering, and base reset styles |

#### Astro Actions
| File | Purpose |
|------|---------|
| `packages/core/src/actions/articles.ts` | Action handler: `fetchArticles` (wraps existing query logic) |
| `packages/core/src/actions/auth.ts` | Action handlers: `checkEmail`, `submitSignup` |
| `packages/core/src/actions/profile.ts` | Action handlers: `updateProfile`, `changeEmail`, `confirmEmailChange` |
| `packages/core/src/actions/index.ts` | Barrel export of all action handlers |
| `packages/core/src/cli/templates/actions/index.ts` | Scaffold template: Astro Actions registration |

#### Container API Email Templates
| File | Purpose |
|------|---------|
| `packages/core/src/templates/email/SignInEmail.astro` | Sign-in magic link email component |
| `packages/core/src/templates/email/WelcomeEmail.astro` | Welcome/verification email component |
| `packages/core/src/templates/email/EmailChangeEmail.astro` | Email change verification component |
| `packages/core/src/templates/email/EmailLayout.astro` | Shared email layout component (table-based) |

#### AI Guidance (Scaffolded for Consumers)
| File | Purpose |
|------|---------|
| `packages/core/src/cli/templates/.github/copilot-instructions.md` | Framework-user AI guidance for GitHub Copilot (VS Code) |
| `packages/core/src/cli/templates/.cursor/rules/community-rss.mdc` | Framework-user AI guidance for Cursor IDE (`.mdc` format with file-pattern scoping) |

#### E2E Tests
| File | Purpose |
|------|---------|
| `playwright.config.ts` | Root Playwright configuration |
| `e2e/fixtures/seed.ts` | E2E database seeding helper |
| `e2e/fixtures/auth.ts` | E2E authentication helpers |
| `e2e/fixtures/index.ts` | Combined fixture export |
| `e2e/pages/homepage.spec.ts` | Homepage rendering, layout, CTA |
| `e2e/pages/article-modal.spec.ts` | Article card click → modal open → URL update |
| `e2e/pages/signin.spec.ts` | Sign-in page rendering and form |
| `e2e/pages/signup.spec.ts` | Sign-up page rendering and form |
| `e2e/pages/verify.spec.ts` | Verification landing page |
| `e2e/pages/profile.spec.ts` | Profile page rendering and editing |
| `e2e/pages/terms.spec.ts` | Terms of service page |
| `e2e/flows/auth-flow.spec.ts` | Full auth lifecycle: sign-up → verify → profile → sign-out |
| `e2e/flows/guest-consent.spec.ts` | Guest cookie consent flow |
| `e2e/flows/article-browsing.spec.ts` | Article loading, pagination, modal navigation |

#### Unit Tests (New)
| File | Purpose |
|------|---------|
| `packages/core/test/actions/articles.test.ts` | Action handler tests |
| `packages/core/test/actions/auth.test.ts` | Action handler tests |
| `packages/core/test/actions/profile.test.ts` | Action handler tests |

### Files to Modify

#### Styles
| File | Change |
|------|--------|
| `src/styles/tokens.css` | **Remove** — replaced by `tokens/` directory |
| `src/components/*.astro` | Migrate `<style>` blocks to use new token hierarchy + `@layer crss-components` |
| `src/layouts/BaseLayout.astro` | Update stylesheet imports; add `@layer` wrapper |

#### Components (Proxy Pattern Refinement)
| File | Change |
|------|--------|
| `src/components/FeedCard.astro` | Add `--crss-comp-card-*` tokens; ensure no inline logic |
| `src/components/FeedGrid.astro` | Add `--crss-comp-grid-*` tokens |
| `src/components/TabBar.astro` | Add `--crss-comp-tab-*` tokens |
| `src/components/ArticleModal.astro` | Add `--crss-comp-modal-*` tokens; ensure logic in utils |
| `src/components/AuthButton.astro` | Refactor to Server Island (`server:defer`); add component tokens |
| `src/components/MagicLinkForm.astro` | Add `--crss-comp-form-*` tokens |
| `src/components/SignUpForm.astro` | Add `--crss-comp-form-*` tokens |
| `src/components/ConsentModal.astro` | Add `--crss-comp-consent-*` tokens |

#### Email Pipeline
| File | Change |
|------|--------|
| `src/utils/build/email-renderer.ts` | Add Container API rendering path; `juice` post-processing; keep HTML fallback |
| `src/utils/build/email-service.ts` | Update resolution chain to check `.astro` templates first |
| `src/types/email.ts` | Add Container API types (if needed) |

#### Integration
| File | Change |
|------|--------|
| `src/integration.ts` | Use `injectScript('page-ssr')` for automatic token/layer CSS injection; register Action exports; set middleware `order: 'pre'` |

#### CLI Scaffold
| File | Change |
|------|--------|
| `src/cli/init.ts` | Add `actions/index.ts` to scaffold file map; add `.github/copilot-instructions.md` and `.cursor/rules/community-rss.mdc` |
| `src/cli/templates/pages/*.astro` | Update scaffold pages to use Actions instead of raw fetch |
| `src/cli/templates/theme.css` | Update with three-tier token override examples |
| `src/cli/templates/email-templates/*.html` | Keep as developer-level HTML fallbacks |

#### Client Utils (Action Wiring)
| File | Change |
|------|--------|
| `src/utils/client/modal.ts` | Refactor `fetch()` calls to use Action imports where applicable |
| `src/utils/client/infinite-scroll.ts` | Refactor `fetch()` calls to use Action imports where applicable |

#### Existing Tests (Migration)
| File | Change |
|------|--------|
| `test/utils/build/email-renderer.test.ts` | Add tests for Container API rendering path |
| `test/utils/build/email-service.test.ts` | Update for new template resolution chain |
| `test/cli/init.test.ts` | Add assertions for new scaffold files (actions, .github) |
| `test/integration/integration-factory.test.ts` | Update for Actions registration |

#### .github Instructions
| File | Change |
|------|--------|
| `.github/copilot-instructions.md` | Add token tiers, @layer, Actions, Server Islands, Container API patterns |
| `.github/instructions/implementation.instructions.md` | Add token naming conventions, @layer usage, Action patterns |
| `.github/instructions/api-design.instructions.md` | Add Actions design rules |
| `.github/instructions/testing.instructions.md` | Add E2E testing patterns (Playwright) |
| `.github/instructions/test-performance.instructions.md` | Add E2E performance considerations |
| `.github/instructions/documentation.instructions.md` | Add architecture docs requirements |
| `.github/instructions/feature-plan.instructions.md` | Add E2E test phase requirement |
| `.github/skills/feature-implementation/SKILL.md` | Add Actions and E2E steps |

#### Documentation (Starlight)
| File | Change |
|------|--------|
| `docs/src/content/docs/api-reference/css-tokens.md` | Rewrite for three-tier system |
| `docs/src/content/docs/guides/customisation.md` | Update token override examples |
| `docs/src/content/docs/guides/styling.md` | New: token tiers, @layer, override patterns |
| `docs/src/content/docs/guides/architecture.md` | New: adopted/deferred principles |
| `docs/src/content/docs/api-reference/actions.md` | New: Astro Actions reference |
| `docs/src/content/docs/contributing/testing.md` | Add Playwright section |
| `docs/src/content/docs/contributing/architecture.md` | Update with new patterns |

### Files to Remove

| File | Reason |
|------|--------|
| `packages/core/src/styles/tokens.css` | Replaced by `styles/tokens/` directory (3 files) + `styles/layers.css` |

### Dependencies

#### New (`packages/core`)
| Package | Type | Purpose |
|---------|------|---------|
| `juice` | dependency | CSS style inlining for email HTML (Container API post-processing) |

#### New (root)
| Package | Type | Purpose |
|---------|------|---------|
| `@playwright/test` | devDependency | E2E test framework |

---

## Implementation Phases

### Phase 1: Three-Tier Design Token System

**Goal:** Replace the flat `tokens.css` with a three-tier hierarchy while
maintaining visual parity.

**Strategy:** This is the highest-risk phase because every component depends
on tokens. Work incrementally: create the new files, update imports in
BaseLayout, then migrate components one by one with visual checks.

- [x] Create `packages/core/src/styles/tokens/reference.css`
  - Extract current `--crss-*` values as `--crss-ref-*` raw tokens
  - Add complete colour palette (greys, indigo, red, amber, blue)
  - Keep spacing scale, typography, borders, shadows, transitions
- [x] Create `packages/core/src/styles/tokens/system.css`
  - Map reference tokens to semantic roles: `--crss-sys-color-primary`,
    `--crss-sys-color-surface-{0..3}`, `--crss-sys-color-text-{primary,secondary,muted}`,
    `--crss-sys-font-*`, `--crss-sys-space-*`, `--crss-sys-radius-*`,
    `--crss-sys-shadow-*`, `--crss-sys-transition-*`
  - All values reference `--crss-ref-*` tokens via `var()`
  - Keep backward-compatible aliases: `--crss-surface-0` → `var(--crss-sys-color-surface-0)`
- [x] Create `packages/core/src/styles/tokens/components.css`
  - Define component-scoped tokens for each of the 8 components
  - All values reference `--crss-sys-*` tokens via `var()`
  - Token groups: `--crss-comp-btn-*`, `--crss-comp-card-*`,
    `--crss-comp-grid-*`, `--crss-comp-tab-*`, `--crss-comp-modal-*`,
    `--crss-comp-form-*`, `--crss-comp-consent-*`, `--crss-comp-auth-*`
- [x] Update `BaseLayout.astro` to import new token files instead of `tokens.css`
- [x] Update all 8 component `<style>` blocks to use `--crss-comp-*` tokens
  > **Note:** Deferred to Phase 6 — components still use flat aliases which
  > resolve via backward-compatible system.css aliases. Component tokens are
  > defined and ready for Phase 6 migration.
- [x] Remove `packages/core/src/styles/tokens.css`
- [x] Add backward-compatibility aliases in `system.css` for any old token
      names used by deployed consumer `theme.css` files
- [x] Update `src/integration.ts` to use `injectScript('page-ssr')` for
      automatic token CSS injection — developers no longer need to manually
      import token files in every layout
- [x] Update `src/integration.ts` to set middleware `order: 'pre'` so
      authentication and `Astro.locals.app` are populated before any
      user-defined middleware or page code runs
  > **Note:** Already set to `order: 'pre'` in 0.4.0.
- [x] Update `src/cli/templates/theme.css` with three-tier override examples
- [x] Verify playground renders identically (visual check)
  > **Note:** Token values are identical; backward aliases preserve visual parity.

**Token Naming Convention:**
```
--crss-ref-{category}-{value}     e.g. --crss-ref-gray-100
--crss-sys-{role}                 e.g. --crss-sys-color-primary
--crss-comp-{component}-{prop}    e.g. --crss-comp-btn-bg
```

---

### Phase 2: CSS Cascade Layers

**Goal:** Wrap all framework CSS in `@layer` directives for deterministic
cascade ordering.

- [ ] Create `packages/core/src/styles/layers.css`
  - Declare layer order:
    `@layer crss-reset, crss-tokens, crss-base, crss-components, crss-utilities;`
  - Add minimal CSS reset in `@layer crss-reset` (box-sizing, margin, etc.)
  - Add base element styles in `@layer crss-base` (body, headings, links)
- [ ] Wrap token files in `@layer crss-tokens { ... }`
- [ ] Wrap component `<style>` blocks in `@layer crss-components { ... }`
- [ ] Add utility classes in `@layer crss-utilities { ... }` (existing
      utility styles extracted from components)
- [ ] Update `BaseLayout.astro` to import `layers.css` first, then token files
- [ ] Ensure `injectScript('page-ssr')` injects the layer declaration and
      token CSS in the correct order (layers.css first) so all pages
      receive the design system automatically
- [ ] Verify consumer `theme.css` (loaded after framework layers) overrides
      correctly without `!important`
- [ ] Document layer usage in `.github/instructions/implementation.instructions.md`
- [ ] Verify playground renders identically

---

### Phase 3: Astro Actions

**Goal:** Introduce type-safe RPC for existing client-server communication
while keeping API routes intact for backward compatibility.

**Design Decision:** Actions are defined in the core package as handler
functions that accept validated input and return typed output. The CLI
scaffolds an `src/actions/index.ts` in the developer's project that
registers these handlers with Astro's `defineAction` API. This follows
the framework's "developer-owned, package-powered" pattern.

- [ ] Create `packages/core/src/actions/articles.ts`
  - Export `fetchArticlesHandler(input)` — wraps existing article query logic
  - Input: `{ page?: number, limit?: number, feedId?: string, sort?: string }`
  - Output: `{ data: Article[], pagination: { page, limit, hasMore } }`
- [ ] Create `packages/core/src/actions/auth.ts`
  - Export `checkEmailHandler(input)` — wraps existing check-email logic
  - Export `submitSignupHandler(input)` — wraps existing signup logic
- [ ] Create `packages/core/src/actions/profile.ts`
  - Export `updateProfileHandler(input)` — wraps existing profile update logic
  - Export `changeEmailHandler(input)` — wraps existing email change logic
  - Export `confirmEmailChangeHandler(input)` — wraps existing confirm logic
- [ ] Create `packages/core/src/actions/index.ts` — barrel export
- [ ] Export action handlers from `packages/core/index.ts` (public API)
- [ ] Create `src/cli/templates/actions/index.ts` — scaffold template that
      imports from `@community-rss/core` and registers with `defineAction`
- [ ] Update `src/cli/init.ts` — add `actions/index.ts` to FILE_MAP
- [ ] Update scaffold page templates to use Actions for client-side calls
  - `index.astro` — article fetching
  - `auth/signin.astro` — check email
  - `auth/signup.astro` — submit signup
  - `profile.astro` — profile update, email change
- [ ] Refactor `src/utils/client/modal.ts` — use Actions for article fetching
- [ ] Refactor `src/utils/client/infinite-scroll.ts` — use Actions for
      pagination
- [ ] Test: `test/actions/articles.test.ts`
- [ ] Test: `test/actions/auth.test.ts`
- [ ] Test: `test/actions/profile.test.ts`
- [ ] Verify API routes still work independently (backward compatibility)
- [ ] Update `test/cli/init.test.ts` — assert actions scaffold

**Important:** The existing `/api/v1/*` routes remain functional and
unchanged. Actions are an additional typed layer that delegates to the same
business logic. Both paths are supported simultaneously.

---

### Phase 4: Server Islands

**Goal:** Refactor auth-dependent UI components to use Astro's `server:defer`
directive for improved initial page load performance.

**Components affected:**
- `AuthButton.astro` — shows different UI for guest/authenticated/admin
- Homepage CTA — shows sign-up prompt only for unauthenticated users

- [ ] Refactor `AuthButton.astro` to use `server:defer`
  - Add a lightweight placeholder fallback (skeleton or null)
  - The deferred server render checks session and renders appropriate UI
  - Ensure the component still works in SSR-only mode (no JS required)
- [ ] Refactor homepage CTA section to use server island
  - The `#crss-homepage-cta` div currently uses `display: none` + JS to
    toggle — replace with a server island that conditionally renders
- [ ] Update scaffolded `index.astro` to use server island syntax for auth
      areas of the page
- [ ] Verify: pages load with static shell first, auth UI streams in
- [ ] Verify: server island fallback renders correctly while loading
- [ ] Verify: no layout shift (CLS) when auth UI replaces placeholder
- [ ] Test: E2E tests cover both guest and authenticated states

**Note:** Server Islands require `output: 'server'` or `output: 'hybrid'`
in Astro config. The playground already uses `output: 'server'` via
`@astrojs/node`, so no config change is needed.

---

### Phase 5: Container API Email Pipeline

**Goal:** Replace `{{variable}}` HTML templates with `.astro` email
components rendered via the Astro Container API. Maintain backward
compatibility with existing HTML templates.

**Design:** Email templates become `.astro` components that:
- Accept typed props (recipient name, URLs, etc.)
- Use design tokens for consistent branding
- Are rendered to static HTML via `AstroContainer.create()` + `renderToString()`
- Are post-processed with `juice` to inline CSS for email clients
- **Must use `@{{ }}` escape syntax** for any Handlebars-style placeholders
  in `.astro` email components — this prevents the Astro compiler from
  evaluating them as JavaScript expressions during rendering
- **Token-to-value resolution:** Email styles must resolve CSS custom
  properties (`var(--crss-*)`) to concrete values before inlining, since
  most email clients do not support CSS custom properties. The build step
  must parse the token CSS and replace `var()` references with resolved
  values before `juice` inlines them.
- **Nested slots caveat:** The Container API can strip nested slots during
  `renderToString()`. Use a Wrapper component pattern (e.g.,
  `EmailLayout.astro` wrapping content via a single default slot) to
  preserve the full HTML structure.

- [ ] Install `juice` as a dependency in `packages/core`
- [ ] Create `packages/core/src/templates/email/EmailLayout.astro`
  - Table-based layout for email client compatibility
  - Inline styles using system design tokens (resolved to concrete values,
    not `var()` — email clients do not support CSS custom properties)
  - Use a single default slot to avoid nested slot stripping by Container API
  - Includes common email elements: header, footer, branding
- [ ] Create `packages/core/src/templates/email/SignInEmail.astro`
  - Props: `{ url: string, siteName: string }`
  - Uses `EmailLayout.astro`
  - Renders the magic link sign-in email
- [ ] Create `packages/core/src/templates/email/WelcomeEmail.astro`
  - Props: `{ url: string, siteName: string, name: string }`
  - Uses `EmailLayout.astro`
  - Renders the welcome/verification email
- [ ] Create `packages/core/src/templates/email/EmailChangeEmail.astro`
  - Props: `{ url: string, siteName: string, name: string, newEmail: string }`
  - Uses `EmailLayout.astro`
  - Renders the email change verification email
- [ ] Update `src/utils/build/email-renderer.ts`
  - Add `renderAstroEmail()` function using Container API
  - Add `resolveTokenValues()` utility that parses the token CSS files and
    builds a map of `--crss-*` → concrete values for email style resolution
  - Post-process with `juice` for CSS inlining (after token resolution)
  - Use `@{{ }}` escape syntax in `.astro` templates for any placeholder
    variables that should not be evaluated by the Astro compiler
  - Updated resolution chain:
    1. Developer `.astro` template (if exists in emailTemplateDir)
    2. Package `.astro` template (default)
    3. Developer `.html` template (backward compatibility)
    4. Package `.html` template (backward compatibility)
    5. Code-based fallback
- [ ] Update `src/utils/build/email-service.ts` to use new resolution chain
- [ ] Test: `test/utils/build/email-renderer.test.ts`
  - Test Container API rendering produces valid HTML
  - Test `juice` inlines styles correctly
  - Test `resolveTokenValues()` converts `var()` to concrete values
  - Test `@{{ }}` placeholders survive Astro compilation
  - Test resolution chain priority
  - Test backward-compatible HTML template rendering still works
- [ ] Verify: all 3 email types render correctly in Mailpit
- [ ] Update CLI scaffold email templates documentation

**Backward Compatibility:** Existing `{{variable}}` HTML templates continue
to work. The Container API path is preferred but the HTML path is preserved
as a fallback, ensuring zero disruption for developers who have already
customised their HTML templates.

---

### Phase 6: Proxy Component Architecture Refinement

**Goal:** Audit all components to ensure clean separation of logic and
presentation. No components should contain business logic — all logic
must live in `utils/`.

**Proxy Pattern Principle:** Scaffolded components in the developer's
`src/components/` directory must remain **thin wrappers**. They import
the functional core component from the npm package (e.g.,
`<CoreFeedCard {...Astro.props} />`), allowing the developer to own the
`<style>` block and surrounding HTML while the package owns all API
interaction logic. This ensures the developer's styling survives package
updates while logic improvements flow through automatically.

- [ ] Audit `FeedCard.astro` — verify no inline data transformation
- [ ] Audit `FeedGrid.astro` — verify no inline data transformation
- [ ] Audit `TabBar.astro` — verify no inline logic
- [ ] Audit `ArticleModal.astro` — extract any inline logic to `utils/client/modal.ts`
- [ ] Audit `AuthButton.astro` — auth logic stays in middleware/server island
- [ ] Audit `MagicLinkForm.astro` — form submission logic delegated to Action
- [ ] Audit `SignUpForm.astro` — form submission logic delegated to Action
- [ ] Audit `ConsentModal.astro` — consent logic delegated to `utils/client/guest.ts`
- [ ] Verify all components use exclusively CSS custom properties (no
      hardcoded colour, spacing, or font values)
- [ ] Verify all components accept `messages`/`labels` props for all user-
      facing strings
- [ ] Update scaffold wrapper templates to demonstrate the Proxy pattern:
      import core component, add custom `<style>`, pass messages
- [ ] Ensure scaffold wrappers are thin: no business logic, no API calls,
      no data transformation — only styling, slot content, and props
- [ ] Document the Proxy Component pattern in `.github/instructions/`

---

### Phase 7: E2E Testing with Playwright

**Goal:** Comprehensive browser-based testing of every page and user flow
in the reference application.

- [ ] Install `@playwright/test` as root devDependency
- [ ] Install Playwright browsers: `npx playwright install --with-deps`
- [ ] Create `playwright.config.ts` at repo root
  - Test directory: `./e2e`
  - Base URL: `http://localhost:4321`
  - Projects: chromium, firefox, webkit
  - Web server: `npm run dev -w playground`
  - CI config: retries, single worker, forbidOnly
- [ ] Create `e2e/fixtures/seed.ts`
  - Database seeding for E2E: create test users, articles, feeds
  - Uses the playground's `/api/dev/seed` endpoint or direct DB access
- [ ] Create `e2e/fixtures/auth.ts`
  - Authentication helpers: login as test user, get session cookie
  - Helper to intercept magic link emails via Mailpit API
- [ ] Create `e2e/fixtures/index.ts` — combined Playwright fixture export

**Page Tests:**
- [ ] `e2e/pages/homepage.spec.ts`
  - Page loads with correct title
  - Tab bar renders with correct labels
  - Feed grid container is present
  - Guest CTA is visible for unauthenticated users
  - Articles load on initial page render (or via client JS)
  - Infinite scroll triggers additional article loading
- [ ] `e2e/pages/article-modal.spec.ts`
  - Clicking an article card opens the modal
  - URL updates to `/article/[id]`
  - Modal displays article content
  - Close button dismisses modal
  - Browser back returns to previous page
  - Next/Previous navigation works within modal
- [ ] `e2e/pages/signin.spec.ts`
  - Sign-in form renders with email input
  - Submitting a valid email shows confirmation message
  - Invalid email shows error
  - "Create Account" link navigates to sign-up
- [ ] `e2e/pages/signup.spec.ts`
  - Sign-up form renders with email, name, terms fields
  - Email field is read-only when pre-filled
  - Terms checkbox is required
  - Submitting valid data shows confirmation
  - Missing fields show validation errors
- [ ] `e2e/pages/verify.spec.ts`
  - Verification page renders
  - With valid token: redirects to profile
  - With invalid/missing token: shows error message
- [ ] `e2e/pages/profile.spec.ts`
  - Profile page requires authentication (redirects if not logged in)
  - Displays user name and email
  - Edit mode allows changing display name and bio
  - Save persists changes
  - Email change section renders
- [ ] `e2e/pages/terms.spec.ts`
  - Terms page renders with content
  - Accessible from sign-up form link

**Flow Tests:**
- [ ] `e2e/flows/auth-flow.spec.ts`
  - Full lifecycle: navigate to sign-in → enter email → receive magic link
    → click verification link → arrive at profile → sign out → return to
    homepage
  - Test with Mailpit API to intercept and extract magic link URLs
- [ ] `e2e/flows/guest-consent.spec.ts`
  - Guest visits homepage → no consent cookie → interact → consent modal
    appears → accept → cookie set → interaction persists
- [ ] `e2e/flows/article-browsing.spec.ts`
  - Load homepage → articles appear → click article → modal opens → navigate
    next/previous → close modal → tab switch (if tabs active)

**CI Integration:**
- [ ] Add `npm run test:e2e` script to root `package.json`
- [ ] Update CI workflow (`.github/workflows/ci.yml`) to:
  - Install Playwright browsers
  - Start playground dev server
  - Run Playwright tests
  - Upload test report as artifact
- [ ] Configure Playwright to run headless in Docker

---

### Phase 8: AI Guidance Updates

**Goal:** Update all `.github` instruction files to reflect the new
architectural patterns. Create framework-user guidance files scaffolded
into consumer projects, targeting **both** GitHub Copilot (`.github/`) and
Cursor IDE (`.cursor/rules/` with `.mdc` files).

**Dual-Target AI Guidance:** The framework scaffolds AI rules for both
IDEs. `.mdc` files in `.cursor/rules/` support file-pattern scoping
(e.g., `globs: src/pages/**/*.astro`) so the AI only loads relevant rules
for the file being edited, saving context window tokens.

**Protected Areas:** All AI guidance files (both framework-developer and
framework-user) must explicitly define "Protected Areas" — zones the AI
must never suggest modifying:
- `node_modules/` — never fork or patch the core package
- Files not owned by the developer (injected API routes)
- Instead, guide the AI to use scaffolded overrides, `theme.css`, and
  `messages` props for customisation

- [ ] Update `.github/copilot-instructions.md`
  - Add "Three-Tier Token System" to Architecture section
  - Add "CSS Cascade Layers" pattern
  - Add "Astro Actions" pattern (export handlers, scaffold registration)
  - Add "Server Islands" pattern (auth-dependent UI)
  - Add "Container API Email Pipeline" pattern
  - Add "Proxy Component Architecture" pattern
  - Add "E2E Testing" to Testing section
  - Update Anti-Patterns: add token/layer violations
  - Add "Protected Areas" section: never modify `node_modules/`, never
    fork core package, never hand-edit injected API routes
- [ ] Update `.github/instructions/implementation.instructions.md`
  - Add token naming conventions (`--crss-ref-*`, `--crss-sys-*`,
    `--crss-comp-*`)
  - Add `@layer` usage rules
  - Add Action handler patterns
  - Add Server Island patterns
  - Add email component authoring rules
- [ ] Update `.github/instructions/api-design.instructions.md`
  - Add Astro Actions as part of the public API surface
  - Document action handler forward-compatibility rules
- [ ] Update `.github/instructions/testing.instructions.md`
  - Add E2E test patterns (Playwright)
  - Add E2E fixture conventions
  - Add E2E vs unit test decision framework
- [ ] Update `.github/instructions/test-performance.instructions.md`
  - Add E2E performance considerations
  - Add Playwright parallelisation guidance
- [ ] Update `.github/instructions/documentation.instructions.md`
  - Add architecture documentation requirements
  - Add Action documentation patterns
- [ ] Update `.github/instructions/feature-plan.instructions.md`
  - Add "Phase N: E2E Tests" requirement in implementation phases
  - Add Actions and Server Islands to architecture section template
- [ ] Update `.github/skills/feature-implementation/SKILL.md`
  - Add Action handler creation step
  - Add E2E test creation step
  - Add token audit step
- [ ] Create `packages/core/src/cli/templates/.github/copilot-instructions.md`
  - Framework-user guidance:
    - Use design tokens (`--crss-ref-*`, `--crss-sys-*`, `--crss-comp-*`) —
      never hardcode colours
    - Use Astro Actions for server communication — don't construct fetch URLs
    - Modify only developer-owned files (pages, email templates, theme.css) —
      don't touch `node_modules`
    - Override styles in `theme.css` — framework layers ensure your styles win
    - Components accept `messages` props for string customisation
    - **Protected Areas:** Never modify files in `node_modules/`, never fork
      or patch `@community-rss/core`, never hand-edit injected API routes —
      use scaffolded overrides and configuration instead
- [ ] Create `packages/core/src/cli/templates/.cursor/rules/community-rss.mdc`
  - Same guidance as the Copilot file but in Cursor's `.mdc` format
  - Add file-pattern scoping via `globs:` frontmatter (e.g.,
    `globs: src/**/*.astro, src/**/*.ts`) so rules only load for relevant
    files, saving context window tokens
  - Include "Protected Areas" section identical to the Copilot version
- [ ] Update `src/cli/init.ts` — add `.github/copilot-instructions.md` and
      `.cursor/rules/community-rss.mdc` to FILE_MAP

---

### Phase 9: Documentation Updates

**Goal:** Update Starlight docs to reflect all new architectural patterns.

- [ ] Rewrite `docs/src/content/docs/api-reference/css-tokens.md`
  - Document three-tier token hierarchy
  - Provide complete token reference tables (Reference, System, Component)
  - Show override examples at each tier
- [ ] Create `docs/src/content/docs/guides/styling.md`
  - Token tier overview with examples
  - `@layer` cascade explanation
  - How consumer `theme.css` overrides work
  - Common theming recipes (dark mode, brand colours, typography)
- [ ] Create `docs/src/content/docs/guides/architecture.md`
  - Summary of adopted principles (table from Spec §8.1)
  - Deferred principles with reasoning
  - Architecture decision records (ADRs) for major decisions
- [ ] Create `docs/src/content/docs/api-reference/actions.md`
  - List all exported action handlers
  - Show scaffolded `src/actions/index.ts` usage
  - Document input/output types
  - Show migration from raw `fetch()` to Actions
- [ ] Update `docs/src/content/docs/guides/customisation.md`
  - Update token override examples for three-tier system
  - Add Action customisation section
  - Add Server Island explanation
- [ ] Update `docs/src/content/docs/guides/email-setup.md`
  - Add Container API email authoring section
  - Document resolution chain (`.astro` → `.html` → fallback)
  - Show how to create custom `.astro` email templates
- [ ] Update `docs/src/content/docs/contributing/testing.md`
  - Add Playwright section: setup, writing tests, running
  - Add E2E vs unit test guidance
  - Add fixture documentation
- [ ] Update `docs/src/content/docs/contributing/architecture.md`
  - Add new patterns: tokens, layers, Actions, Server Islands, Container API
  - Update AppContext section
- [ ] Update `docs/src/content/docs/contributing/coding-standards.md`
  - Add token naming conventions
  - Add `@layer` rules
  - Add Action handler patterns

---

### Phase 10: Test Migration & Final Verification

**Goal:** Ensure all existing tests pass with new patterns and all new
tests are green.

- [ ] Run all existing 309+ Vitest tests — fix any failures from token
      renames, import changes, or email renderer changes
- [ ] Update `test/utils/build/email-renderer.test.ts` for Container API
- [ ] Update `test/utils/build/email-service.test.ts` for resolution chain
- [ ] Update `test/cli/init.test.ts` for new scaffold files
- [ ] Update `test/integration/integration-factory.test.ts` for Actions
- [ ] Run `npm run test:coverage` — verify ≥80% on all metrics
- [ ] Run `npm run test:e2e` — verify all E2E tests pass on Chromium
- [ ] Run E2E tests on Firefox and WebKit
- [ ] Manual smoke test:
  - Homepage loads with articles
  - Article modal opens and closes
  - Sign-in flow works end-to-end
  - Sign-up flow works end-to-end
  - Profile editing works
  - Email change flow works
  - Sign-out works
  - Guest consent modal works
  - Tab navigation works
- [ ] Verify playground `theme.css` overrides still apply correctly
- [ ] Verify no new console errors or warnings
- [ ] Verify build completes successfully: `npm run build -w playground`

---

## Implementation Notes

*Updated during implementation. Check off tasks, note decisions, log
problems.*

### Phase Status Tracker

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Three-Tier Design Tokens | ✅ Completed | Token hierarchy created, backward aliases, injectScript wiring |
| 2. CSS Cascade Layers | Not Started | |
| 3. Astro Actions | Not Started | |
| 4. Server Islands | Not Started | |
| 5. Container API Email Pipeline | Not Started | |
| 6. Proxy Component Refinement | Not Started | |
| 7. E2E Testing (Playwright) | Not Started | |
| 8. AI Guidance Updates | Not Started | |
| 9. Documentation Updates | Not Started | |
| 10. Test Migration & Verification | Not Started | |

### Decisions Log

- **Phase 1:** Kept backward-compatible aliases in `system.css` so all existing
  `--crss-*` flat names continue to resolve. Components still use flat names
  for now; component tokens (`--crss-comp-*`) are defined but component style
  migration deferred to Phase 6 (Proxy Component Refinement) to keep Phase 1
  focused on the token infrastructure.
- **Phase 1:** Removed stale compiled `.js` and `.d.ts` artifacts from
  `packages/core/src/` and root. Vitest was resolving `.js` before `.ts`,
  causing tests to run against outdated code. The package's `main`/`exports`
  fields point to `.ts` files, so the compiled JS was unnecessary.
- **Phase 1:** Added `--crss-border` and `--crss-primary` aliases in
  `system.css` — these were referenced in BaseLayout but missing from the
  original flat tokens.css.

### Problems Log

- **Phase 1:** Stale `.js` artifacts in `packages/core/src/` caused Vitest
  to resolve the old compiled JS instead of the updated `.ts` source.
  Resolved by deleting all `.js` and `.d.ts` files outside the CLI directory.

# CSS Overridability — Impact Assessment

## Executive Summary

The framework's CSS architecture has a **critical specificity gap** that
prevents consumers from overriding component class-based rulesets in their
`theme.css` file. While the three-tier design token system (Reference →
System → Component) and cascade layer architecture were designed in 0.5.0
to make consumer overrides seamless, the implementation is incomplete:

1. **8 of 9 components use Astro scoped `<style>` blocks** — these compile to
   selectors like `.crss-btn[data-astro-cid-abc123]` (specificity 0,2,0),
   which **always beat** the consumer's un-scoped `.crss-btn` (specificity
   0,1,0) in `theme.css`.
2. **Only BaseLayout follows the correct pattern** — `<style is:global>` with
   `@layer crss-components { ... }`, which allows un-layered consumer CSS to
   win automatically.
3. **Tier 3 component tokens (`--crss-comp-*`) are 85% unused** — 67 tokens
   are defined in `components.css` but only ~10 are actually referenced by
   component styles, rendering the documented customisation pathway inert.

**The result**: consumers cannot restyle components via `theme.css` without
`!important`, which defeats the purpose of the entire cascade layer system.
CSS should be the **primary, lowest-friction customisation path** for
developers. This assessment proposes migrating all components to the
BaseLayout pattern.

---

## 1. The Problem

### 1.1 What the Consumer Expects

The `theme.css` scaffold (and the framework documentation) implies that
consumers can override component styles at three levels:

```css
/* Level 1: Change a colour everywhere via a reference token */
:root { --crss-ref-indigo-600: #e11d48; }

/* Level 2: Change the primary brand colour via a system token */
:root { --crss-sys-color-primary: hotpink; }

/* Level 3: Change just the card background via a component token */
:root { --crss-comp-card-bg: #1a1a2e; }

/* Level 4: Override an entire ruleset for a class */
.crss-feed-card { border-radius: 0; box-shadow: none; }
```

**Levels 1–3 work** because CSS custom properties resolve at computed-value
time — scoping doesn't affect them. **Level 4 does not work** because of the
specificity gap described below.

### 1.2 Why Level 4 Fails

Astro's default `scopedStyleStrategy` is `"attribute"`. When a component has
a scoped `<style>` block, Astro compiles:

```css
/* Source (component) */
.crss-feed-card { background: var(--crss-surface-0); }

/* Compiled output */
.crss-feed-card[data-astro-cid-abc123] { background: var(--crss-surface-0); }
```

The compiled selector has specificity **(0, 2, 0)** (one class + one
attribute). The consumer's override in `theme.css`:

```css
.crss-feed-card { background: #1a1a2e; }
```

Has specificity **(0, 1, 0)**. Since both are un-layered (the component's
`<style>` is not inside a `@layer`), the **framework's higher-specificity
scoped selector wins**. The consumer's override is silently ignored.

### 1.3 Why BaseLayout Works Differently

BaseLayout uses this pattern:

```astro
<style is:global>
  @layer crss-components {
    .crss-header { background: var(--crss-surface-0); }
  }
</style>
```

- `is:global` prevents Astro from adding `[data-astro-cid-*]` attributes
- `@layer crss-components` places styles in a cascade layer
- Un-layered CSS (consumer's `theme.css`) **always beats layered CSS**,
  regardless of specificity

This is the correct pattern. All other components should follow it.

### 1.4 Current Component Audit

| Component | `is:global`? | `@layer`? | Consumer can override classes? | Uses `--crss-comp-*` tokens? |
|-----------|:---:|:---:|:---:|:---:|
| **BaseLayout** | Yes | Yes | **Yes** | No (should) |
| **AuthButton** | No | No | **No** | 0 of 10 |
| **FeedCard** | No | No | **No** | 2 of 9 |
| **FeedGrid** | No | No | **No** | 0 of 3 |
| **TabBar** | No | No | **No** | 0 of 8 |
| **ArticleModal** | No | No | **No** | 1 of 8 |
| **MagicLinkForm** | No | No | **No** | 7 of 15 |
| **SignUpForm** | No | No | **No** | 7 of 15 |
| **ConsentModal** | No | No | **No** | 0 of 6 |
| **HomepageCTA** | No | No | **No** | 0 of N/A |

---

## 2. Proposed Solution

### 2.1 Core Change: Migrate All Components to Global Layered Styles

Every component's `<style>` block changes from:

```astro
<style>
  .crss-feed-card { background: var(--crss-surface-0); }
</style>
```

To:

```astro
<style is:global>
  @layer crss-components {
    .crss-feed-card { background: var(--crss-comp-card-bg); }
  }
</style>
```

This simultaneously:
1. **Removes the specificity barrier** — no more `[data-astro-cid-*]` on selectors
2. **Activates cascade layers** — consumer CSS automatically wins
3. **Wires up Tier 3 tokens** — components consume their defined `--crss-comp-*`
   tokens, making the documented customisation path functional

### 2.2 Wire Up All Tier 3 Component Tokens

Every hardcoded or flat-token value in component styles gets replaced with its
corresponding `--crss-comp-*` token. Where a component token doesn't yet exist
for a commonly-overridden property, a new token is added to `components.css`.

Before:
```css
.crss-feed-card {
  background: var(--crss-surface-0);
  border: 1px solid var(--crss-surface-2);
  border-radius: var(--crss-radius-md);
}
```

After:
```css
.crss-feed-card {
  background: var(--crss-comp-card-bg);
  border: 1px solid var(--crss-comp-card-border);
  border-radius: var(--crss-comp-card-radius);
  padding: var(--crss-comp-card-padding);
}
```

### 2.3 Eliminate FeedCard Style Duplication

FeedCard currently duplicates **every CSS rule** — once scoped and once with
`:global()` — to support dynamically-created cards via infinite scroll. With
the `<style is:global>` + `@layer` pattern, both static and dynamic cards
are styled by a single set of global rules. The entire `:global()` duplicate
block is removed, cutting the component's CSS roughly in half.

### 2.4 Add Missing Component Tokens

Some components have styling properties that consumers would reasonably want
to override but lack corresponding Tier 3 tokens. New tokens to add:

| Token | Default | Component |
|-------|---------|-----------|
| `--crss-comp-cta-bg` | `var(--crss-sys-color-surface-1)` | HomepageCTA |
| `--crss-comp-cta-border` | `var(--crss-sys-color-surface-3)` | HomepageCTA |
| `--crss-comp-cta-radius` | `var(--crss-sys-radius-lg)` | HomepageCTA |
| `--crss-comp-cta-padding` | `var(--crss-sys-space-md) var(--crss-sys-space-lg)` | HomepageCTA |
| `--crss-comp-header-bg` | `var(--crss-sys-color-surface-0)` | BaseLayout |
| `--crss-comp-header-border` | `var(--crss-sys-color-border)` | BaseLayout |
| `--crss-comp-nav-max-width` | `1200px` | BaseLayout |

### 2.5 Remove Hardcoded Values

| Component | Hardcoded Value | Replace With |
|-----------|----------------|--------------|
| ConsentModal | `rgba(0, 0, 0, 0.5)` | `var(--crss-comp-consent-overlay-bg)` |
| TabBar | `0.4` opacity | `var(--crss-comp-tab-disabled-opacity)` |
| TabBar | `0.15s ease` | `var(--crss-transition-fast)` |
| ArticleModal | `0.15s ease` (×5) | `var(--crss-transition-fast)` |
| MagicLinkForm | `400px` max-width | `var(--crss-comp-form-max-width)` (new) |
| SignUpForm | `400px` max-width | `var(--crss-comp-form-max-width)` (new) |
| BaseLayout | `1200px` max-width | `var(--crss-comp-nav-max-width)` (new) |

---

## 3. Trade-offs & Risks

### 3.1 Loss of Automatic Style Scoping

**Risk**: With `is:global`, component class names are no longer scoped by
Astro's compiler. If two components use the same class name, styles could
conflict.

**Mitigation**: The framework already uses BEM-style namespaced classes
(`crss-feed-card__title`, `crss-consent-actions`, etc.) that are globally
unique by convention. The `crss-` prefix prevents collisions with consumer
CSS. This is the same strategy used by major CSS frameworks (Bootstrap,
Tailwind's `@apply`, Material UI).

**Verdict**: Low risk. The naming convention already provides de-facto
scoping. No component reuses another component's class names.

### 3.2 Larger Global CSS Surface

**Risk**: All component styles become global, slightly increasing the
overall CSS bundle.

**Mitigation**: This is the standard approach for framework CSS.
Astro's scoped styles are designed for application-level components, not
framework libraries that consumers need to customise. The total CSS payload
across all 9 components is approximately 15–20KB unminified; its contribution
to a gzipped production bundle is negligible (1–3KB). Additionally, cascade
layers provide the specificity guarantees that scoping was being (incorrectly)
relied upon for.

**Verdict**: Negligible impact. Framework CSS should be global and layered.

### 3.3 Breaking Change for Consumers Using `!important` Workarounds

**Risk**: Any consumer who has worked around the current bug by adding
`!important` to their `theme.css` overrides will find those rules now have
even higher priority (correct, but potentially surprising if they've also
set values elsewhere).

**Mitigation**: This is a fix, not a break — consumer overrides that were
silently ignored will now work. `!important` overrides will continue to work.
Document in the changelog that `!important` is no longer needed.

**Verdict**: Net positive. No existing consumer behaviour is broken.

### 3.4 Dynamic Content Styling

**Risk**: FeedCard's `:global()` duplicate block exists because Astro-scoped
styles don't apply to dynamically-injected HTML (infinite scroll). Removing it
could break dynamic cards.

**Mitigation**: Moving to `<style is:global>` + `@layer crss-components`
means **all** `.crss-feed-card` elements are styled regardless of how they
were created (server-rendered, client-side injected, or hydrated). This
actually **fixes** the root cause that required the duplication.

**Verdict**: Improvement. Dynamic content is now styled by the same single
set of rules as static content.

---

## 4. Scope of Changes

### 4.1 Files Modified

| File | Change |
|------|--------|
| `src/components/AuthButton.astro` | `<style>` → `<style is:global>` + `@layer` + wire `--crss-comp-auth-*` tokens |
| `src/components/FeedCard.astro` | Same + remove `:global()` duplicate block + wire `--crss-comp-card-*` tokens |
| `src/components/FeedGrid.astro` | Same + wire `--crss-comp-grid-*` tokens |
| `src/components/TabBar.astro` | Same + wire `--crss-comp-tab-*` tokens + remove hardcoded values |
| `src/components/ArticleModal.astro` | Same + wire `--crss-comp-modal-*` tokens + remove hardcoded values |
| `src/components/MagicLinkForm.astro` | Same + wire remaining `--crss-comp-form-*` tokens |
| `src/components/SignUpForm.astro` | Same + wire remaining `--crss-comp-form-*` tokens |
| `src/components/ConsentModal.astro` | Same + wire `--crss-comp-consent-*` tokens + remove hardcoded `rgba()` |
| `src/components/HomepageCTA.astro` | Same + wire new `--crss-comp-cta-*` tokens |
| `src/layouts/BaseLayout.astro` | Wire new `--crss-comp-header-*` tokens (already uses correct pattern) |
| `src/styles/tokens/components.css` | Add missing tokens (CTA, header, nav, form max-width) |

### 4.2 Files NOT Modified

- **Token CSS** (`reference.css`, `system.css`) — no structural changes
- **`layers.css`** — layer order is unchanged
- **Route handlers** — no backend changes
- **Database** — no schema changes
- **CLI templates** — no scaffold changes (the theme.css template comments
  already document the override pattern)
- **`index.ts`** — no public API changes

### 4.3 Estimated Effort

| Phase | Effort |
|-------|--------|
| Migrate 8 component `<style>` blocks | ~2 hours |
| Wire unused Tier 3 tokens to component styles | ~2 hours |
| Add missing tokens to `components.css` | ~30 mins |
| Remove FeedCard duplication | ~15 mins |
| Remove hardcoded values | ~30 mins |
| Update/write tests | ~2 hours |
| Update `theme.css` scaffold template comments | ~30 mins |
| Documentation (Starlight) | ~1 hour |
| **Total** | **~9 hours** |

---

## 5. Validation Plan

### 5.1 Visual Regression

After migration, the application must look **identical** to the current
state. The change is structural (cascade positioning), not visual. Specific
checks:

- [ ] All 8 pages render identically with no framework CSS applied from
      `theme.css`
- [ ] Token overrides in `theme.css` `:root {}` still work (Levels 1–3)
- [ ] Class overrides in `theme.css` now work **without `!important`**
      (Level 4 — currently broken)
- [ ] Dynamically-created FeedCard elements are styled correctly
- [ ] Dark mode overrides (if any consumer applies them) work correctly
- [ ] Existing E2E tests pass without modification

### 5.2 Specificity Verification

Add a test that confirms the cascade order:

1. Framework layered styles define `.crss-feed-card { background: white }`
2. Consumer un-layered styles define `.crss-feed-card { background: red }`
3. Assert that the computed style is `red`

### 5.3 Token Coverage Audit

After migration, verify that every `--crss-comp-*` token defined in
`components.css` is consumed by at least one component style rule. No
dead tokens should remain.

---

## 6. Impact on Consumer Projects

### 6.1 What Consumers Gain

- **Class-level overrides work** — `.crss-feed-card { border-radius: 0 }` in
  `theme.css` now applies without `!important`
- **Tier 3 tokens become functional** — `--crss-comp-card-bg: #1a1a2e`
  actually changes the card background
- **Consistent cascade behaviour** — all components follow the same
  specificity rules as BaseLayout's header/nav
- **CSS-first customisation** — developers can substantially restyle the
  application through `theme.css` alone, before needing to modify page
  layouts or component wrappers

### 6.2 What Consumers Must Change

**Nothing.** This is a non-breaking fix. Existing token overrides continue
to work. Class overrides that were previously silently ignored will now
apply. Consumers who used `!important` as a workaround can safely remove
it (but it will continue to work if left in place).

### 6.3 Updated theme.css Scaffold

The `theme.css` scaffold template should be updated to include Level 4
override examples:

```css
/* ─── Class-Level Overrides ─────────────────────────── */
/* Override entire rulesets for fine-grained control.     */
/* No !important needed — consumer styles always win.     */
/*                                                        */
/* .crss-feed-card { border-radius: 0; }                 */
/* .crss-header { position: sticky; top: 0; z-index: 10; } */
/* .crss-btn--primary { text-transform: uppercase; }     */
```

---

## 7. Relationship to Existing Architecture

### 7.1 Cascade Layer System (0.5.0)

This change **completes** the cascade layer architecture introduced in 0.5.0.
The layer order remains:

```
crss-reset < crss-tokens < crss-base < crss-components < crss-utilities < (un-layered consumer CSS)
```

Currently, only BaseLayout's styles sit in `crss-components`. After this
change, **all** framework component styles sit in `crss-components`, making
the entire layer system functional as designed.

### 7.2 Three-Tier Token System (0.5.0)

This change **activates Tier 3** of the token system. Currently, Tier 3
tokens are defined but disconnected from components. After this change,
overriding `--crss-comp-card-bg` actually changes the card background,
as advertised by the scaffold comments and documentation.

### 7.3 Proxy Component Pattern

The proxy component pattern (thin wrappers in consumer projects that import
core components) is unaffected. Consumer wrappers can continue to add their
own `<style>` blocks for additional styling; those styles are un-layered and
will win over the framework's layered defaults.

---

## 8. Decision Required

**Recommendation**: Implement this as part of the next release. It is a
non-breaking fix that completes two architectural systems (cascade layers
and Tier 3 tokens) that were designed in 0.5.0 but only partially
implemented. The effort is moderate (~9 hours) and the benefit is
significant — CSS becomes the primary, frictionless customisation path
as originally intended.

**Alternative considered**: Adding `scopedStyleStrategy: "class"` to Astro
config, which changes compiled selectors from `.foo[data-astro-cid-*]` to
`.foo:where(.astro-abc123)`. The `:where()` pseudo-class has zero
specificity, so consumer `.foo` selectors would win. However, this:
- Only fixes the specificity gap, not the `@layer` gap
- Does not wire up Tier 3 tokens
- Does not remove FeedCard duplication
- Is a consumer-side config change, not a framework-side fix
- Requires consumers to set it in their `astro.config.mjs`

The `<style is:global>` + `@layer` approach is superior because it fixes
all three gaps (specificity, layers, tokens) from the framework side, with
zero consumer configuration needed.

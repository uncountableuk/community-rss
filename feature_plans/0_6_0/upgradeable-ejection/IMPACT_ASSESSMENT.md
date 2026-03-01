# Upgradeable Component Ejection — Impact Assessment

## Summary

Replace the current "full copy" / "thin proxy" ejection model with the
**Proxy Ejection Pattern** described in the
[Upgradable Component Ejection Guide](../Upgradable%20Component%20Ejection%20Guide.md).
Every ejectable artefact (component, layout, page) becomes a wrapper
around the core version, using Astro **named slots with fallback
content** as the override mechanism. Developers uncomment only the slots
they want to customise — everything else continues to receive framework
updates via `npm update`.

**Scope:** This assessment covers changes to:

1. Core component/layout/page slot architecture
2. Eject CLI command (proxy generator, re-eject, `upgrade`, `all`)
3. Existing tests and new test requirements
4. Documentation (Starlight, signpost READMEs, AI guidance)
5. Developer migration from existing 0.6.0-beta ejections

---

## Motivation

The current ejection model has two modes that both fall short of the
ideal DX:

| Current Mode | Problem |
|---|---|
| **Component proxy** (`<CoreX {...props}><slot /></CoreX>`) | No hook points — developer can only inject children, not replace header/footer/structural sections |
| **Page full copy** (file copy with import rewriting) | Developer owns 100% of the markup — cut off from all future page improvements, even sections they haven't touched |

The Proxy Ejection Pattern solves both by:

- Wrapping every ejectable artefact in a proxy that imports the core version
- Core components expose **named slots with fallback content** at every
  meaningful structural section
- Ejected proxies ship with all slot overrides **commented out** — the
  component renders identically to pre-ejection
- Developers uncomment only what they need to customise
- Re-ejection refreshes the commented-out slot stubs without touching
  developer-uncommented content

---

## Architecture Design

### Slot Categories

Every ejectable component exposes up to four categories of slot:

| Category | Naming Convention | Purpose |
|---|---|---|
| **Structural named slots** | `header`, `footer`, `actions`, `body`, `content` | Replace a major visual section of the component |
| **Extension named slots** | `below-header`, `above-footer` | Inject new content at defined hook points without replacing anything |
| **Generic wrapper slots** | `before-unnamed-slot`, `after-unnamed-slot` | Wrap around the default `<slot />` on every ejectable component — allows injection before/after the main content area |
| **Default (unnamed) slot** | `<slot />` | The component's primary content area (unchanged from current behaviour) |

#### Slot Fallback Rule

Every named slot in a core component **must** contain fallback content
(the current default markup). When the ejected proxy doesn't provide
content for a slot, Astro renders the fallback — producing identical
output to pre-ejection.

```astro
<!-- Core component example -->
<header class="crss-header">
  <slot name="header">
    <!-- FALLBACK: default header renders when no override provided -->
    <nav class="crss-nav">
      <a href="/" class="crss-nav-brand">Community RSS</a>
      <AuthButton server:defer>
        <div slot="fallback" class="crss-auth-skeleton" aria-hidden="true" />
      </AuthButton>
    </nav>
  </slot>
</header>
```

#### Eliminating `hasHeaderSlot` / `hasFooterSlot`

The current `BaseLayout` uses `Astro.slots.has('header')` to
conditionally render content. This is **fundamentally incompatible**
with the proxy pattern (Bug Fix 5 in the implementation plan — slot
forwarding triggers `has()` even when empty).

The solution is to **remove all `Astro.slots.has()` checks** and use
slot fallback content exclusively. If a developer wants to hide a
section entirely, they provide an empty `<Fragment slot="header" />`
in their proxy.

### Page Architecture Change

Pages shift from the current "full copy" model to "proxy wrapper with
a super-slot." Each core page exposes a single named `content` slot
wrapping the entire `<main>` block. The ejected proxy imports the core
page component and renders it, with the `content` slot commented out:

```astro
<!-- Core page: src/pages/auth/signin.astro -->
<BaseLayout title="Sign In">
  <slot name="content">
    <!-- FALLBACK: entire default page content -->
    <main class="crss-signin-page">
      <div class="crss-signin-container">
        <h1 class="crss-signin-title">Sign In</h1>
        <p class="crss-signin-subtitle">...</p>
        <MagicLinkForm />
      </div>
    </main>
  </slot>
</BaseLayout>
```

```astro
<!-- Ejected proxy: developer's src/pages/auth/signin.astro -->
---
import CoreSignin from '@community-rss/core/pages/auth/signin.astro';
const props = Astro.props;
---
<CoreSignin {...props}>

  {/* =========================================
    SLOT: content
    Uncomment to replace the entire page content.
    The core page's default <main> block will be hidden.
    =========================================
  */}

  {/* <Fragment slot="content">
    <main class="crss-signin-page">
      <h1>My Custom Sign In</h1>
      <MagicLinkForm />
    </main>
  </Fragment> */}

  {/* =========================================
    SLOT: before-unnamed-slot
    Content injected before the page's main area
    =========================================
  */}

  {/* <Fragment slot="before-unnamed-slot">
  </Fragment> */}

  {/* =========================================
    SLOT: after-unnamed-slot
    Content injected after the page's main area
    =========================================
  */}

  {/* <Fragment slot="after-unnamed-slot">
  </Fragment> */}

</CoreSignin>

<style>
  /* Add your page-specific styles here */
</style>
```

This means pages remain fully upgradeable while still giving developers
the option to completely replace the content when needed.

---

## Component Slot Audit

### Slot Decision Criteria

- **Natural slots**: Component has clear structural sections
  (header/body/footer, form/confirmation, etc.) → add named slots
- **Generic wrappers only**: Component is a flat/atomic element with
  no meaningful sub-sections → add `before-unnamed-slot` /
  `after-unnamed-slot` only

### BaseLayout

| Slot | Type | Content (fallback) |
|---|---|---|
| `head` | Structural | (empty — developer `<meta>` / `<link>` tags) |
| `header` | Structural | Default `<header>` with nav + AuthButton |
| `below-header` | Extension | (empty — new hook point) |
| `before-unnamed-slot` | Generic wrapper | (empty) |
| _(default)_ | Default | Page content |
| `after-unnamed-slot` | Generic wrapper | (empty) |
| `footer` | Structural | Default `<footer>` (currently empty fallback — renders nothing by default) |

**Changes required:**
- Remove `hasHeaderSlot` / `hasFooterSlot` boolean checks
- Wrap default header in `<slot name="header">...</slot>`
- Wrap default footer content in `<slot name="footer">...</slot>`
  (with a minimal default or empty fallback)
- Add `<slot name="below-header" />` between header and default slot
- Add `<slot name="before-unnamed-slot" />` and
  `<slot name="after-unnamed-slot" />` around `<slot />`

**Ejected proxy additional imports:** `AuthButton` (referenced in
commented-out header slot placeholder content)

### AuthButton

| Slot | Type | Content (fallback) |
|---|---|---|
| `before-unnamed-slot` | Generic wrapper | (empty) |
| _(default)_ | Default | Auth state button |
| `after-unnamed-slot` | Generic wrapper | (empty) |

**Structural slots:** None — this is an atomic component. The
authenticated/unauthenticated states are driven by server-side logic
in the frontmatter. No meaningful visual sections to split.

**Changes required:** Add generic wrapper slots only.

### FeedCard

| Slot | Type | Content (fallback) |
|---|---|---|
| `before-unnamed-slot` | Generic wrapper | (empty) |
| _(default)_ | Default | Article card content |
| `after-unnamed-slot` | Generic wrapper | (empty) |

**Structural slots:** None. FeedCard is a single `<article>` element
with tightly coupled internal structure (header/title/summary/footer
all inside a single `<a>` tag for click behaviour). Splitting into
named slots would break the link wrapping and event delegation.

**Changes required:** Add generic wrapper slots only.

### FeedGrid

| Slot | Type | Content (fallback) |
|---|---|---|
| `before-unnamed-slot` | Generic wrapper | (empty) |
| _(default)_ | Default | Grid of FeedCards |
| `after-unnamed-slot` | Generic wrapper | (empty) |

**Structural slots:** None — flat grid container. Content is
dynamically rendered from props.

**Changes required:** Add generic wrapper slots only.

### TabBar

| Slot | Type | Content (fallback) |
|---|---|---|
| `before-unnamed-slot` | Generic wrapper | (empty) |
| _(default)_ | Default | Tab buttons |
| `after-unnamed-slot` | Generic wrapper | (empty) |

**Structural slots:** None — flat `<nav>` with buttons rendered
from props. No meaningful sub-sections.

**Changes required:** Add generic wrapper slots only.

### ArticleModal

| Slot | Type | Content (fallback) |
|---|---|---|
| `header` | Structural | Modal header (meta info + close button) |
| `body` | Structural | Article title + content |
| `footer` | Structural | Original link + prev/next nav |
| `before-unnamed-slot` | Generic wrapper | (empty) |
| _(default)_ | Default | (unused in practice — all content in named slots) |
| `after-unnamed-slot` | Generic wrapper | (empty) |

**Changes required:**
- Wrap header section in `<slot name="header">...</slot>`
- Wrap body section in `<slot name="body">...</slot>`
- Wrap footer section in `<slot name="footer">...</slot>`
- Add generic wrapper slots

### MagicLinkForm

| Slot | Type | Content (fallback) |
|---|---|---|
| `before-unnamed-slot` | Generic wrapper | (empty) |
| _(default)_ | Default | Email form |
| `after-unnamed-slot` | Generic wrapper | (empty) |

**Structural slots:** None. The form is a single semantic unit. The
client-side `<script>` relies on specific element IDs — splitting
into slots would break the JavaScript event wiring.

**Changes required:** Add generic wrapper slots only.

### SignUpForm

| Slot | Type | Content (fallback) |
|---|---|---|
| `form` | Structural | The sign-up form (email, name, terms, submit) |
| `confirmation` | Structural | Post-submission confirmation panel |
| `before-unnamed-slot` | Generic wrapper | (empty) |
| _(default)_ | Default | (unused — form + confirmation are the content) |
| `after-unnamed-slot` | Generic wrapper | (empty) |

**Changes required:**
- Wrap the `<form>` in `<slot name="form">...</slot>`
- Wrap the confirmation `<div>` in `<slot name="confirmation">...</slot>`
- Add generic wrapper slots

**Caveat:** The `<script>` block references specific IDs in the form
and confirmation panel. If a developer overrides the `form` slot, they
must re-implement the same element IDs for the script to work, or
provide their own script. This should be documented prominently in
the ejected proxy's comments.

### ConsentModal

| Slot | Type | Content (fallback) |
|---|---|---|
| `before-unnamed-slot` | Generic wrapper | (empty) |
| _(default)_ | Default | Modal overlay + dialog |
| `after-unnamed-slot` | Generic wrapper | (empty) |

**Structural slots:** None. The consent modal is a single dialog
with tightly coupled JavaScript (accept/decline handlers, guest
session creation). Splitting into slots would break the event wiring.

**Changes required:** Add generic wrapper slots only.

### HomepageCTA

| Slot | Type | Content (fallback) |
|---|---|---|
| `before-unnamed-slot` | Generic wrapper | (empty) |
| _(default)_ | Default | CTA banner |
| `after-unnamed-slot` | Generic wrapper | (empty) |

**Structural slots:** None. This is an atomic server island with
auth-dependent conditional rendering. The entire component either
shows or doesn't based on session state.

**Changes required:** Add generic wrapper slots only.

### Page Slot Audit

All 8 pages follow the same pattern: they use `BaseLayout` as their
wrapper and render a `<main>` block as their content. Under the new
model, each core page wraps its `<main>` in a `<slot name="content">`
with the current content as fallback.

| Page | Slot: `content` | Additional Named Slots | Imports Needed in Proxy |
|---|---|---|---|
| `index` | `<main class="crss-homepage">` with TabBar, FeedGrid, HomepageCTA | None | TabBar, FeedGrid, HomepageCTA |
| `profile` | `<main class="crss-profile-page">` with profile card | None | (none) |
| `terms` | `<main class="crss-terms-page">` with placeholder terms | None | (none) |
| `article/[id]` | `<main class="crss-article-page">` with article display | None | (none) |
| `auth/signin` | `<main class="crss-signin-page">` with MagicLinkForm | None | MagicLinkForm |
| `auth/signup` | `<main class="crss-signup-page">` with SignUpForm | None | SignUpForm |
| `auth/verify` | `<main class="crss-verify-page">` | None | (none) |
| `auth/verify-email-change` | `<main class="crss-verify-page">` | None | (none) |

**All pages also get:** `before-unnamed-slot` and `after-unnamed-slot`
generic wrapper slots.

---

## Eject CLI Changes

### Current Behaviour

| Target | Action |
|---|---|
| `components/<name>` | Generate thin proxy: `<CoreX {...props}><slot /></CoreX>` |
| `layouts/<name>` | Generate proxy with `head` slot forwarding only |
| `pages/<name>` | Full file copy with import rewriting |
| `actions` | Copy scaffold template |

### New Behaviour

#### 1. Fresh Eject (component/layout/page not already ejected)

Generate a proxy wrapper with **all available named slots as
commented-out `<Fragment>` blocks**, plus the generic wrapper slots.
Each commented block includes:

- A header comment explaining the slot's purpose
- Placeholder content showing `{props.xxx}` access where relevant
- Any additional imports the developer would need (commented out in
  the frontmatter)

**Example — ejecting `layouts/BaseLayout`:**

```astro
---
/**
 * BaseLayout proxy wrapper.
 * Wraps the core BaseLayout to allow slot-based customisation.
 * Uncomment any slot below to override that section.
 *
 * @since 0.6.0
 */
import CoreBaseLayout from '@community-rss/core/layouts/BaseLayout.astro';
// import AuthButton from '@community-rss/core/components/AuthButton.astro';

const props = Astro.props;
---

<CoreBaseLayout {...props}>

  {/* =========================================
    SLOT: head
    Add custom <meta>, <link>, or <script> tags to <head>
    =========================================
  */}

  {/* <Fragment slot="head">
    <meta name="custom" content="value" />
  </Fragment> */}

  {/* =========================================
    SLOT: header
    Replace the default header/nav bar.
    Import AuthButton above if you want it in your custom header.
    =========================================
  */}

  {/* <Fragment slot="header">
    <header class="crss-header">
      <nav class="crss-nav">
        <a href="/" class="crss-nav-brand">Community RSS</a>
        <AuthButton server:defer>
          <div slot="fallback" class="crss-auth-skeleton" aria-hidden="true" />
        </AuthButton>
      </nav>
    </header>
  </Fragment> */}

  {/* =========================================
    SLOT: below-header
    Inject content between the header and the main page content.
    Useful for banners, announcements, or breadcrumbs.
    =========================================
  */}

  {/* <Fragment slot="below-header">
  </Fragment> */}

  {/* =========================================
    SLOT: before-unnamed-slot
    Content injected before the main content area.
    =========================================
  */}

  {/* <Fragment slot="before-unnamed-slot">
  </Fragment> */}

  <slot />

  {/* =========================================
    SLOT: after-unnamed-slot
    Content injected after the main content area.
    =========================================
  */}

  {/* <Fragment slot="after-unnamed-slot">
  </Fragment> */}

  {/* =========================================
    SLOT: footer
    Replace the default footer.
    =========================================
  */}

  {/* <Fragment slot="footer">
    <p>&copy; 2026 My Community</p>
  </Fragment> */}

</CoreBaseLayout>

<style>
  /* Add your custom styles here */
</style>
```

#### 2. Re-eject (component/layout/page already exists locally)

When the target file already exists **and `--force` is not used**, the
CLI performs a **slot refresh** rather than a full overwrite:

1. Parse the existing file to find:
   - All `{/* ... */}` comment blocks (identified by the
     `SLOT: <name>` header pattern)
   - All uncommented content (developer customisations)
   - The frontmatter (imports, props)
2. Delete all existing commented-out slot blocks
3. Re-inject fresh commented-out slot blocks from the current core
   version (may include new slots added since last ejection)
4. Preserve all uncommented developer content in place
5. Update commented-out imports in frontmatter if new slots require
   new imports

**Merge strategy:**
- Uncommented `<Fragment slot="xxx">` blocks are developer content →
  **preserved exactly as-is**
- `{/* <Fragment slot="xxx"> ... */}` blocks are scaffold content →
  **deleted and replaced with fresh versions**
- The `<slot />` element and any developer content between slot blocks
  are **preserved**
- If a new slot appears that didn't exist in the previous ejection,
  its commented block is added at the correct position

**CLI output:**

```
  @community-rss/core — Re-ejecting layouts/BaseLayout...

  ✔ Refreshed slot stubs in src/layouts/BaseLayout.astro
    ↳ Preserved 2 active slot overrides (header, below-header)
    ↳ Refreshed 4 commented slot stubs
    ↳ NEW slot available: after-unnamed-slot (added in 0.7.0)

  Your customisations are preserved. Review the new slot stubs
  to see if any new override points are useful.
```

#### 3. `eject upgrade` — Batch re-eject all existing ejections

Loops through all files in the developer's `src/components/`,
`src/layouts/`, and `src/pages/` directories. For each file that
matches a known ejectable target (by filename), performs the re-eject
described above.

```bash
npx crss eject upgrade
```

**CLI output:**

```
  @community-rss/core — Upgrading all ejected files...

  ✔ Refreshed src/layouts/BaseLayout.astro (2 active, 4 stubs)
  ✔ Refreshed src/components/FeedCard.astro (0 active, 3 stubs)
  SKIP src/pages/profile.astro (no changes — already up to date)

  3 files processed, 2 refreshed, 1 up to date.
```

#### 4. `eject all` — Eject everything

Ejects every known ejectable target. For each artefact, if it doesn't
exist locally, performs a fresh eject. If it already exists, performs
a re-eject (slot refresh).

```bash
npx crss eject all
```

This is equivalent to running `eject` individually for:
- All 9 components
- All 1 layout (BaseLayout)
- All 8 pages
- Actions

---

## Files to Modify

### Core Components (add named slots + generic wrapper slots)

| File | Changes |
|---|---|
| `src/layouts/BaseLayout.astro` | Remove `hasHeaderSlot`/`hasFooterSlot`; wrap header in `<slot name="header">`, footer in `<slot name="footer">`; add `below-header`, `before-unnamed-slot`, `after-unnamed-slot` slots |
| `src/components/ArticleModal.astro` | Wrap header/body/footer sections in named slots; add generic wrapper slots |
| `src/components/SignUpForm.astro` | Wrap form in `<slot name="form">`, confirmation in `<slot name="confirmation">`; add generic wrapper slots |
| `src/components/AuthButton.astro` | Add generic wrapper slots (`before-unnamed-slot`, `after-unnamed-slot`) |
| `src/components/FeedCard.astro` | Add generic wrapper slots |
| `src/components/FeedGrid.astro` | Add generic wrapper slots |
| `src/components/TabBar.astro` | Add generic wrapper slots |
| `src/components/MagicLinkForm.astro` | Add generic wrapper slots |
| `src/components/ConsentModal.astro` | Add generic wrapper slots |
| `src/components/HomepageCTA.astro` | Add generic wrapper slots |

### Core Pages (add `content` super-slot + generic wrapper slots)

| File | Changes |
|---|---|
| `src/pages/index.astro` | Wrap `<main>` in `<slot name="content">`; add generic wrapper slots |
| `src/pages/profile.astro` | Same |
| `src/pages/terms.astro` | Same |
| `src/pages/article/[id].astro` | Same |
| `src/pages/auth/signin.astro` | Same |
| `src/pages/auth/signup.astro` | Same |
| `src/pages/auth/verify.astro` | Same |
| `src/pages/auth/verify-email-change.astro` | Same |

### Eject CLI

| File | Changes |
|---|---|
| `src/cli/eject.mjs` | Complete rewrite of `generateComponentProxy()`, `generateLayoutProxy()`, new `generatePageProxy()`. Add re-eject logic (parse existing file, preserve uncommented content, refresh comment blocks). Add `upgrade` and `all` subcommands. Expand slot registry per-component (defines which named slots each component supports, with fallback content). |
| `src/cli/bin.mjs` | Route `eject upgrade` and `eject all` subcommands |

### CLI Templates (removed / replaced)

| File | Change |
|---|---|
| `src/cli/templates/pages/*.astro` | **May be removable** — pages are now injected by the integration, and eject generates proxies by importing the core page. CLI templates for pages become proxy generators rather than file copies. |

### Package Exports

| File | Changes |
|---|---|
| `package.json` | Ensure `"./pages/*": "./src/pages/*"` export exists (already added in Phase 4). Verify all component and layout exports are accessible for proxy imports. |

---

## Files to Create

| File | Purpose |
|---|---|
| `src/cli/slot-registry.mjs` | Central registry defining available slots per ejectable artefact: slot names, types, fallback content snippets, required imports. Used by the proxy generator and re-eject logic. |

---

## Eject CLI — Detailed Implementation

### Slot Registry Structure

```javascript
// src/cli/slot-registry.mjs
export const SLOT_REGISTRY = {
  'layouts/BaseLayout': {
    import: '@community-rss/core/layouts/BaseLayout.astro',
    coreAlias: 'CoreBaseLayout',
    additionalImports: [
      { name: 'AuthButton', from: '@community-rss/core/components/AuthButton.astro', usedBy: 'header' },
    ],
    slots: [
      {
        name: 'head',
        type: 'structural',
        description: 'Add custom <meta>, <link>, or <script> tags to <head>',
        placeholder: '<meta name="custom" content="value" />',
      },
      {
        name: 'header',
        type: 'structural',
        description: 'Replace the default header/nav bar.\nImport AuthButton above if you want it in your custom header.',
        placeholder: `<header class="crss-header">
      <nav class="crss-nav">
        <a href="/" class="crss-nav-brand">Community RSS</a>
        <AuthButton server:defer>
          <div slot="fallback" class="crss-auth-skeleton" aria-hidden="true" />
        </AuthButton>
      </nav>
    </header>`,
      },
      {
        name: 'below-header',
        type: 'extension',
        description: 'Inject content between header and main content.\nUseful for banners, announcements, or breadcrumbs.',
        placeholder: '',
      },
      // ... before-unnamed-slot, after-unnamed-slot, footer
    ],
    hasDefaultSlot: true, // renders <slot /> for page content passthrough
  },
  // ... all other components, layouts, pages
};
```

### Re-eject Parser

The re-eject parser works on the text level (no AST needed):

1. **Identify commented slot blocks** using the pattern:
   ```
   {/* =========
     SLOT: <name>
     ...
   */}
   
   {/* <Fragment slot="<name>">
     ...
   </Fragment> */}
   ```
2. **Identify uncommented slot overrides**: `<Fragment slot="<name>">`
   without surrounding `{/* */}`
3. **Identify other developer content**: anything between slot blocks
   that isn't a recognized slot pattern
4. **Rebuild the file**: frontmatter → opening tag → (for each slot
   in registry order: if developer has uncommented override → emit it;
   else → emit fresh commented block) → `<slot />` → closing tag →
   style block

### Upgrade & All Commands

```javascript
// In eject.mjs
function ejectUpgrade({ cwd, force }) {
  const projectRoot = findProjectRoot(cwd);
  const results = { refreshed: [], skipped: [], errors: [] };

  // Scan for existing ejected files
  for (const [target, config] of Object.entries(SLOT_REGISTRY)) {
    const localPath = `src/${target}.astro`;
    if (existsSync(join(projectRoot, localPath))) {
      try {
        const result = eject({ target, cwd, force: true /* re-eject mode */ });
        results.refreshed.push(localPath);
      } catch (err) {
        results.errors.push({ file: localPath, error: err.message });
      }
    }
  }
  return results;
}

function ejectAll({ cwd, force }) {
  const results = { created: [], refreshed: [], skipped: [], errors: [] };
  for (const target of Object.keys(SLOT_REGISTRY)) {
    // Fresh eject or re-eject as appropriate
    eject({ target, cwd, force });
  }
  // Also eject actions
  eject({ target: 'actions', cwd, force });
  return results;
}
```

---

## Risks & Constraints

### R1: Astro Named Slot Detection is Declaration-Based

**Risk:** As discovered in Bug Fix 5, `Astro.slots.has('header')`
returns `true` when a `<slot name="header" slot="header" />` is
forwarded from a proxy, even if no content fills it.

**Mitigation:** This is the entire reason for the architecture change.
By moving to slot fallback content (instead of `Astro.slots.has()`
conditionals), the problem disappears. The core component always
renders fallback content unless the proxy explicitly provides slot
content.

**Status:** Fully addressed by this design.

### R2: Script-Dependent Components May Break with Slot Overrides

**Risk:** Components with `<script>` blocks that reference specific
element IDs (MagicLinkForm, SignUpForm, ConsentModal, ArticleModal)
will break if a developer overrides a named slot without preserving
the expected DOM structure.

**Mitigation:**
- Document prominently in each ejected proxy comment: "This
  component's JavaScript requires elements with IDs `crss-xxx`. If
  you override this slot, preserve these IDs or provide your own
  script."
- For script-heavy components (MagicLinkForm, SignUpForm,
  ConsentModal), only provide generic wrapper slots (no structural
  named slots), reducing the risk of accidentally breaking the JS.
- ArticleModal gets structural slots because its sections are visually
  distinct and the JS primarily operates on the overlay container, not
  individual sections.

### R3: Re-eject Parser May Misidentify Blocks

**Risk:** The text-based parser for re-ejection could incorrectly
identify developer content as a commented slot block, or vice versa.

**Mitigation:**
- Use a distinctive marker pattern:
  `{/* =========` + `SLOT: <name>` + `========= */}` that is unlikely
  to appear in developer code
- The parser operates on the `SLOT: <name>` header as the primary
  identifier — not on generic comment patterns
- Include comprehensive test cases for edge cases (developer comments
  that look like slot blocks, nested comments, etc.)

### R4: Page Proxy Model Requires Pages to Be Components

**Risk:** Core pages currently import `BaseLayout` and render content
directly. To support the proxy pattern, pages must become "componentised"
— they need to accept children/slots so a proxy can wrap them.

**Mitigation:** Each core page will be refactored to wrap its `<main>`
content in a `<slot name="content">` with the current markup as
fallback. The page's `<script>` and `<style>` blocks remain part of
the core page. The proxy imports the entire core page and can override
the `content` slot if needed.

**Astro constraint check:** Astro pages ARE valid components — they
can be imported and rendered by other `.astro` files. The `<slot>`
mechanism works identically in pages and components. This has been
verified in the Astro documentation and is used by Astro's own layout
system.

### R5: Increased Core Component Complexity

**Risk:** Adding 2-5 slots per component increases the HTML surface
area and makes core components harder to read.

**Mitigation:**
- Named slots with fallback content are a standard Astro pattern
- Comment each slot clearly in the core source
- The fallback content IS the original markup — no duplication
- Components that don't benefit from structural slots only get the
  two generic wrapper slots (minimal addition)

### R6: Backward Compatibility with Existing Ejections

**Risk:** Developers who ejected under the current (pre-upgrade)
model have proxies that don't follow the new slot pattern. The
re-eject command needs to handle these gracefully.

**Mitigation:**
- If an existing ejected file has no recognizable `SLOT: <name>`
  markers, the re-eject treats the entire file content (between
  opening/closing core component tags) as developer content
- The fresh slot stubs are injected around the existing content
- A warning is printed: "Legacy proxy detected — slot stubs added.
  Review and reorganize your content into named slots if desired."

---

## Testing Requirements

### New Tests

| Test File | Tests |
|---|---|
| `test/cli/eject-proxy.test.ts` | Fresh eject generates correct proxy for each component type (component/layout/page). Verify: correct import, all expected slot blocks present as comments, `<slot />` present, correct additional imports commented out, generic wrapper slots present. |
| `test/cli/eject-reejection.test.ts` | Re-eject preserves uncommented developer content. Re-eject removes old comment blocks and adds fresh ones. Re-eject adds new slots that didn't exist before. Re-eject handles legacy (pre-slot) proxies. |
| `test/cli/eject-upgrade.test.ts` | `upgrade` command finds all ejected files. `upgrade` skips non-ejected files. `upgrade` reports results correctly. |
| `test/cli/eject-all.test.ts` | `all` command ejects every known target. `all` re-ejects already-ejected targets. |
| `test/cli/slot-registry.test.ts` | Registry contains entries for all ejectable targets. Each entry has valid import paths. Slot names are unique per component. Every slot has a description. |
| `test/components/slot-fallback.test.ts` | Verify that core components render identically with and without a proxy wrapper (when no slots are provided). Test each component that has named slots. |
| `test/integration/page-proxy.test.ts` | Verify that a page proxy (importing core page) renders the same output as the core page directly. |

### Updated Tests

| Test File | Changes |
|---|---|
| `test/cli/eject.test.ts` | Update all proxy content assertions to check for commented slot blocks, generic wrapper slots, and new proxy format. Update layout proxy test to verify `header`/`footer` slot stubs are present (as comments). Update page eject tests to verify proxy format instead of file copy. |
| `test/styles/css-architecture.test.ts` | May need updates if slot wrapper elements add new DOM structure. |

### Test Approach

- **Proxy generation tests** use temp directories (same pattern as
  existing eject tests) — write to tempdir via `eject()`, read back
  file content, assert on string patterns
- **Re-eject tests** pre-seed a tempdir with a modified proxy file
  (uncommented slots + commented slots), run re-eject, verify merge
- **Slot fallback tests** can use Astro's Container API or string
  rendering to verify HTML output matches expectations
- **Coverage target**: maintain ≥80% across all metrics

---

## Documentation Updates

### Starlight Docs

| Page | Changes |
|---|---|
| `guides/customisation.md` | Rewrite the "Eject & Edit" section to explain the proxy slot pattern. Add examples of fresh eject, slot uncommenting, re-ejection. Add "Best Practices" subsection (uncomment only what you need, empty Fragment to hide sections, etc.). |
| `guides/styling.md` | Add note that ejected proxy `<style>` blocks are developer-owned and won't be overwritten by re-ejection. |
| `api-reference/cli.md` | Document `eject upgrade` and `eject all` commands. Update proxy format examples. Document re-eject behaviour. Add slot registry reference (which components have which slots). |
| `api-reference/css-tokens.md` | No changes needed. |

### Signpost READMEs

| File | Changes |
|---|---|
| `templates/pages/README.md` | Update examples to show page proxy pattern (not file copy). Mention `content` super-slot. |
| `templates/components/README.md` | Update examples to show named slot proxy pattern (not thin wrapper). List available slots per component. |
| `templates/layouts/README.md` | Update examples to show all named slots with comments. Mention `below-header` hook point. |

### AI Guidance

| File | Changes |
|---|---|
| `.github/copilot-instructions.md` | Update Proxy Component Pattern section to describe slot-based proxies. Add "Upgradeable Ejection" subsection. Update eject CLI description. |
| `.github/instructions/implementation.instructions.md` | Add "Slot Architecture" section documenting the slot categories and fallback rule. Update component standards to require generic wrapper slots on all ejectable components. |
| `templates/.github/copilot-instructions.md` | Update ejected components section to explain slot uncommenting, re-ejection, upgrade command. |
| `templates/.cursor/rules/community-rss.mdc` | Same updates as above for Cursor users. |

---

## Migration Path

### For Pre-Upgrade (Current 0.6.0-beta) Ejected Files

Developers who have already ejected under the current model will have:
- **Component proxies**: `<CoreX {...props}><slot /></CoreX>` — no
  slot comments
- **Layout proxies**: `<CoreLayout {...props}><slot name="head" slot="head" /><slot /></CoreLayout>`
- **Page copies**: Full file copies with rewritten imports

Running `eject upgrade` will:
1. Detect these as "legacy" proxies (no `SLOT:` markers)
2. Preserve all existing content as-is
3. Inject fresh commented slot blocks around the existing content
4. Print a migration hint

### For New Projects

No migration needed — `eject` generates the new slot-based proxies
from day one.

---

## Effort Estimate

| Task | Effort |
|---|---|
| Refactor core components to add named + generic slots | ~3 hours |
| Refactor core pages to add `content` super-slot + generic slots | ~2 hours |
| Create slot registry (`slot-registry.mjs`) | ~2 hours |
| Rewrite proxy generators (component/layout/page) | ~3 hours |
| Implement re-eject parser and merge logic | ~4 hours |
| Implement `upgrade` and `all` subcommands | ~1.5 hours |
| Update existing eject tests | ~2 hours |
| Write new tests (proxy gen, re-eject, upgrade, all, slots) | ~4 hours |
| Update Starlight docs (4 pages) | ~2 hours |
| Update signpost READMEs (3 files) | ~1 hour |
| Update AI guidance (4 files) | ~1.5 hours |
| Playground smoke test + bug fixes | ~2 hours |
| **Total** | **~28 hours** |

---

## Decision Summary

| Decision | Choice | Rationale |
|---|---|---|
| Named slots | Only where natural structural sections exist | Avoids forcing awkward slots on atomic components; reduces risk of breaking script-dependent components |
| Generic wrapper slots | `before-unnamed-slot` / `after-unnamed-slot` on ALL ejectable components | Universal injection points without structural commitment |
| Page ejection | Proxy wrapper with `content` super-slot | Maintains upgradeability while giving full content override when needed |
| BaseLayout | Remove `has*Slot` checks; use slot fallbacks | Fixes the fundamental proxy incompatibility (Bug Fix 5) |
| `below-header` slot | Empty extension slot on BaseLayout | Low-cost hook point for banners/breadcrumbs on every page |
| Re-eject strategy | Delete commented blocks, preserve uncommented, re-inject fresh stubs | Allows developers to pick up new slots without losing work |
| `eject upgrade` | Batch re-eject all existing ejections | One command to pick up all new slot opportunities |
| `eject all` | Eject every known target | Full ownership when desired |
| Auth-dependent components | Ejectable with slots — auth logic stays in core | Developers override visuals only; server-side logic remains maintained |
| Email templates | Excluded from this change | Already standalone; don't need the proxy wrapper pattern |

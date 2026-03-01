# Impact Assessment: Keeping `slot-registry.mjs` Up to Date

**Date:** 2026-03-01  
**Author:** GitHub Copilot  
**Status:** Approved — Architecture Rev 3 (Final)

---

## 1. Background

`packages/core/src/cli/slot-registry.mjs` is the single source of truth for
every ejectable artefact in the framework. `eject.mjs` reads it exclusively to:

- Generate proxy wrapper files for developers.
- Drive `re-eject` / merge logic (preserving active slot overrides).
- Populate CLI `--help` output (available components / layouts / pages).
- Auto-eject transitive dependencies when a page is ejected.

Because of this central role, **stale or incorrect registry entries have a
direct, user-visible consequence**: generated proxies contain wrong slots,
wrong prop types, or wrong placeholder code — breaking the developer's
customisation workflow silently.

---

## 2. What Can Go Stale?

| Change in source                          | Registry field that must change            | User impact if missed                                   |
|------------------------------------------|--------------------------------------------|----------------------------------------------------------|
| New component / layout / page added      | Entire new entry                           | `npx crss eject` fails or silently omits the artefact   |
| Slot added / renamed to a component      | `slots[]` array                            | Generated proxy has no commented block for the new slot |
| Slot removed from a component            | `slots[]` array                            | Proxy includes a block for a non-existent slot (no-op)  |
| `<slot name>` text changed               | `slots[].name`                             | Proxy passes wrong slot name — override silently ignored |
| `messages` / `labels` prop added/removed | `propsDefinition`                          | Developer's ejected interface is out of sync with core   |
| Placeholder content updated              | `slots[].placeholder`                      | Proxy comments show outdated example code               |
| `additionalImport` added/removed         | `additionalImports[]`                      | Import auto-uncomment logic breaks; proxy won't compile  |
| Component deleted                        | Entry must be removed                      | `ejectAll` tries to generate a proxy for a gone file    |

---

## 3. Current Situation

The registry is entirely hand-authored — there is no programmatic link between
the `.astro` source files and the registry entries. The copilot instructions
(`.github/copilot-instructions.md`) note it as the "single source of truth"
and list it under "Implementation Notes", but there is no enforcement.

**Current risk surface:**
- 9 components × N slots × 4 metadata fields = large manual surface area per release.
- `propsDefinition` strings duplicate the TypeScript `Props` interface already
  defined in each `.astro` frontmatter — **two sources of truth for the same
  information**.
- Placeholder content is subjective / editorial, so it *cannot* be auto-derived
  from source — but it is still easy to forget to update.
- No tests verify that registry entries match the actual component slot
  declarations.

---

## 4. Options

### Option A — Status Quo: Manual + AI Instructions

Maintainers update the registry by hand. Copilot instructions remind the AI
assistant to update both the component and the registry together.

**Pros:** Zero build infrastructure cost; editorial quality preserved;  
no coupling between build pipeline and CLI tooling.

**Cons:** Entirely discipline-dependent with no CI enforcement;
`propsDefinition` requires a double-edit every time props change; new
contributors have no automated signal when they forget.

**Verdict:** Not viable beyond a very small team. The `propsDefinition`
duplication is the most painful daily friction.

---

### Option B — Auto-Generate the Entire Registry at Build Time

A script walks source, parses `<slot name="...">` tags, and emits a generated
`slot-registry.mjs`, discarding the hand-authored file.

**Verdict:** Not viable. Slot *names* can be derived; `description`,
`placeholder`, `type`, and `additionalImports` carry editorial intent with
no ground truth in source. Full generation strips the registry of its
developer-UX value.

---

### Option C — Declarative Annotations (Recommended Architecture)

Embed structured annotations directly in the `.astro` source files so that
**the registry becomes a derived artefact**, generated at build/publish time.
Editorial metadata (descriptions, placeholder code, additional imports) lives
*once* in the source file — beside the slot it describes.

This eliminates `slot-registry.mjs` as a maintained artefact. The generator
creates it at `prepublish` time; `eject.mjs` consumes it identically to today.

#### 4.C.1 — Source Annotations

##### Module annotation (frontmatter)

Marks a file as ejectable. **Only files with this annotation can be ejected.
Files without it are treated as internal implementation details.**

```astro
---
/*
 * @eject-module
 * @alias CoreBaseLayout
 * @eject-dependency layouts/BaseLayout
 * @eject-dependency components/AuthButton
 */
import AuthButton from '../../components/AuthButton.astro';

interface Props {
  title: string;
  description?: string;
}
const { title, description } = Astro.props;
---
```

- `@eject-module` — required; marks the file as ejectable.
- `@alias` — required; the name the proxy uses for the imported core component
  (e.g. `CoreBaseLayout`).
- `@eject-dependency` — zero or more; lists artefacts that should be
  auto-ejected when this artefact is ejected (replaces `PAGE_REGISTRY.imports`).
  Paths follow the same `category/Name` convention as registry keys.

##### Slot annotation (above each ejectable named slot)

Not all slots must be ejectable. Only slots preceded by an `@eject-slot`
block are included in the generated registry and in generated proxies.

```astro
{/*
  @eject-slot
  @description Replace the default header/nav bar.
  @additionalimport1 AuthButton
  @importfrom1 @community-rss/core/components/AuthButton.astro
  @additionalimport2 SomeOtherComponent
  @importfrom2 @community-rss/core/components/SomeOtherComponent.astro
*/}
<slot name="header">
  <header class="crss-header">
    <nav class="crss-nav">
      <a href="/" class="crss-nav-brand"> Community RSS </a>
      <AuthButton server:defer>
        <div slot="fallback" class="crss-auth-skeleton" aria-hidden="true"></div>
      </AuthButton>
    </nav>
  </header>
</slot>
```

- `@eject-slot` — required; marks this slot as ejectable.
- `@description` — required; human-readable description copied verbatim into
  the proxy comment header for this slot block.
- `@additionalimportN` / `@importfromN` — paired, numbered from 1; each pair
  declares an import the developer may need if they override this slot.
  Arbitrarily many pairs are supported. All are included as live imports in
  the generated proxy's `@start-eject-import` block.
- The **default content between `<slot name="...">` and `</slot>`** is the
  placeholder — extracted verbatim and placed inside the commented
  `<Fragment>` block in the proxy.

##### Unnamed slot passthrough (automatic — no annotation required)

The generator detects the presence of an unnamed `<slot />` in the source
file. If found, it automatically inserts a bare `<slot />` inside the
generated `<CoreXxx>` wrapper in the proxy.

This is transparent and required for layouts: when a developer's page does
`<BaseLayout>page content</BaseLayout>`, the proxy is the layout from the
developer's perspective. Without a `<slot />` passthrough inside
`<CoreBaseLayout>`, the page content would be silently swallowed.

Standalone components (FeedCard, TabBar, etc.) that have no unnamed slot
receive no passthrough and do not need one.

#### 4.C.2 — Props Extraction (heuristic)

The generator extracts every non-import line from within the frontmatter `---`
block to form the `propsDefinition`. That is: the entire frontmatter minus
the `@eject-module` comment block and any line that starts with `import`
(after trimming). This gives the `interface Props { ... }` block and any
supporting type definitions, without requiring a separate `@eject-props`
annotation, and mirrors exactly what the developer needs to write their
slot override code.

#### 4.C.3 — Generated Proxy Structure

```astro
---
/**
 * BaseLayout proxy wrapper — developer-owned wrapper around
 * the core BaseLayout layout.
 *
 * Uncomment any slot below to override that section.
 * The core layout handles all logic.
 */
/*
 * @start-eject-import
 */
import CoreBaseLayout from '@community-rss/core/layouts/BaseLayout.astro';
import AuthButton from '@community-rss/core/components/AuthButton.astro';

interface Props {
  title: string;
  description?: string;
}

const props = Astro.props;
/*
 * @end-eject-import
 */
---

<CoreBaseLayout {...props}>
  {/*
    Replace the default header/nav bar.

    <Fragment slot="header">
      <header class="crss-header">
        <nav class="crss-nav">
          <a href="/" class="crss-nav-brand">Community RSS</a>
          <AuthButton server:defer>
            <div slot="fallback" class="crss-auth-skeleton" aria-hidden="true" />
          </AuthButton>
        </nav>
      </header>
    </Fragment>
  */}

  <slot />

</CoreBaseLayout>

<style>
  /* Add your custom styles here */
</style>
```

Key structural properties of the proxy:
- **`@start-eject-import` / `@end-eject-import` markers** — the entire block
  between these markers is safe to regenerate on re-eject. It contains: the
  core component import, all `@additionalimportN` imports for every slot on
  the file, the extracted Props interface, and `const props = Astro.props;`.
- **Commented `<Fragment>` blocks** — each contains the `@description` text
  and the verbatim default content from between the source `<slot>` tags.
- **`<slot />`** — included automatically only if the source component has an
  unnamed slot (layouts always do; most components do not).
- **`<style>` block** — preserved across re-ejects.

#### 4.C.4 — Re-eject Behaviour (without `--force`)

When the developer runs `npx crss eject layouts/BaseLayout` again and a proxy
already exists, the generator applies the following algorithm:

1. **Regenerate the import block** — replace everything between
   `@start-eject-import` and `@end-eject-import` with a freshly generated
   block (new imports, updated Props interface, alias renames). Leave all
   developer content outside those markers untouched.

2. **Strip all existing comments from the body** — remove every
   `{/* … */}` block in the `<CoreXxx>` wrapper. This clears stale
   descriptions and outdated placeholder examples without touching any
   live code.

3. **Re-annotate each live `<Fragment>`** — for every active (uncommented)
   `<Fragment slot="name">` that still exists in the current source
   annotations, generate a fresh comment block (with the current
   `@description` and the current default slot content as the example)
   and insert it immediately *above* the fragment. The developer can
   compare their override against the updated default at a glance.

4. **Remove orphaned live fragments** — if an active `<Fragment
   slot="name">` refers to a slot that no longer appears in the source
   annotations (core removed or renamed it), remove both the fragment and
   any associated comment. The slot is inert and cannot be applied.

5. **Append new slot blocks** — for each slot that exists in the current
   source annotations but has no live fragment in the proxy, append a
   commented `<Fragment>` block at the bottom of the wrapper (after all
   live fragments).

6. **Preserve `<style>`** — the developer's `<style>` content is never
   touched.

With `--force`, the proxy is fully regenerated from scratch as a fresh
eject. No merge is attempted.

#### 4.C.5 — Elimination of `slot-registry.mjs`

`slot-registry.mjs` is **deleted entirely**. `eject.mjs` is rewritten to
parse annotations from the `.astro` source files at runtime — no
intermediate registry file is generated, committed, or shipped.

This is viable because the published npm package already ships `src/` in
full (`"files": ["index.ts", "src/"]` in `packages/core/package.json`).
All `.astro` component, layout, and page files are therefore present inside
`node_modules/@community-rss/core/src/` when the CLI runs.

`eject.mjs` gains a new `parseAnnotations(sourceFilePath)` function that:
1. Reads the `.astro` file from `__dirname`-relative paths inside the package.
2. Extracts the `@eject-module` block (alias, dependencies) from frontmatter.
3. Extracts all non-import lines from frontmatter as the props definition.
4. Finds each `@eject-slot` annotation block and the immediately following
   `<slot name="...">…</slot>`, extracting name, description, additional
   imports, and default content.
5. Detects whether an unnamed `<slot />` is present (for passthrough).

> **Important for all future work:** the `.astro` component, layout, and
> page source files **must remain in the package `files` list**. Removing
> `src/` from `files` would silently break the CLI for all consumers.
> This constraint must be noted in `copilot-instructions.md` and the
> package `README`.

---

### Option D — Drift Detection via Vitest Tests

**Rejected.** We are moving directly to Option C. There are no external
developers consuming the package at this stage and no value in building an
interim guard that will be replaced immediately. The annotation-presence
tests written as part of Option C serve the same purpose going forward.

---

## 5. Comparison Matrix

| Criterion                          | A (Status Quo) | B (Full Auto-Gen) | C (Annotations) | D (Drift Tests) |
|------------------------------------|:--------------:|:-----------------:|:---------------:|:---------------:|
| Editorial quality preserved        | ✅              | ❌                | ✅              | ✅              |
| Registry always in sync            | ❌              | ✅                | ✅              | ⚠️ (caught)    |
| No build pipeline changes          | ✅              | ❌                | ❌ (minor)      | ✅              |
| Props duplication eliminated       | ❌              | ✅                | ✅              | ❌              |
| Enforcement at CI                  | ❌              | N/A               | ✅ (tests)      | ✅              |
| Implementation effort              | None           | High              | Medium          | Low             |
| Viable pre-1.0.0                   | ✅              | ❌                | ✅              | ✅              |
| Single source of truth             | ❌              | ✅                | ✅              | ❌              |

**Selected: Option C.**

---

## 6. Adopted Path (Option C — Implemented in Phase 15)

1. Add `@eject-module` + `@eject-dependency` annotations to the frontmatter
   of all 9 components, 1 layout, and 8 page files.
2. Add `@eject-slot` blocks above all ejectable named slots, placing
   `@description` and `@additionalimportN` / `@importfromN` metadata in the
   annotation. The `<slot>` default content replaces `placeholder`.
3. Rewrite `eject.mjs` to parse annotations at runtime via a new
   `parseAnnotations()` function. Delete `slot-registry.mjs`.
4. Implement the new re-eject algorithm (§4.C.4).
5. Purge all old registry-based tests, functions, and documentation.
6. Write new annotation-validity tests.
7. Update framework-developer AI instructions to document the annotation
   contract.
8. Update (or create) consumer-developer AI instructions in the CLI
   scaffold template (`.github/` in the developer's project) covering how
   to read and customise the generated proxy.

---

## 7. Decisions Recorded

1. **`@start-eject-import` imports scope** ✅ — All `@additionalimportN`
   imports from every `@eject-slot` on the file are included as live imports.
   The conditional per-slot uncomment mechanism in `mergeSlotContent` is
   removed.

2. **`@eject-slot` type field** ✅ — Omitted from the new design. The
   `type` field (`structural` / `extension` / `generic-wrapper`) was
   documentary only and is dropped.

3. **Slots with no default content** ✅ — A self-closing `<slot name="xyz" />`
   annotated with `@eject-slot` produces a commented `<Fragment>` block with
   no example content. The `@description` provides sufficient guidance.

4. **`slot-registry.mjs`** ✅ — Deleted entirely. `eject.mjs` parses
   annotations from `.astro` source files at runtime. No generated file,
   no committed artefact, no `prepublish` step. The `src/` path in the
   package `files` list must be preserved permanently.

5. **Orphan live fragments** ✅ — Removed automatically during re-eject.
   If a developer's active `<Fragment slot="name">` refers to a slot that
   core has since removed, the fragment is deleted on re-eject without
   prompting.

6. **AI instructions split** ✅ — Two sets: framework-developer instructions
   in `.github/instructions/` (how to annotate, test ejections); consumer-
   developer instructions scaffolded into the developer's project via the
   CLI template `.github/` directory (already exists for this purpose).

---

## 8. What This Assessment Does NOT Address

- **`placeholder` content quality** — still editorial; the discipline shifts
  from "update the registry" to "write good default slot content in your
  component", which is a more natural authoring concern.
- **Slot `type` correctness** — see Open Question 2 above; recommended to drop.
- **Components that are intentionally not ejectable** — the `@eject-module`
  gate handles this; any internal component without the annotation is simply
  invisible to the CLI and to the generator.

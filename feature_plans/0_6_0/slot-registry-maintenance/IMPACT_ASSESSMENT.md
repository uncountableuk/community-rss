# Impact Assessment: Keeping `slot-registry.mjs` Up to Date

**Date:** 2026-03-01  
**Author:** GitHub Copilot  
**Status:** For Review

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

**Pros**
- Zero build infrastructure cost.
- Placeholder text and slot descriptions (editorial) are naturally hand-authored.
- No coupling between build pipeline and CLI tooling.

**Cons**
- Entirely discipline-dependent — no enforcement at commit/CI time.
- Copilot instructions are advisory; a contributor who bypasses them silently
  produces drift.
- `propsDefinition` duplicates the frontmatter Props interface, so *two* edits
  are always required for every props change.
- New contributors have no automated signal when they forget to update the
  registry.

**Verdict:** Acceptable for now but will not scale past a small number of
regular contributors. The `propsDefinition` duplication is the most painful
point day-to-day.

---

### Option B — Auto-Generate the Entire Registry at Build Time

At `build` or `prepublish`, a Node.js script walks `src/components/`,
`src/layouts/`, and `src/pages/`, parses `<slot name="...">` declarations
from each `.astro` file, and emits a generated `slot-registry.mjs`.

**Pros**
- Registry is always consistent with source; stale entries are impossible.
- No manual step for new components.

**Cons**
- **Slot names can be derived; everything else cannot.**  
  `description`, `placeholder`, `type` (`structural` / `extension`),
  `additionalImports`, and `propsDefinition` all carry editorial intent that
  is not present in the `.astro` source. Generating them would produce empty /
  useless placeholders, degrading developer UX.
- Astro frontmatter `Props` interfaces are TypeScript, embedded in
  a `---` block — re-parsing them from source is fragile and already done
  better by the TypeScript compiler.
- Forces a build step before the CLI can run, complicating local development.
- Makes the output file non-editable (or confusingly semi-editable), which
  conflicts with the editorial placeholder content that is hand-crafted to
  guide developers.

**Verdict:** Not viable in isolation. Slot *names* are the only field that can
be reliably auto-derived; the rest requires human intent. Full generation
would strip the registry of its editorial value.

---

### Option C — Co-location: Annotations Inside `.astro` Files

Add structured JSDoc-style comment blocks directly inside each `.astro`
component to annotate slot metadata (description, type, placeholder). A
lightweight extraction script reads these annotations at build time and
regenerates the registry, while the editorial content lives **once** in the
source file.

Example annotation format (in component frontmatter or above each `<slot>`):

```astro
{/*
  @slot header
  @type structural
  @description Replace the default header/nav bar.
  @placeholder
    <header class="crss-header">...</header>
*/}
<slot name="header" />
```

**Pros**
- Single source of truth: annotation lives beside the slot declaration it describes.
- Maintainer editing a slot edits the annotation at the same time — natural locality.
- `propsDefinition` duplication eliminated (extract Props type from frontmatter directly).
- Auto-generation becomes feasible because all needed data is in source.

**Cons**
- Requires annotating every slot in every component — significant upfront work
  across 9 components and 1 layout.
- Annotation format must be defined, documented, and enforced (lint rule or
  CI check needed).
- Multi-line `placeholder` blocks inside JSX comments are awkward to parse reliably.
- Adds syntactic noise to component files — components are currently clean.
- Any deviation in annotation syntax silently breaks generation.
- The extraction script becomes load-bearing build infrastructure.

**Verdict:** Architecturally sound for a mature codebase. Premature for
pre-1.0.0 where components are still evolving rapidly. Viable as a post-1.0.0
investment when the component surface area stabilises.

---

### Option D — Drift Detection via Vitest Tests (Recommended for now)

Keep the registry hand-authored (preserving editorial quality) but add a
Vitest test suite in `packages/core/test/` that **fails loudly when the
registry diverges from the source**. Specifically:

1. **Slot existence test:** For each `components/` and `layouts/` registry
   entry, parse the corresponding `.astro` file's `<slot name="...">` tags
   and assert that every named slot in source appears in the registry. Fail
   if source has a slot with no registry entry, or if a registry entry names a
   slot that does not exist in source.

2. **Component coverage test:** Assert that every `.astro` file in
   `src/components/` and `src/layouts/` has a registry entry. New components
   added without a registry entry cause an immediate CI failure.

3. **Props interface parity test:** Extract the `Props` interface from each
   `.astro` frontmatter via a lightweight regex and assert it matches the
   `propsDefinition` string in the registry. Fails loudly when a prop is
   added or removed, prompting the maintainer to update both.

4. **`PAGE_REGISTRY` coverage test:** Assert that every page route file in
   `src/pages/` (excluding API routes) has a `PAGE_REGISTRY` entry and
   a `SLOT_REGISTRY` `pages/` entry.

**Pros**
- Registry stays hand-authored — editorial quality (descriptions, placeholder
  code, slot types) is preserved.
- Zero impact on build pipeline; tests run as part of the existing
  `npm run test:run`.
- CI blocks merges that introduce drift — far stronger enforcement than
  instructions alone.
- `propsDefinition` mismatch is caught immediately rather than silently.
- Very cheap to implement: ~150–200 lines of Vitest.
- Works alongside the AI instructions — the AI helper continues to update
  both together, but misses are now caught automatically.

**Cons**
- Does not eliminate the double-edit; just catches when it is forgotten.
- Slot `description`, `type`, and `placeholder` fields are not verified (they
  are editorial and have no ground truth in source).
- Regex-based frontmatter parsing is imprecise — a proper frontmatter parser
  (`astro/dist/content/utils` or a simple `---` splitter) would be more robust.

**Verdict:** High value, low cost. Recommended as the immediate improvement
combined with maintaining the AI instruction hygiene. Closes the most likely
real-world failure modes (new component, renamed slot, props drift) without
over-engineering.

---

## 5. Comparison Matrix

| Criterion                          | A (Status Quo) | B (Full Auto-Gen) | C (Co-location) | D (Drift Tests) |
|------------------------------------|:--------------:|:-----------------:|:---------------:|:---------------:|
| Editorial quality preserved        | ✅              | ❌                | ✅              | ✅              |
| Registry always in sync            | ❌              | ✅                | ✅              | ⚠️ (caught)    |
| No build pipeline changes          | ✅              | ❌                | ❌              | ✅              |
| Props duplication eliminated       | ❌              | ✅                | ✅              | ❌              |
| Enforcement at CI                  | ❌              | N/A               | ❌ (needs lint) | ✅              |
| Implementation effort              | None           | High              | High            | Low             |
| Viable pre-1.0.0                   | ✅              | ❌                | ❌              | ✅              |

---

## 6. Recommended Path

### Immediate (now → 1.0.0)

Adopt **Option D** — add a `slot-registry.integrity.test.ts` in
`packages/core/test/cli/` covering:

- All `SLOT_REGISTRY` component/layout entries have a corresponding source file.
- All source component/layout files have a `SLOT_REGISTRY` entry.
- Every named slot in each source file appears in the registry's `slots[]` array.
- Every named slot in each registry `slots[]` array exists in the source file.
- `propsDefinition` string matches the extracted frontmatter `Props` interface.
- All `PAGE_REGISTRY` entries have a `pages/` entry in `SLOT_REGISTRY`.

Retain the AI copilot instructions as a first-pass guard. The tests are the
safety net.

### Post-1.0.0 (component surface stable)

Evaluate **Option C** once the slot/props surface stabilises. At that point
the upfront annotation effort is bounded and the tooling investment pays off
over a longer maintenance horizon. The drift tests from Option D naturally
evolve into parsing-the-annotations tests.

---

## 7. What This Assessment Does NOT Address

- **`additionalImports` verification** — these depend on which imports appear
  in placeholder code, which is fully editorial. No automated check is
  practical.
- **`placeholder` content quality** — purely editorial; no automated check.
- **Slot `type` correctness** (`structural` vs `extension`) — editorial
  classification with no machine-verifiable ground truth.

These fields are best guarded by the PR review process and the AI instructions.

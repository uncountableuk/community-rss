---
applyTo: "packages/core/src/components/**/*.astro,packages/core/src/layouts/**/*.astro,packages/core/src/pages/**/*.astro,packages/core/src/cli/eject.mjs"
---

# Eject Annotation Instructions

## Annotation-Driven Ejection System

The CLI `eject` command generates proxy wrappers from metadata annotations
embedded directly in `.astro` source files. There is no external registry
file — `eject.mjs` discovers ejectable targets by walking the filesystem
and parsing annotations at runtime via `parseAnnotations()`.

## @eject-module Annotation

Every ejectable component, layout, or page must have an `@eject-module`
comment block in the frontmatter:

```astro
---
/*
 * @eject-module
 * @alias CoreFeedCard
 * @eject-dependency components/AuthButton
 */
import AuthButton from '../components/AuthButton.astro';
---
```

### Required Fields
- `@eject-module` — Marks the file as ejectable (required)
- `@alias` — The name used for the core component in generated proxies
  (e.g., `CoreFeedCard`, `CoreBaseLayout`). Convention: `Core` + PascalCase
  component name.

### Optional Fields
- `@eject-dependency <category/name>` — Declares that ejecting a page
  should auto-eject this dependency as a proxy. Multiple entries allowed.
  Format: `components/AuthButton`, `layouts/BaseLayout`.

## @eject-slot Annotation

Every ejectable named slot must have an `@eject-slot` annotation
immediately before the `<slot>` tag:

```astro
{
  /* @eject-slot
      @description Replace the default header/nav bar.
      @additionalimport1 AuthButton
      @importfrom1 @community-rss/core/components/AuthButton.astro */
}
<slot name="header">
  <header>Default header content</header>
</slot>
```

### Required Fields
- `@eject-slot` — Marks the next `<slot>` as ejectable
- `@description` — Human-readable description of what the slot controls

### Optional Fields
- `@additionalimportN <Name>` + `@importfromN <path>` — Paired import
  declarations needed when overriding this slot. The `N` suffix must match
  between the two (e.g., `@additionalimport1` / `@importfrom1`).

## Rules

1. **Every new ejectable component/layout/page must have `@eject-module`.**
   Files without the annotation are invisible to the eject CLI.

2. **Every ejectable named slot must have `@eject-slot` + `@description`.**
   Unannotated named slots will not appear in generated proxy wrappers.

3. **Prefer block-form slots over self-closing slots** so that the
   generated proxy shows meaningful default content as examples:
   ```astro
   <!-- Good: developer sees the default implementation -->
   <slot name="header"><header>Default</header></slot>

   <!-- Acceptable for empty slots: -->
   <slot name="head" />
   ```

4. **Aim for many small, granular named slots** over few large ones.
   Each slot is an independent customization point.

5. **After modifying a component**, run `npx crss eject <target>` in
   the playground and inspect the generated proxy to verify annotation
   correctness. Check that:
   - All slots appear as commented `<Fragment>` blocks
   - Default content is present and correctly dedented
   - Import lines are included for slots with `@additionalimport`

6. **The `src/` path in `package.json` `files` must never be removed.**
   The eject CLI reads source `.astro` files from the installed package's
   `src/` directory to parse annotations at runtime.

7. **The `@eject-slot` annotation must be a JSX expression** — either
   inline `{/* @eject-slot ... */}` or multiline `{\n  /* ... */\n}`.
   The parser matches both forms.

8. **Do not hand-edit any external registry file for ejection metadata.**
   All ejection metadata comes from annotations in the source files.

## Annotation Format Reference

### Frontmatter Block
```
/*
 * @eject-module
 * @alias CoreComponentName
 * @eject-dependency category/Name
 */
```

### Slot Annotation (Inline)
```
{/* @eject-slot
    @description Human-readable description of the slot.
    @additionalimport1 ComponentName
    @importfrom1 @community-rss/core/components/ComponentName.astro */}
<slot name="slot-name">Default content</slot>
```

### Slot Annotation (Multiline JSX Expression)
```
{
  /* @eject-slot
      @description Human-readable description of the slot.
      @additionalimport1 ComponentName
      @importfrom1 @community-rss/core/components/ComponentName.astro */
}
<slot name="slot-name">Default content</slot>
```

---
title: Developer Experience Requirements
description: How the developer area gets scaffolded, customized, and configured.
sidebar:
  order: 4
---

This document outlines the operational expectations and tools presented structurally to developers and open-source consumers utilizing `@community-rss/core`.

## 1. Environment Scaffolding (The `init` Process)

The developer experience begins with the `init` process (`npx @community-rss/core init`).

- **Minimal Footprint:** A fresh `init` produces a minimal project footprint. It generates only the essential files: `astro.config.mjs`, `.env`, `theme.css`, a local `docker-compose.yml` for testing dependencies, structural `README.md` signposts in empty directories, and mandatory Action entrypoints (`src/actions/index.ts`).
- **Injected Routes:** By default, no page boilerplate is scaffolded into the developer's project workspace. The framework automatically injects all core pages (like `/`, `/profile`, `/auth/signin`) from within the package during Astro's build step.
- **Automatic Updates:** Because developers do not possess physical copies of the components or pages by default, UI and logic improvements shipped in future package updates apply automatically via `npm update` without any action or migration needed by the end developer.

## 2. Progressive Customization

Developers refine and adapt the community hub through a four-level escalating Customization Hierarchy:

1. **Tokens (CSS Variables & Classes):** A three-tier design token system (Reference → System → Component) enables sweeping stylistic shifts purely via CSS property replacement. CSS Cascade layers ensure `.crss-` prefixed default styles yield control safely to consumer `theme.css` configurations. The developer can fully reskin the app without touching logic.
2. **Page Layouts (Ejecting Routes):** Shadow a full page via `npx crss eject pages/[name]`. This breaks the automatic injection for that specific route and allows the developer to modify the layout, text, or meta tags directly.
3. **Components (Ejecting Proxies):** Shadow an internal component via `npx crss eject components/[name]`. The tool provides a "Proxy Component" wrapper that retains the internal Astro API links while allowing layout rearrangement via exposed structural slots.
4. **API & Actions:** Custom routes, overriding core Action handlers, or deeply modifying middleware variables to govern entirely bespoke business logic. Highly flexible but with the highest upgrade risk.

## 3. The `eject` Algorithm and Proxy Components

When developers need more control than CSS can provide, they use the Eject command (`npx @community-rss/core eject <target>`).

### Ejection Mechanics

- **Command Syntax:** The target can be a page (e.g., `pages/profile`), a component (`components/FeedCard`), a layout (`layouts/BaseLayout`), or `actions`.
- **Import Rewriting:** The CLI resolves the core file, safely copies it into the developer's `src/` directory, and intelligently uses regex transforms to rewrite the internal package relative imports (`../../components/`) into local proxy paths or public exports.
- **Proxy Component Pattern:** Scaffolded components are actually "Proxy Wrappers." They import the core headless/logic-focused component and re-export it, providing clear `<Fragment slot="[name]">` boundaries in commented blocks. Developers can then style the wrapper or drop custom elements into the available slots. The complex business logic stays locked safely inside `@community-rss/core`, receiving frictionless updates.

### Safe Re-Ejection and Slot Preservation

- **Idempotency:** Developers can safely run the `eject` command multiple times on the same file without destroying their distinct custom alterations.
- **Active Fragment Detection:** The CLI `eject` algorithm parses the existing local component file for uncommented (active) `<Fragment slot="X">` overrides. 
- **Merging Output:** During a re-eject, it generates fresh comment blocks showcasing the upstream default structures, but intelligently appends the developer's previously active fragments *outside* of those comment blocks so they remain functionally active. This allows the latest package updates to merge seamlessly around the developer's local overrides indefinitely.

For a complete technical description of the annotation format and the five-phase algorithm the CLI executes, see the [Eject Protocol](eject-protocol) reference requirement.

## 4. Email Templating

Email responses leverage a dual-mode system designed for developer ownership:
- **Framework Fallbacks & Defaults:** Provided by the package internally if the developer has created no overrides.
- **Developer Astromail (`.astro`):** Complex logic or tailored semantic tokens can be securely wrapped into proper `.astro` framework templates mapped seamlessly through the Vite alias `virtual:crss-email-templates`.
- **Developer HTML Files:** Simple, unstructured `.html` templates using basic mustache-style replacements (`{{variable}}`) exist for pure simplicity if `.astro` rendering is not desired.

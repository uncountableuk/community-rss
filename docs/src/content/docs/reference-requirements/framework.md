---
title: Framework Requirements
description: How the application is to be developed as an open-sourced npm package.
sidebar:
  order: 3
---

The overarching goal is to present a fully comprehensive Astro application as an extensible, white-labeled, installable npm package (`@community-rss/core`).

## 1. Package Architecture

- **Distribution:** Hosted on npm as a single monolithic core integration module.
- **Integration with Overrides:** The package uses Astro's integration API to dynamically inject page routes, middleware, configurations, and core components into a consuming Astro workspace.
- **Core Separation:** Business logic, databases, default stylesheets, and routing are strictly encapsulated within `packages/core`. Consumers interact with these through well-defined import paths, options interfaces, and CLI tools.

## 2. Upgrade Safety and Stability

- **Post 1.0.0 Guarantee:** The public API (including config interfaces, specific exported utilities, core action interfaces, and proxy slot shapes) must remain stable. Non-additive API changes demand a new major version. 
- **Pre 1.0.0 Guidance:** Breaking changes are permitted but must be heavily documented in the `CHANGELOG.md` and feature plans. Developers are explicitly warned about brittle dependencies prior to the 1.0.0 milestone.
- **Customization Retention:** Consuming a new version of the package should not result in the loss of aesthetic override files, theme CSS adjustments, or safely ejected active logic blocks.

## 3. Proxy Component Pattern

- To enable safe core upgrades without destroying custom templates, injected components exist as manageable **Proxy Components**.
- Ejection via CLI extracts a thin wrapper pointing directly back to the `core`. Developers place custom UI layout only within distinct annotated `<Fragment slot="X">` wrappers, allowing the package to safely upgrade the underlying component without severing customized front-end logic.
- Proxy wrappers cannot contain core business logic—they exist only for visual styling and slot manipulation.
- The mechanism that makes ejection possible is the **Eject Protocol** — a set of source-file annotations (`@eject-module`, `@eject-slot`) that framework authors must embed in every ejectable artefact. See [Eject Protocol](eject-protocol) for the full specification.

## 4. Route Precedence

- All integration pages (except explicit dynamic fallbacks) use standard Astro `injectRoute`. 
- Overriding core routing requires identical file placement in the consuming environment workspace (a "conditional injection" paradigm). If an identically purposed file is detected in the developer's project filesystem, it silently preempts the core package injection loop.

---
title: Reference Requirements
description: The definitive version of the requirements for the Community RSS Framework.
sidebar:
  order: 1
---

The **Reference Requirements** section acts as the definitive source of truth about what the Community RSS Framework should do. These requirements describe the intended behavior, functionality, and constraints of the system, written in a "what it should do" style rather than "how".

If you are developing new features or customizing the framework, you must consult these documents to ensure your architectural choices and functional additions do not conflict with the master specification.

These requirements are checked every time a new feature is added to make sure it doesn't conflict. If there is a discrepancy, the developer must be informed and given options about what to do.

## Sections

- [**Application Requirements**](application): How the reference Community RSS application behaves from a user perspective, including roles, authentication, and core interactions.
- [**Framework Requirements**](framework): How the application is to be developed as an open-sourced npm package, supporting future upgrades and API stability.
- [**Developer Experience Requirements**](developer-experience): How the developer area gets scaffolded, customized, and configured.
- [**Eject Protocol**](eject-protocol): The authoring contract framework developers must follow to make components, layouts, and pages ejectable via `npx crss eject`. Covers both the annotation format and the full algorithm executed by the CLI.
- [**Runtime Environment Requirements**](runtime-environment): The infrastructure dependencies including database, caching, email, S3, and standard deployment practices like Docker.
- [**Testing Requirements**](testing): The required test coverage, types of tests (unit, e2e, functional), and continuous integration expectations.
- [**AI Assistance Requirements**](ai-assistance): How the framework supports both the package developer and the developer-user via AI systems like GitHub Copilot and Cursor.

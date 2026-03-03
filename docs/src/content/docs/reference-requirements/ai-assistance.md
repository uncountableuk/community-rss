---
title: AI Assistance Requirements
description: How the framework supports both the package developer and the developer-user via AI systems.
sidebar:
  order: 7
---

This document outlines the expectations and structural support for AI coding assistants within the Community RSS ecosystem.

## 1. Dual Support Model

To accelerate development and prevent deep architectural violations, there are two distinct ways the framework provides guidance to AI systems:
- **For Framework Developers:** The structural and process rules of the `@community-rss/core` package itself (how to edit the codebase, structure features, run internal testing arrays).
- **For Developer Users:** The rules on how an end-user correctly interacts with the package from the outside (how to eject proxy components, alter design configurations, handle database relationships).

## 2. Integrated AI Features

- **GitHub Copilot / Cursor Compatibility:** The workspace deeply integrates custom instruction files `.github/copilot-instructions.md`, `.cursorrules`, and specific skill mappings to ensure these AI agents have immediate access to architectural tenets and API boundaries.
- **Scaffolded User Rules:** When users execute the initial `init` script to deploy the `@community-rss/core` framework onto their local application layer, comprehensive developer assistance guidelines and AI instructions are natively scaffolded into their filesystem. This ensures AI autocomplete acts functionally and appropriately within the bounds of expected, safe system behaviors like the Slot-Merge patterns, rather than breaking them.

## 3. Enforcement

- AI implementations must reference the master requirements before making decisions or altering major architectural structures inside of internal framework pipelines (`feature_plans/`).
- If there is a dispute or divergence between requested logic and the "Reference Requirements," AI assistants are mandated to default to verifying with the human developer first instead of blind execution.

---
title: Dev Setup
description: Set up your development environment to contribute to Community RSS.
---

## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- VS Code with the Dev Containers extension
- Node.js 22+ (handled by the dev container)

## Getting Started

```bash
# Clone the repo
git clone <repo-url> && cd community-rss

# Start Docker services
docker compose up -d

# Attach VS Code to the dev container
# Ctrl+Shift+P → "Dev Containers: Attach to Running Container"

# Install dependencies
npm install

# Run tests
npm test

# Start playground
npm run dev
```

## Monorepo Structure

```
/app
├── packages/core/       # @community-rss/core framework
├── playground/          # Reference implementation
├── docs/                # Starlight documentation site
├── feature_plans/       # Feature plans and specs
└── .github/             # CI, instructions, prompts
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start playground dev server |
| `npm run build` | Build core + playground |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint all files |
| `npm run format` | Format all files |

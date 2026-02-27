---
title: Testing Guide
description: How to write and run tests for the Community RSS framework.
---

import { Aside } from '@astrojs/starlight/components';

## Overview

All tests use [Vitest](https://vitest.dev/) and run from the
`packages/core/` directory.

```bash
cd packages/core
npm test              # Run all tests
npm run test:coverage # With coverage report
npx vitest            # Watch mode
```

## Test Structure

```
packages/core/test/
 db/           # Database query tests
 fixtures/     # Shared test data and helpers
 integration/  # Integration tests
 routes/       # API route handler tests
 types/        # Type-level tests
 utils/        # Utility function tests
    ├── build/    # Server-side utils
    ├── client/   # Client-side utils
    └── shared/   # Pure function utils
```

## Database Tests

Tests use **in-memory SQLite** via better-sqlite3. Each test gets
a fresh database instance:

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@db/schema';

function createTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  // Apply schema...
  return db;
}
```

<Aside type="note">
Never use file-based databases in tests. Always use `:memory:` for
isolation and speed.
</Aside>

## Mocking

### vi.hoisted()

When declaring variables used inside `vi.mock()` factories, use
`vi.hoisted()`:

```ts
const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

vi.mock('@utils/build/fetch', () => ({
  fetchWithRetry: mockFetch,
}));
```

<Aside type="caution">
Variables declared outside `vi.hoisted()` are not available inside
`vi.mock()` factory functions. This is a common source of test failures.
</Aside>

### Common Mocks

```ts
// Mock environment variables
const mockEnv = {
  FRESHRSS_URL: 'http://freshrss:80',
  FRESHRSS_USER: 'admin',
  FRESHRSS_API_PASSWORD: 'test-password',
  PUBLIC_SITE_URL: 'http://localhost:4321',
};

// Mock AppContext
const mockContext = {
  locals: {
    app: {
      db: createTestDb(),
      env: mockEnv,
      config: { maxFeeds: 5 },
    },
  },
};
```

## Path Aliases

Test files use path aliases configured in `vitest.config.ts`:

| Alias | Source Path |
|-------|-----------|
| `@utils/` | `src/utils/` |
| `@db/` | `src/db/` |
| `@core-types/` | `src/types/` |
| `@routes/` | `src/routes/` |
| `@components/` | `src/components/` |
| `@cli/` | `src/cli/` |
| `@fixtures/` | `test/fixtures/` |
| `@test/` | `test/` |

```ts
// ✅ Correct — use aliases in test files
import { syncFeeds } from '@utils/build/sync';
import { createTestDb } from '@fixtures/db';

// ❌ Wrong — don't use relative paths from test to source
import { syncFeeds } from '../../src/utils/build/sync';
```

## Writing Tests

### Test Checklist

- Test both success and error paths
- Test edge cases (empty input, null values, boundary conditions)
- Use descriptive test names
- Keep tests focused — one assertion concept per test
- Never define business logic in test files

### Example

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapFreshRssItem } from '@utils/build/sync';

describe('mapFreshRssItem', () => {
  it('maps a FreshRSS item to an article', () => {
    const item = {
      id: 'item-1',
      title: 'Test Article',
      canonical: [{ href: 'https://example.com/post' }],
      summary: { content: '<p>Hello</p>' },
      published: 1700000000,
    };

    const result = mapFreshRssItem(item, 'feed-1');

    expect(result).toMatchObject({
      feedId: 'feed-1',
      title: 'Test Article',
      url: 'https://example.com/post',
    });
  });

  it('handles missing optional fields', () => {
    const item = { id: 'item-2', title: 'Minimal' };
    const result = mapFreshRssItem(item, 'feed-1');
    expect(result.title).toBe('Minimal');
  });
});
```

## Coverage

Coverage thresholds are enforced in `vitest.config.ts`:

| Metric | Minimum |
|--------|---------|
| Statements | 80% |
| Branches | 80% |
| Functions | 80% |
| Lines | 80% |

The CLI (`src/cli/`) is excluded from coverage since it is a thin
scaffolding script.

```bash
npm run test:coverage
```

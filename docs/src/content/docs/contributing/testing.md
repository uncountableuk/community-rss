---
title: Testing
description: How to write and run tests for the Community RSS framework.
---

## Running Tests

```bash
# Watch mode
npm test

# Single run
npm run test:run

# With coverage report
npm run test:coverage
```

## Test Structure

Tests mirror the source tree under `packages/core/test/`:

```
test/
├── fixtures/          # Shared test data
├── utils/
│   ├── build/         # Node.js/Worker util tests
│   ├── client/        # Browser util tests
│   └── shared/        # Pure function tests
├── db/                # Database query tests
├── routes/            # API route tests
└── integration/       # Cross-module integration tests
```

## Import Conventions

Always use path aliases in test files:

```typescript
// ✅ Correct
import { resolveOptions } from '@core-types/options';
import { mockArticle } from '@fixtures/articles';

// ❌ Wrong — never use relative paths to source
import { resolveOptions } from '../../../src/types/options';
```

## Coverage Requirements

All new code must maintain ≥80% coverage on:
- Statements
- Branches
- Functions
- Lines

## Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@utils/shared/module';
import { mockData } from '@fixtures/data';

describe('myFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction(mockData);
    expect(result).toBeDefined();
  });

  it('should handle edge cases', () => {
    expect(myFunction([])).toEqual([]);
  });

  it('should throw for invalid input', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

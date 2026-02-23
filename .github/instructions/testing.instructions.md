---
applyTo: "packages/core/src/test/**/*.ts,packages/core/test/**/*.ts"
---

# Testing Instructions

## Monorepo Context
Tests for the `@community-rss/core` framework live inside `packages/core/`.
Test file structure mirrors the source tree. The playground has its own
minimal test setup — these instructions apply to the **core package**.

## File Location
Mirror source structure under a `test/` directory:
- `src/utils/shared/scoring.ts` → `test/utils/shared/scoring.test.ts`
- `src/db/queries/articles.ts` → `test/db/queries/articles.test.ts`
- Integration tests: `{feature}.integration.test.ts`
- Performance tests: `{feature}.performance.test.ts`

## Import Standards (CRITICAL)
✅ CORRECT:
```typescript
import { functionToTest } from '@utils/shared/scoring';
import { mockArticle } from '@fixtures/articles';
import type { Article } from '@core-types/models';
```

❌ WRONG:
```typescript
import { functionToTest } from '../../../src/utils/shared/scoring';
```

**Note**: Source code also uses path aliases for all cross-directory imports.
Test import patterns must match source code patterns for consistency.

## Test Structure
```typescript
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { functionToTest } from '@utils/domain/module';
import { mockData } from '@fixtures/data';

describe('ModuleName', () => {
  describe('functionName', () => {
    // Happy path tests first
    it('should return correct result for valid input', () => {});

    // Edge cases
    it('should handle empty input', () => {});

    // Error cases last
    it('should throw for invalid input', () => {});
  });
});
```

## Rules
- NEVER define business logic functions in test files
- Use fixtures from `@fixtures/` for test data
- Use `vi.mock()` for mocking, not manual implementations
- Follow AAA pattern: Arrange, Act, Assert
- Mock Cloudflare bindings (D1, R2, Queues) using Miniflare or `vi.mock()`

## Coverage Requirements (MANDATORY)

### Minimum Thresholds
All test files must contribute to maintaining:
- **Statements:** ≥ 80%
- **Branches:** ≥ 80%
- **Functions:** ≥ 80%
- **Lines:** ≥ 80%

### Coverage Verification
Before committing new code:
```bash
# Run tests with coverage from monorepo root
npm run test:coverage

# Check that new code has adequate coverage
# Overall percentages must not decrease
```

### What to Test
- ✅ All exported functions
- ✅ Both success and error paths
- ✅ Edge cases and boundary conditions
- ✅ Cloudflare binding interactions (D1 queries, R2 uploads, Queue messages)
- ✅ API route handlers (request/response)
- ✅ DOM manipulation and event handlers (client code)
- ✅ Integration between modules
- ✅ Forward-compatibility of public APIs

### Coverage Anti-Patterns
- ❌ Writing tests that don't assert behaviour (coverage padding)
- ❌ Ignoring uncovered branches in conditionals
- ❌ Skipping tests for "simple" configuration files
- ❌ Not testing error handlers because they're "unlikely to execute"

## D1 Database Testing
- Use Miniflare's local SQLite simulation for D1 tests
- Apply schema migrations before each test suite
- Use transactions + rollback to keep test isolation
- Test both query success and constraint violation paths

## Performance Requirements

### Cache Management
- Use `beforeAll` to load data once per test suite
- Only clear cache with `afterAll` or when tests mutate data
- Avoid `beforeEach` cache clearing for read-only tests

### Test Organization
- Fast unit tests: `{feature}.test.ts` (fixtures, <100ms)
- Slow integration: `{feature}.integration.test.ts` (real data, set timeout)
- Example timeout: `describe('Integration', () => {...}, { timeout: 10000 })`

### Anti-Patterns
- ❌ Loading expensive data in `beforeEach` for read-only tests
- ❌ Using `beforeEach` with cache clearing for read-only tests
- ❌ No fixtures for unit tests
- ❌ Missing timeouts on integration tests

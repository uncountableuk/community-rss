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
- `src/cli/init.mjs` → `test/cli/init.test.ts`
- Integration tests: `{feature}.integration.test.ts`
- Performance tests: `{feature}.performance.test.ts`

## Import Standards (CRITICAL)
 CORRECT:
```typescript
import { functionToTest } from '@utils/shared/scoring';
import { mockArticle } from '@fixtures/articles';
import type { Article } from '@core-types/models';
import { scaffold } from '@cli/init.mjs';
```

 WRONG:
```typescript
import { functionToTest } from '../../../src/utils/shared/scoring';
```

**Note**: Source code uses **relative imports** (not path aliases) because
Astro/Vite cannot resolve the core package's internal tsconfig aliases when
consumed as a workspace dependency. Only test code uses path aliases, resolved
via the Vitest config.

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
- Use `vi.hoisted()` for any variable referenced inside `vi.mock()` factories
- Follow AAA pattern: Arrange, Act, Assert
- Mock the database using in-memory SQLite via better-sqlite3 or `vi.mock()`

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
- ✅ Database interactions (SQLite queries via Drizzle ORM)
- ✅ API route handlers (request/response)
- ✅ DOM manipulation and event handlers (client code)
- ✅ Integration between modules
- ✅ Forward-compatibility of public APIs
- ✅ Email template resolution and rendering
- ✅ CLI scaffold operations (file creation, --force flag)

### Coverage Anti-Patterns
- ❌ Writing tests that don't assert behaviour (coverage padding)
- ❌ Ignoring uncovered branches in conditionals
- ❌ Skipping tests for "simple" configuration files
- ❌ Not testing error handlers because they're "unlikely to execute"

## Database Testing
- Use in-memory SQLite via better-sqlite3 for database tests
- Apply schema migrations before each test suite
- Use transactions + rollback to keep test isolation
- Test both query success and constraint violation paths
- Never use D1 or Miniflare — the stack uses better-sqlite3 directly

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
- ❌ Declaring mock variables outside `vi.hoisted()` when used in `vi.mock()` factories

## E2E Testing (Playwright)

E2E tests live in `e2e/` at the repo root and run against the playground.

### File Structure
```
e2e/
  fixtures/    # Seed data, auth helpers, combined exports
  pages/       # Per-page test specs
  flows/       # Multi-page user flow specs
```

### Running E2E Tests
```bash
# Prerequisites: scaffold playground + start Docker services
npm run reset:playground
cd playground && docker compose up -d

# Run E2E tests (starts dev server automatically)
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui
```

### E2E Test Conventions
- Import from `@playwright/test` — not from Vitest
- Tests should skip gracefully when Docker services (Mailpit, etc.)
  are unavailable — use `test.skip()` inside the test body
- Use generous timeouts for Server Islands (`server:defer`) content
  that streams after initial page load
- Page tests go in `e2e/pages/{page}.spec.ts`
- Multi-page flow tests go in `e2e/flows/{flow}.spec.ts`
- Auth-dependent tests use `E2E_AUTH_COOKIE` env var or the Mailpit
  magic link interception helper from `e2e/fixtures/auth.ts`

### E2E vs Unit Test Decision
- **Unit test** if: testing a pure function, database query, or
  individual API route handler in isolation
- **E2E test** if: testing user-visible behaviour across page navigation,
  form submission, or auth flows that span multiple HTTP requests

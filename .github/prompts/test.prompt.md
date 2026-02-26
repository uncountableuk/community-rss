---
agent: agent
description: "Generate comprehensive test suites following testing standards"
---

# Test Generation Prompt

Generate tests for the Community RSS Framework following the project's
testing standards specifically designed for an NPM monorepo with
better-sqlite3, Drizzle ORM, and Node.js server-side processing.

## Standards to Follow
- Testing Rules: `.github/instructions/testing.instructions.md`
- Performance Rules: `.github/instructions/test-performance.instructions.md`
- Copilot Instructions: `.github/copilot-instructions.md`

## Test File Location
Mirror the source structure within `packages/core/`:
- `src/utils/shared/scoring.ts` → `test/utils/shared/scoring.test.ts`
- `src/utils/build/sync.ts` → `test/utils/build/sync.test.ts`
- `src/db/queries/articles.ts` → `test/db/queries/articles.test.ts`
- `src/routes/api/v1/feeds.ts` → `test/routes/api/v1/feeds.test.ts`
- `src/cli/init.mjs` → `test/cli/init.test.ts`

## Test Structure
```typescript
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { functionToTest } from '@utils/domain/module';
import { mockData } from '@fixtures/data';

describe('ModuleName', () => {
  describe('functionName', () => {
    it('should {happy path}', () => {});
    it('should handle {edge case}', () => {});
    it('should throw for {error case}', () => {});
  });
});
```

## Import Rules (CRITICAL)
- ✅ Use: `@utils/`, `@db/`, `@core-types/`, `@fixtures/`, `@test/`, `@cli/`
- ❌ Never: `../../../src/utils/`

## Coverage Requirements
- Target: ≥80% statements, branches, functions, lines
- All exported functions must have tests
- Test happy paths, edge cases, and error conditions

## Database Testing
- Use in-memory SQLite via better-sqlite3 for database tests
- Apply schema migrations before each test suite in `beforeAll`
- Use transactions + rollback for test isolation
- Test both query success and constraint violation paths
- Never use D1 or Miniflare — the stack uses better-sqlite3 directly

## Mock Patterns
- Use `vi.hoisted()` for any variable referenced inside `vi.mock()` factories
- Mock `node-cron` for scheduled task tests
- Mock `nodemailer` for email sending tests
- Mock `fs` operations for CLI scaffold tests
- Mock `AppContext` for route handler tests

## Checklist
- [ ] Test file mirrors source location in `packages/core/`
- [ ] Path aliases used for all imports
- [ ] Happy path, edge cases, errors covered
- [ ] No business logic defined in test file
- [ ] Fixtures used for unit test data
- [ ] Suite-level caching with `beforeAll` for data loading
- [ ] Unit tests (<100ms) separated from integration tests (>1s)
- [ ] Integration tests have explicit timeouts
- [ ] Database tests use in-memory SQLite with migrations applied
- [ ] `vi.hoisted()` used for mock variables in `vi.mock()` factories
- [ ] Public API tests verify forward-compatibility
- [ ] Coverage maintained at ≥80%

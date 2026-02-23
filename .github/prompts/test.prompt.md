---
agent: agent
description: "Generate comprehensive test suites following testing standards"
---

# Test Generation Prompt

Generate tests for the Community RSS Framework following the project's
testing standards specifically designed for an NPM monorepo with
Cloudflare D1, R2, and Queue bindings.

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
- ✅ Use: `@utils/`, `@db/`, `@core-types/`, `@fixtures/`, `@test/`
- ❌ Never: `../../../src/utils/`

## Coverage Requirements
- Target: ≥80% statements, branches, functions, lines
- All exported functions must have tests
- Test happy paths, edge cases, and error conditions

## Cloudflare-Specific Testing
- **D1**: Use Miniflare local SQLite; apply migrations in `beforeAll`
- **R2**: Mock with `vi.mock()` or use Miniflare R2 simulation
- **Queues**: Mock queue producers; test consumer handler logic directly
- **Cron**: Test the exported `scheduled()` handler with mock env

## Checklist
- [ ] Test file mirrors source location in `packages/core/`
- [ ] Path aliases used for all imports
- [ ] Happy path, edge cases, errors covered
- [ ] No business logic defined in test file
- [ ] Fixtures used for unit test data
- [ ] Suite-level caching with `beforeAll` for data loading
- [ ] Unit tests (<100ms) separated from integration tests (>1s)
- [ ] Integration tests have explicit timeouts
- [ ] D1 tests use Miniflare with migrations applied
- [ ] Public API tests verify forward-compatibility
- [ ] Coverage maintained at ≥80%

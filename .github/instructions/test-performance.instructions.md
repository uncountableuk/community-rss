---
applyTo: "packages/core/src/test/**/*.ts,packages/core/test/**/*.ts"
---

# Test Performance Instructions

## Overview

These instructions supplement the main testing instructions with
performance-specific requirements for the Community RSS Framework.
Tests must remain fast even when handling large datasets from D1
queries or FreshRSS sync operations.

## Cache Management (MANDATORY)

### Suite-Level Caching
- **ALWAYS** use `beforeAll` to load data once per test suite
- **NEVER** load expensive data in `beforeEach` or individual tests
- **ONLY** clear cache when tests mutate data

```typescript
// ✅ CORRECT
describe('Article Scoring', () => {
  let articles: Article[];

  beforeAll(async () => {
    articles = await loadTestArticles(); // Load once
  });

  it('calculates trending score', () => {
    // Use cached articles
  });
});

// ❌ WRONG
describe('Bad Example', () => {
  let articles: Article[];

  beforeEach(async () => {
    articles = await loadTestArticles(); // Reloads every test
  });
});
```

### When to Clear Cache
Only clear cache if tests modify the data:

```typescript
describe('Mutation Tests', () => {
  beforeEach(async () => {
    // Reload for each test that changes data
    articles = await loadTestArticles();
  });

  it('modifies article metadata', () => {
    articles[0].title = 'Changed';
  });
});
```

## D1 Database Test Performance

### Use Transactions for Isolation
```typescript
describe('D1 Query Tests', () => {
  let db: D1Database;

  beforeAll(async () => {
    db = await setupTestDatabase(); // Miniflare local D1
    await applyMigrations(db);
    await seedTestData(db);
  });

  // Wrap each test in a transaction for fast rollback
  it('inserts a new article', async () => {
    await db.exec('BEGIN TRANSACTION');
    try {
      // Test logic
    } finally {
      await db.exec('ROLLBACK');
    }
  });
});
```

### Seed Data Strategy
- Create minimal but representative seed data in fixtures
- Seed once in `beforeAll`, rollback mutations per-test
- Avoid re-seeding the database for every test

## Fixture Requirements (MANDATORY)

### Unit Tests
- **MUST** use fixtures from `@fixtures/`
- **MUST NOT** call real APIs or databases
- Cover edge cases: empty feeds, malformed HTML, missing fields

```typescript
import { mockArticle, mockFeed } from '@fixtures/articles';

describe('Unit Tests', () => {
  it('validates article dates', () => {
    expect(isValidArticle(mockArticle)).toBe(true);
  });
});
```

### Integration Tests
- Use real data (local D1, Miniflare) for end-to-end validation
- Set explicit timeouts: `{ timeout: 10000 }`
- At least one integration test per module

```typescript
describe('Integration Tests', () => {
  let db: D1Database;

  beforeAll(async () => {
    db = await setupTestDatabase();
  }, 10000);

  it('syncs and queries articles end-to-end', async () => {
    // Test with real D1 operations
  });
}, { timeout: 10000 });
```

## Test Organization (MANDATORY)

### File Separation
- **Unit tests**: `{feature}.test.ts` (fixtures, <100ms)
- **Integration tests**: `{feature}.integration.test.ts` (D1/R2, set timeout)

### Performance Goals
- Unit tests: <100ms execution
- Integration tests: <10 seconds with timeout
- Full suite: <60 seconds total

## Anti-Patterns (PROHIBITED)

### ❌ Loading Data Repeatedly
```typescript
beforeEach(async () => {
  articles = await queryAllArticles(db); // Heavy per-test
});
```

### ❌ beforeEach Cache Clearing
```typescript
beforeEach(() => {
  clearCache(); // Destroys performance benefits
});
```

### ❌ No Timeouts on Integration
```typescript
describe('D1 Tests', () => {
  it('queries articles', async () => {
    await db.prepare('SELECT * FROM articles').all();
    // May hang indefinitely without a timeout
  });
});
```

### ❌ Mixing Fast and Slow Tests
```typescript
describe('Mixed', () => {
  it('fast unit test', () => {}); // <100ms
  it('slow D1 query', async () => {
    await setupTestDatabase(); // >1s — put in separate file
  });
});
```

## Decision Framework

### Data Loading Strategy
```
Need to mutate data?
├── Yes → beforeEach reload or transaction rollback
└── No → beforeAll suite cache
```

### Test Type
```
Testing pure logic?
├── Yes → Unit test with fixtures
└── No → Integration test with Miniflare/D1
```

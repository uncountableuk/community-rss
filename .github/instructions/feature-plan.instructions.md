---
applyTo: "feature_plans/**/*.md"
---

# Feature Plan Instructions

## Purpose
Every feature, no matter how small, must have an approved plan in
`feature_plans/X_Y_Z/{feature_name}/` before implementation begins.
This ensures architectural consistency, API stability, and proper
test/doc coverage across the monorepo.

## Directory Convention
```
feature_plans/
  0_1_0/
    feed-sync/
      FEATURE_PLAN.md
    commenting/
      FEATURE_PLAN.md
  0_2_0/
    trending-algorithm/
      FEATURE_PLAN.md
```

The `X_Y_Z` folder corresponds to the target release version.

## Required Sections

### 1. Overview
- What problem does this feature solve?
- Who benefits (Guest, Registered, Verified Author, Admin)?
- Which part of the spec does it implement?

### 2. Codebase Review
- Existing files that will be modified
- New files to be created (with full paths in the monorepo)
- Existing utilities that can be reused
- Dependencies to add (if any — justify each one)

### 3. Architecture & API Design
- Public API surface changes (if any)
- New interfaces/types with full signatures
- Route additions (`/api/v1/...`)
- Database schema changes (new tables, columns, migrations)
- Rationale for design decisions
- Forward-compatibility analysis: "Can this evolve without breaking?"

### 4. Implementation Phases
Break work into ordered, checkbox-tracked phases:

```markdown
## Phase 1: Database Schema
- [ ] Create migration `XXX_create_feeds_table.sql`
- [ ] Add seed data fixtures
- [ ] Write D1 query helpers in `src/db/queries/feeds.ts`

## Phase 2: Core Logic
- [ ] Implement `syncFeeds()` in `src/utils/build/sync.ts`
- [ ] Implement `parseFeedXml()` in `src/utils/shared/feed-parser.ts`

## Phase 3: API Routes
- [ ] Create `GET /api/v1/feeds` route handler
- [ ] Create `POST /api/v1/feeds` with validation

## Phase 4: UI Components
- [ ] Create `FeedCard.astro` component
- [ ] Create `FeedList.astro` component

## Phase 5: Testing
- [ ] Unit tests for all shared utils (fixtures)
- [ ] Unit tests for all build utils (mocked D1)
- [ ] Integration tests for API routes (Miniflare)
- [ ] Client interaction tests (DOM events)
- [ ] Verify ≥80% coverage maintained

## Phase 6: Documentation
- [ ] API reference for new public exports
- [ ] Update README if applicable
- [ ] JSDoc on all public functions with @since tags
```

### 5. Test Strategy
- Specific test files to create (with paths)
- Fixtures needed
- Which tests are unit vs integration
- D1 testing approach (Miniflare / transactions)

### 6. Documentation Updates
- API reference changes
- README updates
- Configuration examples for consumers

### 7. Implementation Notes
This section is **initially empty** when the plan is written. It is populated
during implementation and serves as the living record of progress.

```markdown
## Implementation Notes

### Phase 1: Database Schema — ✅ Completed
- [x] Create migration `XXX_create_feeds_table.sql`
- [x] Add seed data fixtures
- [x] Write D1 query helpers in `src/db/queries/feeds.ts`

> **Notes:** Chose INTEGER for timestamps instead of TEXT for D1 performance.
> Added an index on `feed_id` in the articles table — not in the original plan
> but necessary for query performance.

### Phase 2: Core Logic — 🔄 In Progress
- [x] Implement `syncFeeds()` in `src/utils/build/sync.ts`
- [ ] Implement `parseFeedXml()` in `src/utils/shared/feed-parser.ts`

### Phase 3–6: Not Started

---

### Problems & Constraints
- FreshRSS API returns paginated results (max 50); added loop in `syncFeeds()`
- D1 batch insert limit is 100 rows; chunked inserts implemented
```

#### Update Rules
- **After every completed phase**, the AI agent MUST update the feature plan:
  1. Check off (`[x]`) all completed tasks in the phase
  2. Mark the phase heading with ✅ Completed (or ❌ Blocked)
  3. Add a `> **Notes:**` block under the phase summarising decisions,
     deviations from the plan, or anything noteworthy
  4. Append any new problems or constraints to the
     **Problems & Constraints** section at the bottom
  5. **Review `.github/` directives** — if implementation revealed that any
     rule in `copilot-instructions.md` or `instructions/*.instructions.md`
     is incorrect, incomplete, or missing, note the required changes in the
     Implementation Notes and propose them to the user for approval before
     applying. Common triggers: import conventions, new tooling, stack
     additions, workflow changes.
- Phases not yet started should be listed as "Not Started"
- Phases currently being worked on should be marked 🔄 In Progress
- This section must never be deleted or overwritten — it is append-only

## Review Checklist
Before the plan is approved:
- [ ] All files listed with full monorepo paths
- [ ] Utils placed in correct execution context (build/client/shared)
- [ ] Public API changes use Options pattern with optional params
- [ ] Database migrations are additive (no destructive changes to existing tables)
- [ ] Test phase included with specific file locations
- [ ] Documentation phase included
- [ ] No version bump or CHANGELOG update included (handled at release)
- [ ] Forward-compatibility of any new APIs has been considered
- [ ] GPL-3.0 compatibility confirmed for any new dependencies

## Anti-Patterns
- ❌ Starting implementation before plan approval
- ❌ Plans without a testing phase
- ❌ Plans without a documentation phase
- ❌ Vague phases like "implement the feature"
- ❌ Missing file paths — every new/modified file must be listed
- ❌ Including version bumps or changelog updates in the plan
- ❌ Completing a phase without updating Implementation Notes
- ❌ Deleting or overwriting previous Implementation Notes entries
- ❌ Writing misleading Implementation Notes — describe actual code behaviour,
  not intended behaviour. If the code uses `sanitize-html`, say so; don't
  describe it as "regex stripping"

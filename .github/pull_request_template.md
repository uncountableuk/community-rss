## Changes

### Type of Change
- [ ] 🐛 Bug fix (PATCH — 0.0.X)
- [ ] ✨ New feature (MINOR — 0.X.0)
- [ ] 💥 Breaking change (MAJOR — X.0.0)
- [ ] 📝 Documentation update
- [ ] 🧪 Test updates
- [ ] 🔧 Chore / tooling

### Feature Plan
<!-- Link to the approved feature plan in feature_plans/X_Y_Z/{feature_name}/ -->
Feature plan: `feature_plans/___/___/FEATURE_PLAN.md`

### Description
<!-- Describe your changes in detail -->

### Public API Impact
<!-- Does this change the public API surface of @community-rss/core? -->
- [ ] No public API changes
- [ ] New public exports added (backward-compatible)
- [ ] Existing public API modified (verify forward-compatibility)
- [ ] Breaking change to public API (MAJOR bump required post-1.0.0)

### Breaking Changes
<!-- List any breaking changes and migration steps (pre-1.0.0 only) -->

## Quality Checklist

### Code Standards
- [ ] Business logic in `packages/core/src/utils/` (not in components)
- [ ] Relative imports used in source code (path aliases in tests only)
- [ ] JSDoc with `@since` tags on all public exports
- [ ] CSS custom properties used (no hard-coded colours)
- [ ] AppContext used for runtime context (db, env, config)
- [ ] Drizzle ORM used for database queries (no raw SQL outside generated migrations)
- [ ] better-auth patterns followed for auth logic (no custom session handling)
- [ ] Components use `messages`/`labels` props (no hard-coded strings)
- [ ] Page routes scaffolded via CLI (not injected by integration)
- [ ] Implementation Notes accurately describe actual code, not intent

### Testing
- [ ] All tests pass (`npm run test:run` from root)
- [ ] Coverage maintained ≥80% (`npm run test:coverage`)
- [ ] New functions have unit tests with fixtures
- [ ] Integration tests have explicit timeouts
- [ ] Database tests use in-memory SQLite via better-sqlite3

### Build & Integration
- [ ] Build succeeds (`npm run build` from root)
- [ ] Playground app builds and runs correctly
- [ ] No console errors or warnings

### Documentation
- [ ] API reference updated for new public exports
- [ ] Consumer examples import from `@community-rss/core`
- [ ] Feature plan updated with implementation notes
- [ ] Starlight docs updated if user-facing feature

### Monorepo
- [ ] No app dependencies added to root `package.json`
- [ ] Playground imports `@community-rss/core` (not path-relative)
- [ ] GPL-3.0 compatible dependencies only

## Important Reminders

 **Do NOT update version numbers or CHANGELOG.md in feature PRs.**
Version and changelog updates happen only during release finalization.

 **All feature work requires an approved feature plan** in
`feature_plans/X_Y_Z/{feature_name}/` before implementation begins.

 **Commit messages must follow Conventional Commits:**
`feat:`, `fix:`, `docs:`, `test:`, `chore:`

## Additional Notes
<!-- Any additional information, dependencies, or context -->

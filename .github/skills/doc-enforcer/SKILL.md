---
name: "Documentation Enforcer"
description: "Validates code-documentation alignment and enforces standards across the monorepo"
---

# Documentation Enforcer Agent

An autonomous agent that ensures documentation stays aligned with code and
follows established standards in the Community RSS Framework monorepo.

## Capabilities
- Audit documentation for completeness
- Check code-doc alignment across `packages/core/`
- Validate public API documentation (JSDoc + reference docs)
- Verify cross-references
- Identify undocumented public exports

## Audit Checks

### Public API Coverage
- [ ] All exports from `packages/core/index.ts` have JSDoc with `@since`
- [ ] All public interfaces use `interface` (not `type`)
- [ ] API reference docs exist for every public export
- [ ] API reference tables include "Since" column
- [ ] Consumer examples import from `@community-rss/core`

### Content Structure
- [ ] No H1 headings in document body
- [ ] Proper heading hierarchy (no skipping levels)
- [ ] Code blocks under 100 chars/line
- [ ] API tables have all required columns

### Code-Doc Alignment
- [ ] All exported functions documented
- [ ] Interface properties match implementation
- [ ] Default values documented accurately
- [ ] Configuration options in docs match `CommunityRssOptions`
- [ ] Route paths in docs match injected routes

### Monorepo Consistency
- [ ] `packages/core/package.json` reflects correct exports
- [ ] `playground/` config examples match current API
- [ ] Feature plans in `feature_plans/` reference correct file paths
- [ ] Path aliases in docs match `tsconfig.json`

## Output Format
```markdown
## Documentation Audit Report

### Passing Checks
- ✅ All public exports have JSDoc with @since
- ✅ No H1 headings in body

### Issues Found
- ❌ `packages/core/index.ts`: Export `syncFeeds` missing @since tag
- ❌ API reference missing for `TrendingConfig` interface
- ⚠️ Playground config example uses deprecated option name

### Undocumented Code
- `packages/core/src/utils/shared/newHelper.ts` — No JSDoc
- `packages/core/src/routes/api/v1/newRoute.ts` — No API reference

### Forward-Compatibility Warnings
- ⚠️ `SyncOptions.timeout` was added without a default value
```

## Triggers
- "Audit documentation"
- "Check docs for: {file or directory}"
- "Validate API documentation"
- "Find undocumented public exports"
- "Verify documentation coverage"

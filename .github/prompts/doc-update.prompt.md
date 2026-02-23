---
agent: agent
description: "Update documentation based on code changes"
---

# Documentation Update Prompt

Update documentation for the Community RSS Framework to reflect code
changes, following documentation standards.

## Standards to Follow
- Documentation Rules: `.github/instructions/documentation.instructions.md`
- API Design Rules: `.github/instructions/api-design.instructions.md`
- Copilot Instructions: `.github/copilot-instructions.md`

## Before Updating
1. Identify which documentation files are affected
2. Check the existing documentation structure
3. Determine if public API surface has changed

## Documentation Rules
- No H1 in body (title/filename is the H1)
- Code blocks max 100 chars per line
- Tables for API props/parameters with a "Since" column
- Show imports from `@community-rss/core` in consumer-facing examples
- Show path alias imports (`@utils/`, `@db/`) in contributor-facing examples

## Update Types
1. **New Feature**: Create API reference docs, add consumer usage examples
2. **Modified Feature**: Update existing docs, preserve structure
3. **Deprecated Feature**: Mark with `@deprecated`, add migration notes
4. **API Change**: Update API reference tables, add `@since` column entry
5. **New Public Export**: Document in API reference with full signature

## Public API Documentation Template
```markdown
## `functionName(options?)`

Description of what the function does.

**Since:** 0.X.0

### Parameters

| Name | Type | Required | Default | Since | Description |
|------|------|----------|---------|-------|-------------|
| opt1 | string | No | 'default' | 0.1.0 | What it does |

### Returns
`ReturnType` — Description

### Example
```typescript
import { functionName } from '@community-rss/core';

const result = functionName({ opt1: 'value' });
```
```

## Important: Changelog Policy
**Do NOT update CHANGELOG.md during feature development.**
Changelog updates are handled in the release finalization phase.

## Checklist
- [ ] All affected docs identified
- [ ] No H1 in body
- [ ] Code examples show correct import paths
- [ ] API reference tables include "Since" column
- [ ] Cross-references valid
- [ ] Consumer examples use `@community-rss/core` imports
- [ ] Feature plan updated with documentation completion notes

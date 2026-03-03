# Feature Plan: Homepage SSR Migration

**Version:** 0.6.0  
**Feature path:** `feature_plans/0_6_0/homepage-ssr/`

---

## 0. Requirements Check

No conflicts with Reference Requirements. This change aligns with the
framework's SSR-first architectural principle documented in
`reference-requirements/framework.md` and the Astro Framework Architecture
Guidelines. The prior CSR exception is revoked — no requirement document
ever mandated CSR for the homepage; it was an implementation shortcut.

---

## 1. Overview

**Problem:** The homepage renders the article feed grid entirely client-side
via a `createArticleCard()` JavaScript function in the page's `<script>` block.
This creates two parallel card-rendering implementations:
1. `FeedCard.astro` — the ejectable Astro component used for all SSR paths
2. `createArticleCard()` — a JS duplicate of the same HTML structure, inside
   the homepage script, invisible to the ejection system

Developers who eject `FeedCard.astro` and customise it see no effect on the
homepage because the homepage never calls the component.

**Solution:** Convert the homepage to full SSR:
- Articles are fetched in the Astro frontmatter via `Astro.locals.app.db`
- Articles are passed as props to `FeedGrid`, which renders `FeedCard` for each
- Pagination is handled via a `?page=N` query parameter
- A **"Load more" progressive enhancement** intercepts the page-to-page
  navigation, fetches the next page as HTML, extracts the new card elements from
  the server-rendered `#feed-grid`, and appends them to the current grid —
  preserving the infinite-scroll UX while keeping all card rendering in Astro
- The entire `createArticleCard()` function and its ~130 lines of JS are deleted

**Who benefits:** Any developer who ejects `FeedCard.astro` — their override
is now visible on the homepage without ejecting the page.

---

## 2. Codebase Review

### Files modified

| File | Change |
|---|---|
| `packages/core/src/db/queries/articles.ts` | Add `getArticlesWithFeedTitle()` — joins feeds table to include `feedTitle` |
| `packages/core/src/pages/index.astro` | Full rewrite: SSR frontmatter, remove `createArticleCard` JS, add load-more progressive enhancement |
| `packages/core/src/cli/templates/pages/index.astro` | Mirror the SSR pattern for scaffolded pages |
| `packages/core/src/routes/api/v1/articles.ts` | Add `feedTitle` to API response (uses same new query) |
| `.github/copilot-instructions.md` | Remove "homepage is sole approved CSR exception" |

### Files NOT modified

- `packages/core/src/components/FeedCard.astro` — unchanged; now used for all cards
- `packages/core/src/components/FeedGrid.astro` — unchanged
- `packages/core/src/db/schema.ts` — no schema changes needed
- `packages/core/src/middleware.ts` — unchanged
- `packages/core/src/integration.ts` — unchanged

### New files

| File | Purpose |
|---|---|
| `packages/core/test/db/queries/articles-with-feed-title.test.ts` | Unit tests for `getArticlesWithFeedTitle()` |

### Dependencies

No new dependencies. `getArticlesWithFeedTitle` uses Drizzle's existing
`leftJoin` and `select` APIs already imported in `articles.ts`.

---

## 3. Architecture & API Design

### New query: `getArticlesWithFeedTitle()`

```typescript
export async function getArticlesWithFeedTitle(
  db: BetterSQLite3Database,
  limit = 20,
  offset = 0
): Promise<ArticleWithFeedTitle[]>

export interface ArticleWithFeedTitle {
  id: string;
  feedId: string;
  title: string;
  summary: string | null;
  authorName: string | null;
  publishedAt: Date | null;
  originalLink: string;
  feedTitle: string | null;
}
```

Uses a Drizzle `leftJoin` on `feeds` to resolve `feedTitle`:

```typescript
db.select({
  id: articles.id,
  feedId: articles.feedId,
  title: articles.title,
  summary: articles.summary,
  authorName: articles.authorName,
  publishedAt: articles.publishedAt,
  originalLink: articles.originalLink,
  feedTitle: feeds.title,
})
.from(articles)
.leftJoin(feeds, eq(articles.feedId, feeds.id))
.orderBy(desc(articles.publishedAt))
.limit(limit)
.offset(offset)
.all()
```

### Homepage pagination

- `?page=N` query param (default 1, min 1)
- `limit` fixed at 20 per page
- Fetches `limit + 1` rows to probe `hasMore` without a COUNT query
- If `hasMore`, a "Load more" `<a>` element links to `?page=N+1`

### Progressive enhancement (infinite scroll via HTML extraction)

A small `<script>` uses `IntersectionObserver` on the existing sentinel element.
When the sentinel is visible, the script:
1. Fetches the `href` of `#crss-load-more-link` as a full HTML page
2. Parses the HTML with `DOMParser`
3. Extracts all `.crss-feed-card` children from `#feed-grid` in the fetched doc
4. Appends them to the live `#feed-grid`
5. Updates the sentinel's next-page URL from the fetched doc's `#crss-load-more-link`
6. Re-observes the sentinel if there are more pages

This approach renders ALL cards via `FeedCard.astro` — there is no
`createArticleCard()` JavaScript equivalent. Ejected proxies work for every
card including those loaded via the progressive enhancement.

### API route update

`GET /api/v1/articles` is updated to use `getArticlesWithFeedTitle` so the
response includes `feedTitle`. This is backward-compatible — the field is
additive to the existing response shape.

### Public API impact

`getArticlesWithFeedTitle` is added to `packages/core/index.ts` exports
alongside `getArticles`. The existing `getArticles` is kept for backward
compatibility.

---

## 4. Implementation Phases

### Phase 1: DB Query
- [ ] Add `getArticlesWithFeedTitle()` to `packages/core/src/db/queries/articles.ts`
- [ ] Export `ArticleWithFeedTitle` type
- [ ] Update `GET /api/v1/articles` to use `getArticlesWithFeedTitle`

### Phase 2: Homepage SSR
- [ ] Rewrite `packages/core/src/pages/index.astro` frontmatter to query DB
- [ ] Remove `createArticleCard()` and all associated JS (~130 lines)
- [ ] Add `?page=N` pagination and `hasMore` probe
- [ ] Add "Load more" link (SSR fallback)
- [ ] Add IntersectionObserver progressive enhancement (HTML extraction)
- [ ] Preserve empty state, loading state, and error state handling

### Phase 3: CLI Template Update
- [ ] Update `packages/core/src/cli/templates/pages/index.astro` to mirror SSR pattern

### Phase 4: Documentation
- [ ] Remove "homepage is sole approved CSR exception" from `copilot-instructions.md`
- [ ] Update `implementation.instructions.md` to remove the CSR exception footnote

### Phase 5: Tests
- [ ] `test/db/queries/articles-with-feed-title.test.ts` — happy path, missing feed, empty result, pagination

---

## 5. Test Strategy

Unit tests for `getArticlesWithFeedTitle` in isolation using in-memory SQLite.
Planted fixtures: feeds + articles with known feedId relationships. Assertions:
- `feedTitle` is populated when feed exists
- `feedTitle` is `null` when feed row is missing (left join)
- `limit` and `offset` work correctly
- `orderBy publishedAt desc` ordering

E2E: existing `article-browsing.spec.ts` should pass since the article content
is now in the initial SSR HTML.

---

## 6. Implementation Notes

### Phase 1: DB Query — ✅ Completed
- [x] `getArticlesWithFeedTitle()` added to `src/db/queries/articles.ts`
- [x] `ArticleWithFeedTitle` interface exported
- [x] `GET /api/v1/articles` updated to use `getArticlesWithFeedTitle`
- [x] Both exported from `packages/core/index.ts`

> **Notes:** `originalLink` typed as `string | null` (not `string`) in
> `ArticleWithFeedTitle` because Drizzle infers `string | null` after a
> `leftJoin` even on a non-null column. The interface matches the runtime
> type to avoid a TypeScript `2322` error.

### Phase 2: Homepage SSR — ✅ Completed
- [x] `index.astro` frontmatter rewritten: `getArticlesWithFeedTitle` query,
      `?page=N` pagination, `ARTICLES_PER_PAGE = 20`, `hasMore` probe,
      `try/catch` with `loadError` flag
- [x] `createArticleCard()` and all 130 lines of client-side JS removed
- [x] New SSR template: conditional error/empty/grid states rendered in
      Astro; `<FeedGrid articles={articles} />` receives server-fetched data
- [x] `#crss-load-more-link` `<a>` element as no-JS pagination fallback
- [x] `IntersectionObserver` progressive enhancement: fetches next HTML page,
      extracts `#feed-grid` children via `DOMParser`, appends to live grid —
      no `createArticleCard()` equivalent
- [x] `FeedCard.astro` Props updated: all optional fields accept `null` in
      addition to `undefined`; destructuring uses `??` coercions so null
      values fall back to `'Unknown'` / `0` defaults

> **Notes:** The initial replacement had a script EOF truncation bug — the
> `replace_string_in_file` tool hit a content size limit and cut off the
> closing `}`, `);`, and `</script>` tags. Fixed by a targeted replacement
> of the truncated tail. Lesson: large `replace_string_in_file` operations
> should verify the file line count after writing.

### Phase 3: CLI Template Update — ✅ Completed
- [x] `src/cli/templates/pages/index.astro` fully rewritten to SSR pattern:
      same frontmatter with `@community-rss/core/db/queries/articles` import,
      same conditional template, same progressive enhancement script

### Phase 4: Documentation — ✅ Completed
- [x] `copilot-instructions.md` — removed CSR homepage exception; page
      rendering section updated with CSR/override incompatibility warning
- [x] `implementation.instructions.md` — added `## Page Rendering` section
      documenting SSR-first requirement and the reason CSR breaks the override
      system
- [x] Anti-pattern updated: CSR exception note now requires documentation of
      override incompatibility

### Phase 5: Tests — ✅ Completed
- [x] `test/db/queries/articles-with-feed-title.test.ts` — 10 tests covering:
      happy path, null feedTitle (left join), empty result, default limit 20,
      default offset 0, custom limit/offset, hasMore probe pattern,
      leftJoin called, orderBy desc, column projection in select call

### Test / Type Fixes Applied During Implementation
- `test/routes/api/v1/articles.test.ts`: mock changed from `getArticles` →
  `getArticlesWithFeedTitle` (route no longer uses old function)
- `eject-reejection.test.ts`: removed unused `generatePageProxy` and
  `existsSync` imports (lint warnings)
- `integration.ts`: removed unused `AstroConfig` import
- `index.astro`: `sentinel.remove()` → `sentinel!.remove()` (non-null assertion
  inside async closure where TypeScript can't narrow)


_To be filled in as each phase completes._

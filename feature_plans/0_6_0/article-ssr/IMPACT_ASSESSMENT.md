# Impact Assessment: Article Page SSR Migration

## Summary

This document assesses the current Client-Side Rendering (CSR) approach
used by the article detail page (`/article/[id]`) and recommends
migrating to Server-Side Rendering (SSR). The analysis covers the
historical justification, technical impact, required changes, and
estimated effort.

**Recommendation:** Migrate the article detail page to SSR. The
framework already runs on Node.js with `@astrojs/node` — there are no
infrastructure constraints preventing SSR. The current CSR approach
was an implementation shortcut, not a deliberate architectural
decision.

---

## 1. Justification for the Current CSR Approach

### What the Code Does Today

The article detail page ([packages/core/src/pages/article/\[id\].astro](
../../../packages/core/src/pages/article/[id].astro)) serves an **empty
HTML shell** with placeholder elements (`<h1 id="article-title"></h1>`,
`<div id="article-body"></div>`, etc.). A `<script>` block then calls
`fetch('/api/v1/articles?id=...')` at runtime to populate the DOM via
`textContent` and `innerHTML` assignments.

### Why CSR Was Chosen (Historical Context)

Based on a review of the implementation notes across feature plans:

1. **Cloudflare Workers Origin (0.1.0–0.3.0):** The project originally
   targeted Cloudflare Workers with D1 as the database layer. Under this
   architecture, the article page was **already intended to be SSR** — the
   0.2.0 implementation plan Phase 4 explicitly states: *"Article detail
   page (`/article/[id]`) provides server-side rendering for direct URL
   access and SEO."* However, access to D1 was only available in Workers
   handlers and API routes, not in Astro page frontmatter during the
   Cloudflare era (Astro's Cloudflare adapter did not expose bindings to
   page components at build time). CSR was a **workaround** for the
   platform limitation.

2. **Architecture Migration (0.4.0):** The migration from Cloudflare to
   Node.js + `@astrojs/node` + better-sqlite3 **removed the platform
   constraint**. The `AppContext` (with `db`) became available via
   `Astro.locals.app` in every route handler. However, the article page
   was moved from `src/routes/pages/` to CLI scaffold templates and then
   (in 0.6.0) to `src/pages/` as an injected route — at each step the
   CSR pattern was carried forward without reassessment.

3. **Dual-Access Pattern:** The article page serves both as a standalone
   deep-link destination (direct URL) **and** as the `pushState` target
   when a user clicks an article in the modal. The modal's client-side
   navigation (`modal.ts`) uses `history.pushState` to update the URL
   without a full page load. This dual-access pattern made CSR feel
   natural — the data-fetching code could be shared between the modal
   and the standalone page. However, this conflation is unnecessary: the
   modal has its own rendering logic and does not rely on the `[id].astro`
   page's script.

### Bottom Line

**There was never a deliberate architectural decision to use CSR for
article pages.** It was a legacy of Cloudflare Workers constraints that
survived the 0.4.0 platform migration. The original intent (0.2.0 plan)
was always SSR.

---

## 2. Impact of Server-Side Rendering

### 2.1 SEO & Discoverability

| Aspect | CSR (Current) | SSR (Proposed) |
|--------|:---:|:---:|
| HTML contains article content | No — empty shell | Yes — full content |
| Search engine indexing | Depends on JS execution | Immediate |
| Social sharing (Open Graph) | Generic `<title>Article</title>` | Dynamic `<title>{article.title}</title>` |
| `<meta>` description | Static "Article detail" | Dynamic article summary |
| Core Web Vitals (LCP) | Poor — content loads after JS | Good — content in first paint |
| Accessibility (screen readers) | Delayed content discovery | Immediate content |

Article pages are the most indexable content in a community RSS platform.
CSR directly undermines the primary value of aggregated content.

### 2.2 Performance Impact

**Current CSR waterfall:**
1. Browser requests `/article/abc123` → server returns empty shell HTML
2. Browser parses HTML → encounters `<script>` block
3. JavaScript executes → calls `fetch('/api/v1/articles?id=abc123')`
4. Server receives API request → queries SQLite → returns JSON
5. JavaScript receives JSON → populates DOM → content visible

**Proposed SSR flow:**
1. Browser requests `/article/abc123` → server queries SQLite → returns
   full HTML with article content
2. Content visible immediately

The SSR approach eliminates **steps 2–5**, removing at minimum one full
network round-trip and the JavaScript execution overhead. For users on
slow connections or low-powered devices, this is significant.

### 2.3 Server Load Shift

| Metric | CSR | SSR | Delta |
|--------|-----|-----|-------|
| Requests per page view | 2 (page + API) | 1 (page only) | -1 request |
| Server-side DB queries | 1 (API handler) | 1 (frontmatter) | No change |
| HTML response size | ~2 KB (shell) | ~5–50 KB (with content) | Increase |
| Time to First Byte (TTFB) | ~10ms (shell) | ~15–25ms (with DB query) | +5–15ms |
| Time to Content Visible | ~200–400ms (fetch + render) | ~15–25ms (first paint) | -175–375ms |

The server does marginally more work per request (HTML rendering of the
content), but overall load **decreases** because the API call is
eliminated. The database query cost is identical — it simply moves from
the API handler to the page frontmatter.

### 2.4 API Route Impact

The `GET /api/v1/articles` endpoint currently serves two purposes:
1. **Homepage infinite scroll** — paginated article listing
2. **Article detail page** — single article fetch by ID

After SSR migration, the article detail page no longer calls the API.
The API endpoint continues to serve the homepage's infinite scroll and
any external integrations. **No changes to the API route are required.**
The existing `getArticleById()` query function in
`packages/core/src/db/queries/articles.ts` is reused directly in the
page frontmatter.

---

## 3. Updated Recommendation & Impact Assessment

### Recommendation: Migrate to SSR

The article detail page should be migrated to SSR. This aligns with:
- The **original architectural intent** documented in the 0.2.0 plan
- The **Astro Framework Architecture Guidelines** (0.5.0) which state:
  *"By keeping $T_{shell}$ low through server-side rendering and static
  site generation, the framework ensures a superior user experience."*
- The project's existing SSR infrastructure (`@astrojs/node` adapter,
  `AppContext` middleware, `Astro.locals.app`)
- The **Server Islands** pattern already used for auth-dependent UI
  (`AuthButton`, `HomepageCTA`)

### Required Changes

#### 3.1 Core Page Modification: `src/pages/article/[id].astro`

**What changes:**
- The `<script>` block (~60 lines of client-side fetch logic) is **removed**
- The Astro frontmatter gains a database query via `Astro.locals.app.db`
- HTML template is populated with article data from the frontmatter
- Dynamic `<title>` and `<meta>` tags for SEO
- Error handling moves from client-side to server-side (404 response)

**Before (CSR — current):**
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
const { id } = Astro.params;
---
<BaseLayout title="Article" description="Article detail">
  <article id="article-content" style="display: none;">
    <h1 id="article-title"></h1>
    <div id="article-body"></div>
  </article>
</BaseLayout>

<script define:vars={{ id }}>
  // 60+ lines of fetch + DOM manipulation
</script>
```

**After (SSR — proposed):**
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getArticleById } from '../../db/queries/articles';
import type { AppContext } from '../../types/context';

const { id } = Astro.params;
const app = Astro.locals.app as AppContext;

if (!id || !app?.db) {
  return Astro.redirect('/');
}

const article = await getArticleById(app.db, id);

if (!article) {
  return new Response('Not Found', { status: 404 });
  // Or render a custom 404 within the layout
}

const formattedDate = article.publishedAt
  ? new Date(article.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  : '';
---
<BaseLayout
  title={article.title}
  description={article.summary || `Article by ${article.authorName}`}
>
  <article class="crss-article">
    <header class="crss-article__header">
      <a href="/" class="crss-article__back">← Back to feed</a>
      <div class="crss-article__meta">
        {formattedDate && <time>{formattedDate}</time>}
        <span>by {article.authorName || 'Unknown'}</span>
      </div>
      <h1 class="crss-article__title">{article.title}</h1>
    </header>

    <div class="crss-article__content" set:html={article.content} />

    <footer class="crss-article__footer">
      {article.originalLink && (
        <a
          class="crss-article__original-link"
          href={article.originalLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read original article →
        </a>
      )}
    </footer>
  </article>
</BaseLayout>
```

#### 3.2 Ejected Page Template Update

If any developer has ejected the article page (via `npx crss eject
pages/article/[id]`), their local copy will continue to work unchanged—
Astro prioritizes local files over injected routes. However, the **eject
template** (the source file that `eject` copies from) must be updated to
reflect the SSR pattern.

**Files affected:**
- `packages/core/src/pages/article/[id].astro` — primary change

**Files NOT affected:**
- `packages/core/src/routes/api/v1/articles.ts` — no changes
- `packages/core/src/db/queries/articles.ts` — no changes (already
  exports `getArticleById`)
- `packages/core/src/components/ArticleModal.astro` — no changes (modal
  has its own rendering; it receives data via props, not from the page)
- `packages/core/src/utils/client/modal.ts` — no changes (the modal's
  `pushState` URL management is independent of how the [id] page renders)
- `packages/core/src/middleware.ts` — no changes
- `packages/core/src/integration.ts` — no changes

#### 3.3 Slot Registry Update

The `[id].astro` page's slot structure remains unchanged. The named
slots (`content`, `before-unnamed-slot`, `after-unnamed-slot`) are
preserved. The slot registry (`src/cli/slot-registry.mjs`) requires
**no modification**.

#### 3.4 SEO Enhancements (Optional, Recommended)

With SSR, the `BaseLayout` can receive a dynamic `<title>` and `<meta>`
tags. This is already supported — `BaseLayout` accepts `title` and
`description` props. The SSR migration naturally enables:

- `<title>{article.title} — Community RSS</title>`
- `<meta name="description" content="{article.summary}" />`
- `<meta property="og:title" content="{article.title}" />`
- `<meta property="og:description" content="{article.summary}" />`
- `<meta property="og:type" content="article" />`

These can be added as a follow-up enhancement without blocking the
core SSR migration.

#### 3.5 Homepage Consideration

The homepage (`src/pages/index.astro`) also uses CSR for the article
feed grid — articles are loaded client-side via infinite scroll. This
is a **different case** that should remain CSR for now because:

1. The homepage is a **paginated list** with infinite scroll — SSR for
   the initial page load is beneficial but requires careful handling of
   the scroll continuation
2. The homepage already renders structural components server-side
   (`TabBar`, `FeedGrid` shell, `HomepageCTA` via Server Island)
3. Migrating homepage to SSR-first-page + CSR-subsequent-pages is a
   larger effort with more complexity

A separate assessment should be done for the homepage if desired, but
it is not recommended as part of this change.

### Deployment & Infrastructure Changes

**None.** The framework already runs Astro SSR with `@astrojs/node`.
The article page frontmatter query uses the same `AppContext` pipeline
(middleware → `Astro.locals.app`) that all API routes and Server Islands
already use. No new infrastructure, no new dependencies, no pipeline
changes.

### Testing Impact

| Test Area | Impact |
|-----------|--------|
| `test/routes/api/v1/articles.test.ts` | No changes — API unaffected |
| `test/utils/client/modal.test.ts` | No changes — modal is independent |
| E2E (`e2e/pages/article-modal.spec.ts`) | May need minor adjustment if assertions check for loading states |
| E2E (`e2e/flows/article-browsing.spec.ts`) | Should pass — article content is now in initial HTML |
| New unit test | Test the SSR frontmatter logic (article not found → 404) |

### Breaking Change Assessment

**This is NOT a breaking change for framework consumers** because:

1. **Injected route:** The page is injected by the integration. The
   updated version ships automatically via `npm update`. Consumers who
   haven't ejected get the improvement for free.
2. **Ejected pages unaffected:** Consumers who ejected the article page
   retain their local copy. Their CSR version continues to work.
3. **API backward-compatible:** The `/api/v1/articles` endpoint is
   unchanged and continues to serve the homepage and external clients.
4. **Slot contract preserved:** All named slots remain available.

### Estimated Timeline & Effort

| Task | Effort | Notes |
|------|--------|-------|
| Modify `[id].astro` frontmatter + template | 1–2 hours | Straightforward — query exists, layout accepts dynamic title |
| Remove client-side `<script>` block | 15 minutes | Delete ~60 lines |
| Add proper 404 handling | 30 minutes | Return 404 Response or render error state |
| Add SEO meta tags (og:title, etc.) | 30 minutes | Optional but recommended |
| Update/add unit tests | 1 hour | Test 404, valid article, missing DB |
| Verify E2E tests pass | 30 minutes | Run existing Playwright suite |
| Update documentation | 30 minutes | Note SSR in architecture docs |
| **Total** | **~4–5 hours** | Single developer, single PR |

This is a low-risk, high-reward change. The `getArticleById()` function
already exists and is tested. The `AppContext` middleware is battle-tested
across all API routes. The change is localized to a single file.

---

## 4. Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|:---:|-----------|
| Increased TTFB for cold DB queries | Low | SQLite WAL mode + singleton connection already handle this |
| Large article content increases HTML size | Low | Content is already delivered as JSON in the CSR model — total bytes are comparable |
| Modal deep-link URL mismatch | None | `history.pushState` URL format is unchanged; hitting the URL directly now returns full HTML instead of a shell |
| Consumer ejected page breaks | None | Ejected pages are independent; the consumer's CSR version continues working |

---

## 5. Conclusion

The CSR approach on the article detail page is a vestige of the
Cloudflare Workers era. The constraint that necessitated it was removed
in 0.4.0. Migrating to SSR:

- **Restores the original design intent** (0.2.0 plan)
- **Improves SEO** for the framework's most indexable content
- **Eliminates a network round-trip** per article page view
- **Simplifies the codebase** by removing ~60 lines of client-side DOM
  manipulation
- **Requires no infrastructure changes** — uses existing middleware and
  database patterns
- **Is not a breaking change** — fully backward-compatible with ejected
  pages

**Estimated effort: 4–5 hours.** This can be included in the 0.6.0
release as a targeted improvement alongside the progressive
customization work, or delivered independently as a focused PR.

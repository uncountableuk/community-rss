# **Community Content Aggregation Framework (White-Label)**

*Project Specification & Architecture Document — MASTER REQUIREMENTS*

> **This document is the single source of truth for project requirements.**
> The Project Plan (`feature_plans/PROJECT_PLAN.md`) describes *how* and *when*
> to implement them. If there is any conflict, this spec takes precedence.

> **Revision History:**
> - **v1 (0.0.1):** Initial specification.
> - **v2 (0.4.0):** Infrastructure migration — Cloudflare → Docker/VPS;
>   "injected routes" → "integration with overrides" developer model.
> - **v3 (0.5.0):** Architecture refinement — three-tier design tokens,
>   CSS cascade layers, Astro Actions, Server Islands, Container API
>   email pipeline, Proxy Component pattern, E2E testing with Playwright.

## **1. Project Overview**

This project provides a robust, installable NPM framework
(@community-rss/core) for building highly interactive, white-labeled
content aggregation platforms. It allows community builders to curate
personal blogs and RSS feeds into a unified, interactive social experience.

The system is built on an **Astro SSR + Node.js** stack deployed via
Docker/VPS. The core logic (authentication, data syncing, database schemas,
API routes, and base UI components) is packaged as an Astro Integration.
Developers install the package, scaffold their project via CLI, configure
their styling and settings, and deploy a fully functional community site
that stays up-to-date with the core engine. FreshRSS acts purely as the
background ingestion engine.

## **2. User Roles & Authentication Models**

The platform supports a progressive engagement model, tracking interactions
from anonymous visitors up to verified publishers.

### **2.1 User Tiers**

1. **Guest (Cookie-Based):** Unauthenticated users. Upon their first
   interaction (Heart, Star, or Comment), a consent modal is presented.
   If accepted, a UUID is generated, stored in a cookie, and a "shadow
   profile" is created in the database to track their interactions.
2. **Registered User:** Users who have created an account via the sign-up
   flow.
   * *Sign-Up Flow:* When a user enters an email on the sign-in form that
     is not already registered, they are redirected to a sign-up page. The
     sign-up form collects: email address, display name, and consent to the
     Terms of Service. On submission, a welcome email is sent containing a
     magic-link verification URL. The user's account is not fully confirmed
     until they click this link. Only after verification can the user access
     their profile page.
   * *Upgrade Path:* When a Guest signs up, the system reads their UUID
     cookie and migrates all previously associated Hearts, Stars, and
     Comments to their new permanent Registered account.
   * *Sign-Out Lifecycle:* When a Registered User explicitly signs out,
     the Guest UUID cookie is cleared entirely. A new Guest UUID is only
     generated if the user later attempts an interaction (Heart, Star, or
     Comment) while signed out, triggering the consent modal again.
   * *Subsequent Sign-In:* Returning users enter their email on the sign-in
     form and receive a magic-link to authenticate. Once signed in, the
     header displays a link to their profile page alongside the sign-out
     button.
3. **Verified Author:** A Registered User who has submitted an RSS feed and
   successfully verified domain ownership.
4. **Admin:** Platform owner who configures categories, visual themes, and
   manages instance-wide settings.

### **2.3 Sign-Up & Registration**

The sign-up process follows a pre-check pattern to distinguish new users
from returning ones:

1. **Email Pre-Check:** When a user enters an email on the sign-in form,
   the system checks if the email is already registered. If the email is
   found, a standard sign-in magic link is sent. If not found, the user is
   redirected to the sign-up page with their email pre-filled.
2. **Sign-Up Form:** Collects the email (read-only, pre-filled), a display
   name, and a mandatory Terms of Service consent checkbox. On submission,
   the registration data is stored in a pending state and a welcome
   magic-link email is sent.
3. **Welcome Email & Verification:** The user receives a welcome email with
   a verification link. Clicking the link verifies the email, creates the
   user account (applying the display name and recording the terms consent
   timestamp), and establishes an authenticated session.
4. **Guest Migration:** If the signing-up user has an active guest cookie
   (from prior interactions), all their Hearts, Stars, and Comments are
   migrated to the new Registered account during verification. The guest
   shadow profile is deleted.
5. **Profile Access:** After successful verification, the user is redirected
   to their profile page. The header AuthButton updates to show their
   display name and a link to the profile page alongside a sign-out button.

### **2.4 User Profile**

Each Registered User has a profile page (`/profile`) that is accessible
only after email verification:

* **View:** Displays display name, email, bio, and (when available) avatar.
* **Edit:** Users can edit their display name and bio. Changes are saved via
  API and reflected immediately.
* **Email Change:** Users may update their email address, but the change
  requires re-verification before it takes effect.
* **Avatar:** Profile picture upload via S3 storage. *(Deferred until media
  pipeline is available.)*
* **Interactions:** View history of Hearts, Stars, and Comments. *(Available
  once the interactions system is implemented.)*
* **Feeds:** Manage submitted RSS feeds. *(Available once feed submission is
  implemented.)*

### **2.5 Global Settings & Permissions**

* **Comment Permissions:** Framework configuration allows the instance admin
  to restrict commenting to Verified Authors only, or open it up to
  Registered Users and Guests (all comments remain strictly moderated).
* **Feed Limits:** Admin-configurable limit on the number of feeds a
  Verified Author can submit (e.g., default 5).

## **3. Reader Experience & Interactivity**

### **3.1 Homepage Views (Tabbed Interface)**

The homepage features a masonry/grid layout with infinite scrolling. It
defaults to a tabbed interface:

* **My Feed (Following):** The default view for logged-in users. Displays
  an aggregated timeline of articles only from the specific feeds they have
  chosen to "Follow".
* **All Feeds:** The chronological "firehose" of all approved feeds in the
  community. (Default view for Guests).
* **Trending:** Highlights the top engaged posts based on an aggregated
  score of Hearts, Stars, and Comments. The time window (e.g., last 24
  hours, last 7 days) and the weighting of interactions are configurable
  by the instance admin.
* **Starred (Favorites):** A private list of articles the user has
  bookmarked for later reading.

### **3.2 Interactions (Hearts, Stars, Comments)**

* **Hearts:** A public appreciation metric. Users (including Guests,
  post-consent) can toggle a heart on an article. Prevented from multiple
  clicks via user ID / Guest UUID tracking.
* **Stars:** A private bookmarking tool to save articles to the "Starred"
  tab.
* **Comments:** Users can leave comments on articles.
  * *Moderation:* All comments require approval. Authors receive an email
    containing direct "Magic Links" to instantly Approve or Reject new
    comments without needing to log in.

### **3.3 Article Modal**

Clicking a feed card opens the full, sanitized article in a modal overlay.

* **Deep Linking:** The URL updates via pushState (e.g., /article/[id]) to
  allow sharing.
* **Navigation:** In-modal controls for "Next" and "Previous" articles
  based on the current list context (Following vs. All vs. Trending).

## **4. Feed Submission & Author Profiles**

### **4.1 Feed Verification (Domain Level)**

* Users can submit their personal RSS feeds.
* The system generates a unique verification code. The user places this
  code on any page matching the feed's root domain.
* The platform performs a real-time HTTP fetch to verify the code.
* Once verified, a "Connected" badge appears, and subsequent feeds from the
  same root domain bypass verification.
* Users must accept a legal consent checkbox confirming ownership and
  granting display rights.

### **4.2 Author Profiles**

* Dedicated pages (/author/[username]) displaying the author's avatar, bio,
  and a filtered timeline of only their submitted feeds.
* Users can click "Follow" on an author's profile or directly on their feed
  cards.

### **4.3 Feed Management & Cascading Deletion**

When a Verified Author removes a feed from their profile, a strict data
lifecycle policy is enforced to ensure privacy and optimize storage:

* **FreshRSS Cleanup:** An API call is made to FreshRSS to unsubscribe and
  remove the feed from the ingestion engine.
* **Database Cleanup:** All articles, comments, hearts, and stars associated
  with that specific feed are permanently deleted from the database.
* **Media Cleanup:** A background job is triggered to locate and delete all
  cached images associated with the feed's articles from the S3 storage
  bucket.

## **5. Technical Architecture & Implementation**

The architecture leverages a decoupled, Docker-deployed stack packaged via
NPM.

### **5.1 The NPM Package (@community-rss/core)**

The framework utilises a **split-ownership architecture** (integration with
overrides):

* **Injected API Routes:** The package automatically injects core API routes
  (`/api/auth/[...all]`, `/api/v1/articles`, `/api/v1/interactions`, etc.)
  into the developer's Astro project via the Integration API. Authentication
  routes are handled by a single catch-all that delegates to better-auth's
  native router.
* **Scaffolded Pages (Developer-Owned):** `npx @community-rss/core init`
  scaffolds page routes into the developer's `src/pages/` directory. These
  pages import components from the package but are fully owned by the
  developer — package updates never overwrite them.
* **Exported Components:** UI components (`FeedCard.astro`,
  `AuthButton.astro`, etc.) are imported from the package. They use the
  Proxy Component pattern — scaffolded wrappers delegate rendering to core
  components, allowing framework updates without breaking custom styling.
* **Email Templates (Developer-Owned):** Email templates are scaffolded into
  the developer's project. The framework resolves templates with a priority
  chain: developer directory → package defaults → code-based fallbacks.

### **5.2 Infrastructure Components**

1. **Frontend/App Server:** Astro SSR running on Node.js (`@astrojs/node`),
   deployed behind a reverse proxy.
2. **Primary Database:** SQLite (better-sqlite3) in WAL mode. File-based,
   zero-configuration. Managed via Drizzle ORM.
3. **Background Processing:** `node-cron` for in-process scheduled feed
   sync.
4. **Image/Blob Storage:** MinIO or any S3-compatible service for media
   caching.
5. **Ingestion Engine:** FreshRSS, hosted in Docker, polled via GReader API.
6. **Email & Auth:** Resend (production) + Mailpit (development) for
   transactional email. better-auth for authentication (magic-link plugin,
   Drizzle adapter for SQLite).
7. **Container Orchestration:** Docker Compose for full-stack deployment
   (app + FreshRSS + MinIO + Mailpit).

### **5.3 Data Synchronization Flow**

Feed data is synced from FreshRSS to the local SQLite database:

1. **Cron Schedule:** `node-cron` triggers `syncFeeds()` at a developer-
   configured interval.
2. **Inline Processing:** New articles are processed inline — HTML
   sanitisation and article metadata extraction happen synchronously during
   the sync cycle.
3. **Sync Idempotency:** Each article stores a `freshrss_item_id` (the
   stable unique identifier from the FreshRSS GReader API). This column has
   a UNIQUE index. The sync upsert uses
   `ON CONFLICT (freshrss_item_id) DO UPDATE` to prevent duplicate
   insertion.

### **5.4 Media & Image Caching Strategy (S3)**

To prevent broken images, CORS issues, and mixed-content warnings, all
images within RSS articles are locally cached:

* **Immediate Publication:** Articles are saved to the database and
  published immediately using the original external image URLs.
* **Background Processing:** A scheduled job asynchronously processes
  images:
  * HTML is parsed (via Cheerio) and all `<img>` tags pointing to external
    domains are extracted.
  * Images are downloaded and uploaded to the configured S3-compatible
    bucket (MinIO).
  * On success, the article content is updated with rewritten URLs pointing
    to the media domain.
* **Failure Handling:** If an image download fails after 3 retries, the
  article retains the original external `src` URL as a fallback.
  A `media_pending` flag tracks unprocessed media.
* **Cleanup:** When a feed is removed, all associated S3 objects and media
  tracking records are deleted.

### **5.5 Database Schema Workflow (Drizzle-First)**

* The canonical schema is defined in TypeScript using Drizzle ORM
  (`packages/core/src/db/schema.ts`).
* SQL migration files are **generated** by running
  `npx drizzle-kit generate` — never hand-written.
* Migrations are applied via `npx drizzle-kit migrate` or
  `npx drizzle-kit push`.
* The Drizzle TypeScript definitions are the single source of truth for the
  database structure.
* better-auth tables (user, session, account, verification) are
  incorporated into the same Drizzle schema file.

### **5.6 Astro Integration Route Injection**

* Astro's `injectRoute` API requires a `pattern` and an `entrypoint` (the
  absolute file path to the handler).
* File paths are resolved using
  `new URL('./routes/api/v1/articles.ts', import.meta.url).pathname`.
* All injected API routes are registered in the integration's
  `astro:config:setup` hook.
* Middleware is registered via `addMiddleware` in the same hook, providing
  `AppContext` via `Astro.locals.app`.

### **5.7 better-auth Runtime Configuration**

* better-auth must be configured with
  `baseURL: process.env.PUBLIC_SITE_URL` (which resolves to
  `http://localhost:4321` in local dev).
* The `PUBLIC_SITE_URL` value is defined in the project `.env` file and must
  match the externally-accessible origin.

### **5.8 Three-Tier Design Token System** *(Added 0.5.0)*

The framework implements a three-tier CSS custom property hierarchy for
maximum theming flexibility:

1. **Reference Tokens:** Define the foundational design palette — raw colour
   values, spacing scales, font stacks. Prefixed `--crss-ref-*`. These are
   the "raw ingredients" of the UI and rarely overridden by consumers.
2. **System Tokens:** Map reference tokens to functional/semantic roles.
   Prefixed `--crss-sys-*`. Example:
   `--crss-sys-color-primary: var(--crss-ref-indigo-500)`. This is the
   **primary customisation layer** for branding.
3. **Component Tokens:** Scoped within specific components for fine-tuned
   overrides without affecting the global theme. Prefixed `--crss-comp-*`.
   Example: `--crss-comp-btn-bg: var(--crss-sys-color-primary)`.

Token files are structured as:
```
packages/core/src/styles/
 tokens/
   ├── reference.css    # Raw values (palette, scale, typography)
   ├── system.css       # Semantic mappings (primary, background, success)
   └── components.css   # Component-scoped overrides
 layers.css           # @layer declarations and base resets
```

### **5.9 CSS Cascade Layers** *(Added 0.5.0)*

The framework uses CSS `@layer` to establish a deterministic cascade order:

```css
@layer crss-reset, crss-tokens, crss-base, crss-components, crss-utilities;
```

* **crss-reset:** Minimal CSS reset / normalisation.
* **crss-tokens:** All design token definitions (:root custom properties).
* **crss-base:** Global element styles (body, headings, links).
* **crss-components:** Framework component styles.
* **crss-utilities:** Utility classes (layout helpers, visibility toggles).

Consumer stylesheets loaded **after** the framework's layers always have
higher specificity, ensuring that `theme.css` overrides work reliably
without `!important` hacks or specificity tricks.

### **5.10 Astro Actions (Typed Client-Server Bridge)** *(Added 0.5.0)*

The framework uses Astro Actions to replace raw `fetch()` calls with
type-safe RPC between client scripts and server-side logic:

* **Action Definitions:** The core package exports action handler functions.
  The CLI scaffolds an `src/actions/index.ts` that registers these with
  Astro's Action system.
* **Client Usage:** Scaffolded pages and client scripts call
  `actions.fetchArticles()`, `actions.checkEmail()`, etc., instead of
  constructing fetch URLs manually.
* **Type Safety:** Actions provide compile-time validation of
  request/response shapes, eliminating a class of runtime errors.
* **Backward Compatibility:** Injected API routes (`/api/v1/*`) remain
  functional — Actions are an additional typed layer, not a replacement.

### **5.11 Server Islands (Dynamic Authenticated UI)** *(Added 0.5.0)*

Components that depend on authentication state (e.g., `AuthButton`) use
Astro's Server Islands pattern:

* The initial HTML shell is delivered instantly as static content.
* Dynamic server-rendered islands (session-dependent UI) load
  asynchronously.
* This keeps the initial page load fast (pure static HTML) while
  personalised content streams in.
* Particularly important for the homepage where the authenticated header
  and guest CTA must reflect current session state.

### **5.12 Email Template Pipeline (Container API)** *(Added 0.5.0)*

Email templates are authored as `.astro` components and compiled to
self-contained HTML using the Astro Container API:

1. **Authoring:** Email templates are `.astro` components that accept props
   (recipient name, verification URL, etc.) and use the framework's design
   tokens.
2. **Compilation:** At build time (or on-demand at runtime), the Container
   API renders the `.astro` component into a static HTML string.
3. **Style Inlining:** Post-render processing inlines CSS into HTML element
   `style` attributes for email client compatibility.
4. **Delivery:** The compiled HTML is passed to the email transport (Resend
   or SMTP) for delivery.
5. **Developer Override:** Developers can create custom `.astro` email
   components in their project. The resolution chain: developer's
   `src/email-templates/` → package defaults.

### **5.13 Proxy Component Architecture** *(Added 0.5.0)*

To support clean upgradeability, the framework adopts a Proxy Component
pattern:

* **Headless Core Components:** The package provides logic-focused
  components that handle data fetching, state management, and
  accessibility — with minimal styling relying on design tokens.
* **Scaffolded Wrapper Components:** The CLI creates styled wrapper
  components in the developer's project that import and compose the core
  components. Developers own the visual layer.
* **Upgrade Path:** When the package updates internal logic (e.g.,
  debouncing a button, changing a data format), the core component updates
  via `npm update`. The developer's wrapper component style is untouched.
* **Current Scope:** For 0.5.0, existing components are refactored to
  cleanly separate logic from presentation via props, slots, and CSS custom
  properties — preparing for full headless extraction in future releases.

### **5.14 End-to-End Testing (Playwright)** *(Added 0.5.0)*

The reference application (playground) has comprehensive E2E tests using
Playwright:

* **Coverage:** Every user-facing page and interaction flow is tested —
  homepage, article modal, sign-in, sign-up, profile editing, email change,
  consent modal, tab navigation.
* **Multi-Browser:** Tests run against Chromium, Firefox, and WebKit.
* **CI Integration:** Playwright tests run headless in Docker as part of the
  CI pipeline.
* **Test Location:** `e2e/` directory at the repo root, testing the full
  playground application.
* **Relationship to Unit Tests:** E2E tests complement (not replace) the
  existing Vitest unit and integration test suite. Unit tests validate
  business logic in isolation; E2E tests validate the assembled application
  from the user's perspective.

## **6. High-Level Data Model**

All tables below are defined in Drizzle ORM TypeScript
(`packages/core/src/db/schema.ts`). SQL migrations are generated — never
hand-written.

* users: id, email (nullable for guests), is_guest (boolean), name, bio,
  avatar_url, terms_accepted_at (timestamp, nullable), created_at,
  updated_at.
* sessions, accounts, verifications: managed by better-auth (schema
  generated via CLI and merged into the Drizzle schema).
* pending_signups: email (PK), name, terms_accepted_at, created_at.
  Temporary storage for sign-up data between form submission and magic-link
  verification.
* verified_domains: id, user_id, domain_name, verified_at.
* feeds: id, user_id, feed_url, title, description, category, status,
  consent_at, created_at.
* articles: id, feed_id, freshrss_item_id (UNIQUE — sync idempotency key),
  title, content, summary, original_link, author_name, published_at,
  synced_at, media_pending (boolean, default true).
* followers: user_id, target_user_id (Composite PK).
* interactions: user_id, article_id, type ('heart' or 'star') (Composite
  PK), created_at.
* comments: id, article_id, user_id, content, status
  (pending/approved/rejected), created_at.
* media_cache: id, article_id, original_url, storage_key, cached_at.

## **7. Developer Experience (DX) & Deployment**

To launch a community, a developer will follow these steps:

1. Initialize a new Astro project: `npm create astro@latest`
2. Install the framework: `npm install @community-rss/core`
3. Scaffold the project: `npx @community-rss/core init`
   — Creates pages, email templates, config files, theme.css,
   docker-compose.yml.
4. Add the integration to `astro.config.mjs` and pass config options
   (theme, comment tiers, trending thresholds).
5. Configure `.env` with database path, FreshRSS credentials, email
   provider settings.
6. Run `npx drizzle-kit push` to initialise the database schema.
7. Start Docker Compose: `docker-compose up` — runs FreshRSS, MinIO,
   Mailpit.
8. Start dev server: `npm run dev` — serves on `http://localhost:4321`.
9. Deploy: Build with `npm run build`, deploy via Docker Compose on any
   VPS.

### **7.1 AI-Native Architecture Guidance** *(Added 0.5.0)*

The framework provides structured instructions for AI coding assistants at
two levels:

* **Framework-Developer Instructions:** Located in `.github/instructions/`
  — guide core contributors in maintaining API stability, test coverage,
  and the integration lifecycle.
* **Framework-User Instructions:** Scaffolded into the developer's project
  via CLI — guide consumer-facing AI assistants to respect architectural
  boundaries: use design tokens (not hardcoded values), call Actions (not
  raw endpoints), modify only developer-owned files (not `node_modules`).

## **8. Architecture Principles** *(Added 0.5.0)*

These guiding principles inform all architectural decisions in the
framework:

### **8.1 Adopted Principles**

| Principle | Implementation | Rationale |
|-----------|---------------|-----------|
| **Integration API as Backbone** | `astro:config:setup` hook for route injection, middleware, Vite config | Core logic updates via `npm update` without touching user files |
| **Proxy Component Pattern** | Headless core + styled scaffold wrappers | Upgradeable logic, user-owned presentation |
| **Three-Tier Design Tokens** | Reference → System → Component CSS custom properties | Granular theming without specificity conflicts |
| **CSS Cascade Layers** | `@layer` for deterministic cascade order | Consumer styles always override framework defaults |
| **Astro Actions** | Type-safe client-server RPC | Eliminates URL coupling; compile-time validation |
| **Server Islands** | Async server-rendered auth-dependent UI | Fast static shell, streamed personalisation |
| **Container API Emails** | `.astro` components compiled to inlined HTML | Shared tokens between web and email; component reuse |
| **Decoupled Client Logic** | `utils/client/*.ts` — importable modules | Developers import logic separately from UI |
| **Middleware Data Contract** | `context.locals.app` provides `db`, `env`, `config` | Clean separation; pages don't know about DB setup |
| **E2E Testing** | Playwright for the reference application | Validates assembled application from user perspective |

### **8.2 Deferred Principles (Documented for Future)**

| Principle | Reason for Deferral | Target Release |
|-----------|---------------------|----------------|
| **Codemods (AST migrations)** | No breaking changes yet; premature until post-1.0.0 | 1.0.0+ |
| **Full Inversion of Control** | Config-based extension is sufficient; pluggable provider interfaces add premature complexity | 1.0.0+ |
| **RSSProvider Interface** | FreshRSS is the sole ingestion engine; abstracting providers is premature | 1.0.0+ |
| **Dependency Injection** | Swappable database/auth engines are a future concern | 1.0.0+ |

### **8.3 Not Adopted (Impractical for This Project)**

| Guideline Recommendation | Reason |
|--------------------------|--------|
| WebSocket real-time updates | Not in project scope; RSS is inherently poll-based |
| RSS feed generation (`astro:build:done`) | We consume feeds via FreshRSS, not generate them |
| Full DI container pattern | Over-engineered for a framework with a fixed technology stack |

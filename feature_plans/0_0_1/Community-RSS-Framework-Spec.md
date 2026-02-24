# **Community Content Aggregation Framework (White-Label)**

*Project Specification & Architecture Document — MASTER REQUIREMENTS*

> **This document is the single source of truth for project requirements.**
> The Project Plan (`feature_plans/PROJECT_PLAN.md`) describes *how* and *when*
> to implement them. If there is any conflict, this spec takes precedence.

## **1\. Project Overview**

This project provides a robust, installable NPM framework (@community-rss/core) for building highly interactive, white-labeled content aggregation platforms. It allows community builders to curate personal blogs and RSS feeds into a unified, interactive social experience.

The system is built on an **Astro SSR \+ Cloudflare** stack. The core logic (authentication, data syncing, database schemas, API routes, and base UI components) is packaged as an Astro Integration. Developers install the package, configure their styling and WAF rules, and deploy a fully functional community site that stays up-to-date with the core engine. FreshRSS acts purely as the background ingestion engine.

## **2\. User Roles & Authentication Models**

The platform supports a progressive engagement model, tracking interactions from anonymous visitors up to verified publishers.

### **2.1 User Tiers**

1. **Guest (Cookie-Based):** Unauthenticated users. Upon their first interaction (Heart, Star, or Comment), a consent modal is presented. If accepted, a UUID is generated, stored in a cookie, and a "shadow profile" is created in the database to track their interactions.  
2. **Registered User:** Users who have created an account via the sign-up flow.  
   * *Sign-Up Flow:* When a user enters an email on the sign-in form that is not already registered, they are redirected to a sign-up page. The sign-up form collects: email address, display name, and consent to the Terms of Service. On submission, a welcome email is sent containing a magic-link verification URL. The user's account is not fully confirmed until they click this link. Only after verification can the user access their profile page.
   * *Upgrade Path:* When a Guest signs up, the system reads their UUID cookie and migrates all previously associated Hearts, Stars, and Comments to their new permanent Registered account.  
   * *Sign-Out Lifecycle:* When a Registered User explicitly signs out, the Guest UUID cookie is cleared entirely. A new Guest UUID is only generated if the user later attempts an interaction (Heart, Star, or Comment) while signed out, triggering the consent modal again.  
   * *Subsequent Sign-In:* Returning users enter their email on the sign-in form and receive a magic-link to authenticate. Once signed in, the header displays a link to their profile page alongside the sign-out button.
3. **Verified Author:** A Registered User who has submitted an RSS feed and successfully verified domain ownership.  
4. **Admin:** Platform owner who configures categories, visual themes, and manages instance-wide settings.

### **2.3 Sign-Up & Registration**

The sign-up process follows a pre-check pattern to distinguish new users from returning ones:

1. **Email Pre-Check:** When a user enters an email on the sign-in form, the system checks if the email is already registered. If the email is found, a standard sign-in magic link is sent. If not found, the user is redirected to the sign-up page with their email pre-filled.
2. **Sign-Up Form:** Collects the email (read-only, pre-filled), a display name, and a mandatory Terms of Service consent checkbox. On submission, the registration data is stored in a pending state and a welcome magic-link email is sent.
3. **Welcome Email & Verification:** The user receives a welcome email with a verification link. Clicking the link verifies the email, creates the user account (applying the display name and recording the terms consent timestamp), and establishes an authenticated session.
4. **Guest Migration:** If the signing-up user has an active guest cookie (from prior interactions), all their Hearts, Stars, and Comments are migrated to the new Registered account during verification. The guest shadow profile is deleted.
5. **Profile Access:** After successful verification, the user is redirected to their profile page. The header AuthButton updates to show their display name and a link to the profile page alongside a sign-out button.

### **2.4 User Profile**

Each Registered User has a profile page (`/profile`) that is accessible only after email verification:

* **View:** Displays display name, email, bio, and (when available) avatar.
* **Edit:** Users can edit their display name and bio. Changes are saved via API and reflected immediately.
* **Email Change:** Users may update their email address, but the change requires re-verification before it takes effect. *(Deferred to a future release.)*
* **Avatar:** Profile picture upload via R2 storage. *(Deferred until media pipeline is available.)*
* **Interactions:** View history of Hearts, Stars, and Comments. *(Available once the interactions system is implemented.)*
* **Feeds:** Manage submitted RSS feeds. *(Available once feed submission is implemented.)*

### **2.5 Global Settings & Permissions**

* **Comment Permissions:** Framework configuration allows the instance admin to restrict commenting to Verified Authors only, or open it up to Registered Users and Guests (all comments remain strictly moderated).  
* **Feed Limits:** Admin-configurable limit on the number of feeds a Verified Author can submit (e.g., default 5).

## **3\. Reader Experience & Interactivity**

### **3.1 Homepage Views (Tabbed Interface)**

The homepage features a masonry/grid layout with infinite scrolling. It defaults to a tabbed interface:

* **My Feed (Following):** The default view for logged-in users. Displays an aggregated timeline of articles only from the specific feeds they have chosen to "Follow".  
* **All Feeds:** The chronological "firehose" of all approved feeds in the community. (Default view for Guests).  
* **Trending:** Highlights the top engaged posts based on an aggregated score of Hearts, Stars, and Comments. The time window (e.g., last 24 hours, last 7 days) and the weighting of interactions are configurable by the instance admin.  
* **Starred (Favorites):** A private list of articles the user has bookmarked for later reading.

### **3.2 Interactions (Hearts, Stars, Comments)**

* **Hearts:** A public appreciation metric. Users (including Guests, post-consent) can toggle a heart on an article. Prevented from multiple clicks via user ID / Guest UUID tracking.  
* **Stars:** A private bookmarking tool to save articles to the "Starred" tab.  
* **Comments:** Users can leave comments on articles.  
  * *Moderation:* All comments require approval. Authors receive an email containing direct "Magic Links" to instantly Approve or Reject new comments without needing to log in.

### **3.3 Article Modal**

Clicking a feed card opens the full, sanitized article in a modal overlay.

* **Deep Linking:** The URL updates via pushState (e.g., /article/\[id\]) to allow sharing.  
* **Navigation:** In-modal controls for "Next" and "Previous" articles based on the current list context (Following vs. All vs. Trending).

## **4\. Feed Submission & Author Profiles**

### **4.1 Feed Verification (Domain Level)**

* Users can submit their personal RSS feeds.  
* The system generates a unique verification code. The user places this code on any page matching the feed's root domain.  
* The platform performs a real-time HTTP fetch to verify the code.  
* Once verified, a "Connected" badge appears, and subsequent feeds from the same root domain bypass verification.  
* Users must accept a legal consent checkbox confirming ownership and granting display rights.

### **4.2 Author Profiles**

* Dedicated pages (/author/\[username\]) displaying the author's avatar, bio, and a filtered timeline of only their submitted feeds.  
* Users can click "Follow" on an author's profile or directly on their feed cards.

### **4.3 Feed Management & Cascading Deletion**

When a Verified Author removes a feed from their profile, a strict data lifecycle policy is enforced to ensure privacy and optimize storage:

* **FreshRSS Cleanup:** An API call is made to FreshRSS to unsubscribe and remove the feed from the ingestion engine.  
* **Database Cleanup:** All articles, comments, hearts, and stars associated with that specific feed are permanently deleted from the D1 database.  
* **Media Cleanup:** A background job is triggered to locate and delete all cached images associated with the feed's articles from the S3/R2 storage bucket.

## **5\. Technical Architecture & Implementation**

The architecture leverages a heavily decoupled, Cloudflare-native stack packaged via NPM.

### **5.1 The NPM Package (@community-rss/core)**

The framework utilizes **Astro's "Option A" routing strategy**:

* **Injected Routes:** The package automatically injects core API routes (/api/auth/\[...all\], /api/v1/articles, /api/v1/interactions, etc.) and default page layouts into the developer's Astro project. Authentication routes are handled by a single catch-all (`/api/auth/[...all]`) that delegates to better-auth's native router.  
* **Shadowing/Overriding:** Developers can override any default component or page by creating a file with the identical path in their own src/ directory.  
* **Cloudflare Worker Exports:** The package exports the specific Cloudflare Cron handlers and Queue consumers needed for background syncing.

### **5.2 Infrastructure Components (Cloudflare \+ FreshRSS)**

1. **Frontend/App Server:** Cloudflare Pages running the Astro SSR application.  
2. **Primary Database:** Cloudflare **D1** (Serverless SQLite). One isolated database per community instance.  
3. **Background Processing:** Cloudflare **Queues** & **Cron Triggers**.  
4. **Image/Blob Storage:** Cloudflare R2 or DigitalOcean Spaces (S3 compatible) for media caching.  
5. **Ingestion Engine:** **FreshRSS**, hosted separately, locked behind Cloudflare Zero Trust.  
6. **Email & Auth:** **Resend** (Transactional emails) \+ **better-auth** (Authentication & session management, with magic-link plugin and Drizzle adapter for D1/SQLite).

### **5.3 Data Synchronization Flow (Background Workers)**

To ensure frontend speed and relational data integrity, feed data is synced to D1:

1. **Cron Trigger:** A developer-configured Cloudflare Cron calls the exported syncFeeds() function from the NPM package, polling the FreshRSS API.  
2. **Queue Worker:** New articles are placed in a Cloudflare Queue. The exported consumer function handles HTML sanitization and triggers the Image Caching pipeline (see 5.4).  
3. **Zero Trust Networking:** API routes communicate with the isolated FreshRSS instance using HTTP headers (CF-Access-Client-Id and CF-Access-Client-Secret).  
4. **Sync Idempotency:** Each article stores a `freshrss_item_id` (the stable unique identifier from the FreshRSS GReader API). This column has a UNIQUE index. The sync upsert uses `ON CONFLICT (freshrss_item_id) DO UPDATE` to update modified articles and `DO NOTHING` for unchanged ones, preventing duplicate insertion across repeated Cron runs.

### **5.4 Media & Image Caching Strategy (S3/R2)**

To prevent broken images, CORS issues, and mixed-content warnings, all images within RSS articles are locally cached:

* **Immediate Publication:** Articles are saved to D1 and published immediately using the original external image URLs. This ensures articles are never blocked by slow or failing image downloads.  
* **Background Processing:** A Queue consumer asynchronously processes images:
  * The HTML is parsed (via Cheerio) and all \<img\> tags pointing to external domains are extracted.  
  * The worker downloads each image and uploads it to the configured S3-compatible bucket (e.g., DigitalOcean Spaces or Cloudflare R2).  
  * On success, the worker runs `UPDATE articles SET content = rewritten_html WHERE id = X`, replacing external URLs with the community's custom media subdomain (e.g., https://media.community.com/img-id.jpg).  
* **Failure Handling:** If an image download fails after 3 retries, the article retains the original external `src` URL as a fallback. A `media_pending` flag on the article tracks unprocessed media. A periodic background job retries any articles still flagged, catching transient failures without blocking the reader experience.  
* **Cleanup:** When a feed is removed, all associated R2 objects and media tracking records are deleted via a queued cleanup job.

### **5.5 Database Schema Workflow (Drizzle-First)**

The framework adopts a **Drizzle-First** workflow for all database schema management:

* The canonical schema is defined in TypeScript using Drizzle ORM (`packages/core/src/db/schema.ts`).  
* SQL migration files are **generated** by running `npx drizzle-kit generate` — never hand-written.  
* Migrations are applied via `npx wrangler d1 migrations apply` (production) or `npx wrangler d1 migrations apply --local` (development).  
* No `schema.sql` file is maintained — the Drizzle TypeScript definitions are the single source of truth for the database structure, eliminating the risk of schema drift.  
* better-auth tables (user, session, account, verification) are incorporated into the same Drizzle schema file or generated via `npx @better-auth/cli generate` and merged.

### **5.6 Astro Integration Route Injection**

* Astro's `injectRoute` API requires a `pattern` (e.g., `/api/v1/articles`) and an `entrypoint` (the absolute file path to the `.ts` or `.astro` handler inside the package).  
* File paths must be resolved safely using `new URL('./routes/api/v1/articles.ts', import.meta.url).pathname` to prevent build-step obfuscation from breaking route resolution.  
* All injected routes are registered in the integration's `astro:config:setup` hook.

### **5.7 better-auth Local Development**

* better-auth must be configured with `baseURL: process.env.PUBLIC_SITE_URL` (which resolves to `http://localhost:4321` in local dev).  
* Without this, magic-link generation and cookie setting will fail silently because better-auth misidentifies the request origin as internal Docker networking rather than the host browser.  
* The `PUBLIC_SITE_URL` value is defined in `playground/.dev.vars` and must match the externally-accessible origin.

## **6\. High-Level Data Model (Cloudflare D1)**

All tables below are defined in Drizzle ORM TypeScript (`packages/core/src/db/schema.ts`). SQL migrations are generated — never hand-written.

* users: id, email (nullable for guests), is\_guest (boolean), name, bio, avatar\_url, terms\_accepted\_at (timestamp, nullable), created\_at, updated\_at.  
* sessions, accounts, verifications: managed by better-auth (schema generated via CLI and merged into the Drizzle schema).  
* pending\_signups: email (PK), name, terms\_accepted\_at, created\_at. Temporary storage for sign-up data between form submission and magic-link verification.  
* verified\_domains: id, user\_id, domain\_name, verified\_at.  
* feeds: id, user\_id, feed\_url, title, description, category, status, consent\_at, created\_at.  
* articles: id, feed\_id, freshrss\_item\_id (UNIQUE — sync idempotency key), title, content, summary, original\_link, author\_name, published\_at, synced\_at, media\_pending (boolean, default true).  
* followers: user\_id, target\_user\_id (Composite PK).  
* interactions: user\_id, article\_id, type ('heart' or 'star') (Composite PK), created\_at.  
* comments: id, article\_id, user\_id, content, status (pending/approved/rejected), created\_at.  
* media\_cache: id, article\_id, original\_url, storage\_key, cached\_at.

## **7\. Developer Experience (DX) & Deployment**

To launch a community, a developer will follow these steps:

1. Initialize a new Astro project: npm create astro@latest  
2. Install the framework: npm install @community-rss/core  
3. Add the integration to astro.config.mjs and pass config options (theme colors, allowed comment tiers, trending thresholds).  
4. Setup their wrangler.toml with D1, R2, and Queue bindings.  
5. Configure the Cloudflare adapter's worker entrypoint to export the package's background handlers.  
   **Note:** The default `@astrojs/cloudflare` adapter builds its own `_worker.js` and may ignore a standalone `src/worker.ts`. Developers must either pass a custom entrypoint to the adapter config or use the integration's built-in injection of `scheduled` and `queue` exports.  
   export { scheduled, queue } from '@community-rss/core/workers';  
6. Run `npx drizzle-kit generate` and `npx wrangler d1 migrations apply` to initialise the database.  
7. Deploy via npx wrangler pages deploy.
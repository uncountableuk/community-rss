# **Community Content Aggregation Framework (White-Label)**

*Project Specification & Architecture Document*

## **1\. Project Overview**

This project provides a robust, installable NPM framework (@community-rss/core) for building highly interactive, white-labeled content aggregation platforms. It allows community builders to curate personal blogs and RSS feeds into a unified, interactive social experience.

The system is built on an **Astro SSR \+ Cloudflare** stack. The core logic (authentication, data syncing, database schemas, API routes, and base UI components) is packaged as an Astro Integration. Developers install the package, configure their styling and WAF rules, and deploy a fully functional community site that stays up-to-date with the core engine. FreshRSS acts purely as the background ingestion engine.

## **2\. User Roles & Authentication Models**

The platform supports a progressive engagement model, tracking interactions from anonymous visitors up to verified publishers.

### **2.1 User Tiers**

1. **Guest (Cookie-Based):** Unauthenticated users. Upon their first interaction (Heart, Star, or Comment), a consent modal is presented. If accepted, a UUID is generated, stored in a cookie, and a "shadow profile" is created in the database to track their interactions.  
2. **Registered User:** Users who have created an account via magic-link email.  
   * *Upgrade Path:* When a Guest signs up, the system reads their UUID cookie and migrates all previously associated Hearts, Stars, and Comments to their new permanent Registered account.  
3. **Verified Author:** A Registered User who has submitted an RSS feed and successfully verified domain ownership.  
4. **Admin:** Platform owner who configures categories, visual themes, and manages instance-wide settings.

### **2.2 Global Settings & Permissions**

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

* **Injected Routes:** The package automatically injects core API routes (/api/auth, /api/sync, /api/interact) and default page layouts into the developer's Astro project.  
* **Shadowing/Overriding:** Developers can override any default component or page by creating a file with the identical path in their own src/ directory.  
* **Cloudflare Worker Exports:** The package exports the specific Cloudflare Cron handlers and Queue consumers needed for background syncing.

### **5.2 Infrastructure Components (Cloudflare \+ FreshRSS)**

1. **Frontend/App Server:** Cloudflare Pages running the Astro SSR application.  
2. **Primary Database:** Cloudflare **D1** (Serverless SQLite). One isolated database per community instance.  
3. **Background Processing:** Cloudflare **Queues** & **Cron Triggers**.  
4. **Image/Blob Storage:** Cloudflare R2 or DigitalOcean Spaces (S3 compatible) for media caching.  
5. **Ingestion Engine:** **FreshRSS**, hosted separately, locked behind Cloudflare Zero Trust.  
6. **Email & Auth:** **Resend** (Transactional emails) \+ **Lucia Auth** (Session management).

### **5.3 Data Synchronization Flow (Background Workers)**

To ensure frontend speed and relational data integrity, feed data is synced to D1:

1. **Cron Trigger:** A developer-configured Cloudflare Cron calls the exported syncFeeds() function from the NPM package, polling the FreshRSS API.  
2. **Queue Worker:** New articles are placed in a Cloudflare Queue. The exported consumer function handles HTML sanitization and triggers the Image Caching pipeline (see 5.4).  
3. **Zero Trust Networking:** API routes communicate with the isolated FreshRSS instance using HTTP headers (CF-Access-Client-Id and CF-Access-Client-Secret).

### **5.4 Media & Image Caching Strategy (S3/R2)**

To prevent broken images, CORS issues, and mixed-content warnings, all images within RSS articles are locally cached:

* During the Queue Worker processing phase, the HTML is parsed (via Cheerio).  
* All \<img\> tags pointing to external domains are extracted.  
* The worker downloads the images and uploads them to the configured S3-compatible bucket (e.g., DigitalOcean Spaces or Cloudflare R2).  
* The worker rewrites the HTML src attributes to point to the community's custom media subdomain (e.g., https://media.community.com/img-id.jpg) before saving the HTML payload to D1.

## **6\. High-Level Data Model (Cloudflare D1)**

* users: id, email (nullable for guests), is\_guest (boolean), name, bio, avatar\_url.  
* verified\_domains: id, user\_id, domain\_name.  
* feeds: id, user\_id, feed\_url, category, status.  
* articles: id, feed\_id, title, content, original\_link, published\_date.  
* followers: user\_id, author\_id (Composite PK).  
* interactions: user\_id, article\_id, type ('heart' or 'star') (Composite PK), created\_at.  
* comments: id, article\_id, user\_id, content, status (pending/approved/rejected).

## **7\. Developer Experience (DX) & Deployment**

To launch a community, a developer will follow these steps:

1. Initialize a new Astro project: npm create astro@latest  
2. Install the framework: npm install @community-rss/core  
3. Add the integration to astro.config.mjs and pass config options (theme colors, allowed comment tiers, trending thresholds).  
4. Setup their wrangler.toml with D1, R2, and Queue bindings.  
5. Create a src/worker.ts file that simply exports the package's background handlers:  
   export { scheduled, queue } from '@community-rss/core/workers';

6. Deploy via npx wrangler pages deploy.
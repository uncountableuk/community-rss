---
title: Application Requirements
description: How the reference Community RSS application behaves from a user perspective.
sidebar:
  order: 2
---

This document outlines the user-facing behavior of the reference application produced by the package.

## 1. User Roles & Authentication Models

The platform supports a progressive engagement model, tracking interactions from anonymous visitors up to verified publishers.

### User Tiers

1. **Guest (Cookie-Based):** 
   - Unauthenticated users. Upon their first interaction (Heart, Star, or Comment), a consent modal is presented. 
   - If accepted, a UUID is generated, stored in a cookie, and a "shadow profile" is created in the database to track their interactions.
2. **Registered User:** 
   - Users who have created an account via the sign-up flow.
   - *Upgrade Path:* When a Guest signs up, the system reads their UUID cookie and migrates all previously associated Hearts, Stars, and Comments to their new permanent Registered account. The guest shadow profile is then deleted.
   - *Sign-Out Lifecycle:* When explicitly marked as signed out, the Guest UUID cookie is cleared entirely. A new Guest UUID is only generated if the user later attempts an interaction while signed out, triggering the consent modal again.
3. **Verified Author:** 
   - A Registered User who has submitted an RSS feed and successfully verified domain ownership.
4. **Admin:** 
   - Platform owner who configures categories, visual themes, and manages instance-wide settings (e.g., global comment permissions or feed limits).

## 2. Authentication & Registration Flow

The system leverages magic-links via email exclusively.

### Sign-Up Process

The sign-up process follows a pre-check pattern to distinguish new users from returning ones:

1. **Email Pre-Check:** When a user enters an email on the sign-in form, the system checks if the email is already registered. If the email is found, a standard sign-in magic link is sent. If not found, the user is redirected to the sign-up page with their email pre-filled.
2. **Sign-Up Form:** Collects the email (read-only, pre-filled), a display name, and a mandatory Terms of Service consent checkbox. On submission, the registration data is stored in a pending state and a welcome magic-link email is sent.
3. **Welcome Email & Verification:** The user receives a welcome email with a verification link. Clicking the link verifies the email, creates the user account (applying the display name and recording the terms consent timestamp), and establishes an authenticated session.
4. **Subsequent Sign-In:** Returning users enter their email on the sign-in form and receive a magic-link to authenticate. Once signed in, the header displays a link to their profile page alongside the sign-out button.

### User Profile

Each Registered User has a profile page (`/profile`) accessible only after email verification:
- **View/Edit:** Displays display name, email, bio, and avatar. Users can edit their display name and bio; changes are saved via API and reflected immediately.
- **Email Change:** Users may update their email address, but the change requires re-verification before it takes effect.
- **Feeds:** Manage submitted RSS feeds and view the history of Hearts, Stars, and Comments.

## 3. Reader Experience & Interactivity

### Homepage Views (Tabbed Interface)

The homepage features a masonry/grid layout with infinite scrolling. It defaults to a tabbed interface:
- **My Feed (Following):** The default view for logged-in users. Displays an aggregated timeline of articles only from the specific feeds they have chosen to "Follow".
- **All Feeds:** The chronological "firehose" of all approved feeds in the community (Default view for Guests).
- **Trending:** Highlights the top engaged posts based on an aggregated score of Hearts, Stars, and Comments. The time window (e.g., last 24 hours, last 7 days) and the weighting of interactions are configurable by the instance admin.
- **Starred (Favorites):** A private list of articles the user has bookmarked for later reading.

### Interactivity

- **Hearts:** A public appreciation metric. Users (including Guests, post-consent) can toggle a heart on an article. Prevented from multiple clicks via user ID / Guest UUID tracking.
- **Stars:** A private bookmarking tool to save articles to the "Starred" tab.
- **Comments:** Users can leave comments on articles. All comments require approval. Authors receive an email containing direct "Magic Links" to instantly Approve or Reject new comments without needing to log in.

### Article Modal

Clicking a feed card opens the full, sanitized article in a modal overlay.
- **Deep Linking:** The URL updates via pushState (e.g., `/article/[id]`) to allow sharing without losing feed context.
- **Navigation:** In-modal controls for "Next" and "Previous" articles based on the current list context (Following vs. All vs. Trending).

## 4. Feed Management & Authorship

### Feed Verification (Domain Level)

- Users can submit their personal RSS feeds.
- The system generates a unique verification code. The user places this code on any page matching the feed's root domain.
- The platform performs a real-time HTTP fetch to verify the code.
- Once verified, a "Connected" badge appears, and subsequent feeds from the same root domain bypass verification.
- Users must accept a legal consent checkbox confirming ownership and granting display rights.

### Author Profiles

Dedicated pages (`/author/[username]`) displaying the author's avatar, bio, and a filtered timeline of only their submitted feeds. Users can click "Follow" on an author's profile or directly on their feed cards.

### Feed Management & Cascading Deletion

When a Verified Author removes a feed from their profile, a strict data lifecycle policy is enforced:
- **FreshRSS Cleanup:** An API call is made to FreshRSS to unsubscribe and remove the feed from the ingestion engine.
- **Database Cleanup:** All articles, comments, hearts, and stars associated with that specific feed are permanently deleted from the relational database.
- **Media Cleanup:** A background job is triggered to locate and delete all cached images associated with the feed's articles from the S3 storage bucket.

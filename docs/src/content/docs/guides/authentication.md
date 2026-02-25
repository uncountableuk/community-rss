---
title: Authentication
description: Magic link sign-in, guest consent, and user migration flows
---

Community RSS uses **magic link authentication** powered by
[better-auth](https://www.better-auth.com/). Users sign in by
requesting a link via email — no passwords are stored.

## Sign-In Flow

```
User ──→ /auth/signin ──→ enters email
                │
                └──→ POST /api/auth/sign-in/magic-link
                          │
                          └──→ Email with magic link
                                    │
                                    └──→ /auth/verify?token=xxx
                                              │
                                              └──→ Session created → redirect /
```

### 1. Request a Magic Link

Navigate to `/auth/signin` and enter your email address. The framework
sends a magic link email that expires in **5 minutes**.

### 2. Check Your Email

Click the link in the email. In local development, emails are delivered
to [Mailpit](http://localhost:8025) — no real email provider is needed.

### 3. Automatic Session

After clicking the link, a session cookie is created. The `AuthButton`
component in the header shows your name and a "Sign Out" button.

## Guest Consent Flow

Unauthenticated users can interact with content (hearts, stars) via a
**guest consent** flow:

```
Guest clicks heart ──→ Consent Modal appears
                           │
                           ├──→ "Accept" → cookie set, shadow profile created
                           └──→ "Decline" → modal closes, no tracking
```

### How It Works

1. When a guest attempts an interaction, `window.__crssShowConsentModal()`
   is called.
2. If the guest accepts, a UUID is generated and stored in a `crss_guest`
   cookie (1-year lifetime).
3. A **shadow profile** is created in the database with `isGuest: true`.
4. Interactions are recorded against the guest's UUID.

### Guest → Registered Migration

When a guest later signs up via magic link, their interactions are
automatically migrated to the new registered account:

```
Guest (UUID abc-123) has 5 hearts
         │
         └──→ Signs up via magic link
                   │
                   └──→ 5 hearts transferred to new account
                        Guest profile deleted
                        crss_guest cookie cleared
```

The migration is handled automatically by the auth catch-all route
handler. No user action is required beyond signing in.

### Sign-Out Lifecycle

When a user signs out:

1. The session is destroyed via `POST /api/auth/sign-out`.
2. The `crss_guest` cookie is cleared.
3. No new guest UUID is auto-generated — the user returns to a fully
   anonymous state.

## User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| `user` | Default registered user | Read, interact (heart/star), comment |
| `admin` | Platform administrator | All user capabilities + manage feeds |
| `system` | Internal system user | Owns community feeds from FreshRSS sync |

Roles are stored in the `users.role` column. The `system` user is
seeded automatically during database setup.

## Auth Endpoints

All auth endpoints are handled by better-auth via the catch-all route
at `/api/auth/[...all]`. Key endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-in/magic-link` | POST | Request a magic link |
| `/api/auth/magic-link/verify` | GET | Verify a magic link token |
| `/api/auth/get-session` | GET | Get current session |
| `/api/auth/sign-out` | POST | Sign out / destroy session |

## Components

### AuthButton

Session-aware button that shows "Sign In" or the user's name with
"Sign Out". Automatically included in `BaseLayout`.

### MagicLinkForm

Email input form used on the `/auth/signin` page. Handles validation,
loading state, and success/error messages.

### ConsentModal

Modal dialog shown when a guest attempts an interaction. Available
globally via `window.__crssShowConsentModal()`.

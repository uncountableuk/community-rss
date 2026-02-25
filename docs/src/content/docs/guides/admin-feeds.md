---
title: Admin Feeds
description: Managing feeds as an admin user without domain verification
---

Admin users can add RSS/Atom feeds directly — no domain verification
is required. This is useful for bootstrapping community content or
adding curated feeds.

## Feed Ownership Model

| Owner | How feeds are added | Verification |
|-------|-------------------|--------------|
| **System User** | Imported from FreshRSS via sync | None (automated) |
| **Admin** | Added via API | Not required |
| **Verified Author** | Submitted via feed submission | Domain verification required |

## Adding a Feed (API)

```bash
# POST /api/v1/admin/feeds
curl -X POST http://localhost:4321/api/v1/admin/feeds \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{
    "url": "https://example.com/feed.xml",
    "title": "My Blog",
    "category": "technology"
  }'
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | Yes | RSS or Atom feed URL |
| `title` | `string` | No | Override the auto-detected feed title |
| `category` | `string` | No | Category/tag for the feed |

### Response (201 Created)

```json
{
  "ok": true,
  "feed": {
    "id": "feed-abc123",
    "userId": "user-admin-1",
    "feedUrl": "https://example.com/feed.xml",
    "title": "My Blog",
    "category": "technology",
    "status": "approved"
  }
}
```

### Validation

The feed URL is validated before creation:

1. Must be a valid `http://` or `https://` URL
2. Must be reachable (HTTP 200)
3. Must return valid RSS or Atom content (checked via content-type
   header and XML body markers)

If validation fails, the API returns **400 Bad Request** with an error
message.

### Deduplication

Feed IDs are generated deterministically from the feed URL. Submitting
the same URL twice will update the existing feed (via upsert) rather
than creating a duplicate.

## Listing Feeds

```bash
# GET /api/v1/admin/feeds
curl http://localhost:4321/api/v1/admin/feeds \
  -H "Cookie: better-auth.session_token=..."
```

Returns all feeds owned by the authenticated admin user.

### Response (200 OK)

```json
{
  "ok": true,
  "feeds": [
    {
      "id": "feed-abc123",
      "feedUrl": "https://example.com/feed.xml",
      "title": "My Blog",
      "status": "approved"
    }
  ]
}
```

## Deleting a Feed

```bash
# DELETE /api/v1/admin/feeds?id=feed-abc123
curl -X DELETE "http://localhost:4321/api/v1/admin/feeds?id=feed-abc123" \
  -H "Cookie: better-auth.session_token=..."
```

### Responses

| Status | Condition |
|--------|-----------|
| 200 | Feed deleted successfully |
| 400 | Missing feed ID parameter |
| 403 | Feed not owned by requesting admin |
| 404 | Feed not found |

Deleting a feed cascades to all associated articles, interactions,
and media cache entries.

## Authorization

All admin feed endpoints require:

1. A valid session (authenticated via magic link)
2. The `admin` role on the user record

Non-admin users receive a **403 Forbidden** response. Unauthenticated
requests receive a **401 Unauthorized** response.

## Workflow: Bootstrap Community Content

```
1. Sign in as admin via /auth/signin
2. POST /api/v1/admin/feeds with feed URLs
3. POST /api/v1/admin/sync to trigger FreshRSS sync
4. Articles appear on the homepage
```

---
title: Articles API
description: Reference for the GET /api/v1/articles endpoint
---

## `GET /api/v1/articles`

Returns a paginated list of articles synced from FreshRSS, ordered by publication date (newest first).

### Query Parameters

| Parameter | Type     | Default | Description                          |
|-----------|----------|---------|--------------------------------------|
| `page`    | `number` | `1`     | Page number (1-indexed)              |
| `limit`   | `number` | `20`    | Items per page (max 100)             |
| `feed_id` | `string` | —       | Filter articles by feed ID           |
| `sort`    | `string` | `newest`| Sort order: `newest` or `oldest`     |

### Response

```json
{
  "data": [
    {
      "id": "abc-123",
      "feedId": "feed_1",
      "freshrssItemId": "tag:google.com,2005:reader/item/...",
      "title": "Article Title",
      "content": "<p>Sanitised HTML content...</p>",
      "summary": "Plain text summary...",
      "originalLink": "https://example.com/article",
      "authorName": "Jane Doe",
      "publishedAt": "2024-01-15T12:00:00.000Z",
      "syncedAt": "2024-01-15T13:00:00.000Z",
      "mediaPending": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

### Error Responses

| Status | Description                    |
|--------|--------------------------------|
| `503`  | Database not available         |
| `500`  | Internal server error          |

### Usage Example

```javascript
// Fetch the first page of articles
const response = await fetch('/api/v1/articles?limit=20');
const { data, pagination } = await response.json();

// Fetch the next page
if (pagination.hasMore) {
  const next = await fetch(`/api/v1/articles?page=2&limit=20`);
}
```

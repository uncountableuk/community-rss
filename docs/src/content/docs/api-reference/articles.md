---
title: Articles
description: API reference for the article data model and scoring.
---

## Article Schema

Articles are stored in SQLite and managed via Drizzle ORM.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (GUID from RSS feed) |
| `feedId` | `string` | Parent feed ID |
| `title` | `string` | Article title |
| `url` | `string` | Original article URL |
| `content` | `string` | Article content/summary (HTML) |
| `author` | `string \| null` | Author name from the feed |
| `publishedAt` | `string` | Publication date (ISO 8601) |
| `syncedAt` | `string` | Last sync timestamp |
| `hearts` | `number` | Heart/like count |
| `commentCount` | `number` | Number of comments |
| `score` | `number` | Computed engagement score |

## Scoring Algorithm

Articles are ranked by a time-decay engagement score:

$$
\text{score} = \frac{\text{hearts} \times w_h + \text{comments} \times w_c}{(1 + \text{age\_hours})^{d}}
$$

Where:
- $w_h$ = heart weight (default: 1)
- $w_c$ = comment weight (default: 2)
- $d$ = decay factor (default: 1.5)
- $\text{age\_hours}$ = hours since publication

The score is recalculated on each interaction (heart, comment) and during
feed sync.

## List Articles

```
GET /api/v1/articles
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Items per page (1–100) |
| `feed` | `string` | — | Filter by feed ID |
| `search` | `string` | — | Full-text search query |
| `sort` | `string` | `'score'` | Sort by `score`, `date`, or `hearts` |

### Response

```json
{
  "articles": [
    {
      "id": "abc123",
      "title": "Example Article",
      "url": "https://example.com/post",
      "author": "Jane Doe",
      "publishedAt": "2024-01-15T10:30:00Z",
      "hearts": 42,
      "commentCount": 7,
      "score": 12.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Get Article

```
GET /api/v1/articles/:id
```

Returns the full article including content and comments.

## Heart Article

```
POST /api/v1/articles/:id/heart
```

Toggles the heart/like for the current user. Returns the updated heart
count.

## Add Comment

```
POST /api/v1/articles/:id/comments
```

### Request Body

```json
{
  "content": "Great article!"
}
```

Requires authentication at the `commentTier` level or above.

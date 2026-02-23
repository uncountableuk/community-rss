---
title: Options Reference
description: Full reference for CommunityRssOptions configuration.
---

## CommunityRssOptions

All configuration options for `communityRss()`.

```typescript
import type { CommunityRssOptions } from '@community-rss/core';
```

| Name | Type | Required | Default | Since | Description |
|------|------|----------|---------|-------|-------------|
| `maxFeeds` | `number` | No | `5` | 0.1.0 | Maximum feeds per verified author |
| `commentTier` | `CommentTier` | No | `'registered'` | 0.1.0 | Minimum user tier for commenting |

## CommentTier

```typescript
type CommentTier = 'verified' | 'registered' | 'guest';
```

| Value | Description |
|-------|-------------|
| `'verified'` | Only verified authors can comment |
| `'registered'` | Registered users and above can comment |
| `'guest'` | All users including guests can comment (moderated) |

## CSS Tokens

The framework injects CSS custom properties. Override any token in
your own stylesheet:

| Token | Default | Category |
|-------|---------|----------|
| `--crss-surface-0` | `#ffffff` | Surface |
| `--crss-surface-1` | `#f3f4f6` | Surface |
| `--crss-surface-2` | `#e5e7eb` | Surface |
| `--crss-surface-3` | `#d1d5db` | Surface |
| `--crss-text-primary` | `#1a1a2e` | Text |
| `--crss-text-secondary` | `#4b5563` | Text |
| `--crss-text-muted` | `#9ca3af` | Text |
| `--crss-brand-primary` | `#4f46e5` | Brand |
| `--crss-brand-accent` | `#7c3aed` | Brand |
| `--crss-heart` | `#ef4444` | Interaction |
| `--crss-star` | `#f59e0b` | Interaction |
| `--crss-comment` | `#3b82f6` | Interaction |
| `--crss-font-family` | `system-ui, ...` | Typography |
| `--crss-radius-sm` | `4px` | Border Radius |
| `--crss-radius-md` | `8px` | Border Radius |
| `--crss-radius-lg` | `12px` | Border Radius |

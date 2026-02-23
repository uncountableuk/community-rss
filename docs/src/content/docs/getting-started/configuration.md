---
title: Configuration
description: All available configuration options for @community-rss/core.
---

## CommunityRssOptions

The `communityRss()` integration factory accepts an optional configuration
object. All properties have sensible defaults.

| Name | Type | Required | Default | Since | Description |
|------|------|----------|---------|-------|-------------|
| `maxFeeds` | `number` | No | `5` | 0.1.0 | Maximum feeds per verified author |
| `commentTier` | `'verified' \| 'registered' \| 'guest'` | No | `'registered'` | 0.1.0 | Minimum user tier required to comment |

## Usage

```js
// astro.config.mjs
import communityRss from '@community-rss/core';

export default defineConfig({
  integrations: [
    communityRss({
      maxFeeds: 10,
      commentTier: 'guest',
    }),
  ],
});
```

## CSS Design Tokens

The framework ships with CSS custom properties for all visual values.
Override tokens in your own stylesheet to customise the appearance:

```css
:root {
  --crss-brand-primary: #0ea5e9;
  --crss-brand-accent: #06b6d4;
  --crss-font-family: 'Inter', sans-serif;
}
```

See the [CSS Tokens Reference](/api-reference/options/#css-tokens) for
the full list of available tokens.

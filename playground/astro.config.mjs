import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import communityRss from '@community-rss/core';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [
    communityRss({
      maxFeeds: 5,
      commentTier: 'registered',
    }),
  ],
});

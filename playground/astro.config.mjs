import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import communityRss from '@community-rss/core';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    communityRss({
      maxFeeds: 5,
      commentTier: 'registered',
      email: {
        transport: 'smtp',
      },
    }),
  ],
});

import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Community RSS',
      description:
        'White-label Astro Integration framework for community content aggregation',
      social: [],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Configuration', slug: 'getting-started/configuration' },
            {
              label: 'Local Development',
              slug: 'getting-started/local-development',
            },
            { label: 'Deployment', slug: 'getting-started/deployment' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Feed Synchronisation', slug: 'guides/feed-sync' },
            { label: 'Authentication', slug: 'guides/authentication' },
            { label: 'Email Setup', slug: 'guides/email-setup' },
            { label: 'Admin Feeds', slug: 'guides/admin-feeds' },
            { label: 'Theming', slug: 'guides/theming' },
            { label: 'Customisation', slug: 'guides/customisation' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'Integration', slug: 'api-reference/integration' },
            { label: 'Options', slug: 'api-reference/options' },
            { label: 'Routes', slug: 'api-reference/routes' },
            { label: 'Articles', slug: 'api-reference/articles' },
            { label: 'CLI', slug: 'api-reference/cli' },
          ],
        },
        {
          label: 'Contributing',
          items: [
            { label: 'Dev Setup', slug: 'contributing/setup' },
            { label: 'Architecture', slug: 'contributing/architecture' },
            { label: 'Testing', slug: 'contributing/testing' },
          ],
        },
      ],
    }),
  ],
});

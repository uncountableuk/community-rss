import type { AstroIntegration } from 'astro';
import type { CommunityRssOptions } from './types/options';
import { resolveOptions } from './types/options';

/**
 * Creates the Community RSS Astro integration.
 *
 * This is the main entry point for consumers. It accepts an optional
 * configuration object and returns an Astro integration that injects
 * API routes, middleware, and scheduler lifecycle hooks into the
 * consumer's project.
 *
 * Page routes are no longer injected — use `npx @community-rss/core init`
 * to scaffold pages into your project.
 *
 * @param options - Framework configuration
 * @returns Astro integration instance
 * @since 0.1.0
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import communityRss from '@community-rss/core';
 *
 * export default defineConfig({
 *   integrations: [communityRss({ maxFeeds: 10 })],
 * });
 * ```
 */
export function createIntegration(options: CommunityRssOptions = {}): AstroIntegration {
  const config = resolveOptions(options);

  return {
    name: 'community-rss',
    hooks: {
      'astro:config:setup': ({ injectRoute, addMiddleware: registerMiddleware }) => {
        // Register middleware that creates AppContext on every request
        registerMiddleware({
          entrypoint: new URL('./middleware.ts', import.meta.url).pathname,
          order: 'pre',
        });

        // --- API Routes (injected — update automatically with package) ---

        // Health check route — validates integration wiring
        injectRoute({
          pattern: '/api/v1/health',
          entrypoint: new URL('./routes/api/v1/health.ts', import.meta.url).pathname,
        });

        // Articles API route
        injectRoute({
          pattern: '/api/v1/articles',
          entrypoint: new URL('./routes/api/v1/articles.ts', import.meta.url).pathname,
        });

        // Admin: manual sync trigger (local dev / operator use)
        injectRoute({
          pattern: '/api/v1/admin/sync',
          entrypoint: new URL('./routes/api/v1/admin/sync.ts', import.meta.url).pathname,
        });

        // Admin: feed management (CRUD)
        injectRoute({
          pattern: '/api/v1/admin/feeds',
          entrypoint: new URL('./routes/api/v1/admin/feeds.ts', import.meta.url).pathname,
        });

        // better-auth catch-all — handles sign-in, sign-out, session, magic link
        injectRoute({
          pattern: '/api/auth/[...all]',
          entrypoint: new URL('./routes/api/auth/[...all].ts', import.meta.url).pathname,
        });

        // Auth API: email pre-check for sign-in/sign-up routing
        injectRoute({
          pattern: '/api/v1/auth/check-email',
          entrypoint: new URL('./routes/api/v1/auth/check-email.ts', import.meta.url).pathname,
        });

        // Auth API: sign-up endpoint
        injectRoute({
          pattern: '/api/v1/auth/signup',
          entrypoint: new URL('./routes/api/v1/auth/signup.ts', import.meta.url).pathname,
        });

        // User profile API
        injectRoute({
          pattern: '/api/v1/profile',
          entrypoint: new URL('./routes/api/v1/profile.ts', import.meta.url).pathname,
        });

        // Email change request
        injectRoute({
          pattern: '/api/v1/profile/change-email',
          entrypoint: new URL('./routes/api/v1/profile/change-email.ts', import.meta.url).pathname,
        });

        // Email change confirmation
        injectRoute({
          pattern: '/api/v1/profile/confirm-email-change',
          entrypoint: new URL('./routes/api/v1/profile/confirm-email-change.ts', import.meta.url).pathname,
        });

        // Dev-only seed endpoint
        injectRoute({
          pattern: '/api/dev/seed',
          entrypoint: new URL('./routes/api/dev/seed.ts', import.meta.url).pathname,
        });
      },

      'astro:config:done': ({ logger }) => {
        logger.info(`Community RSS integration loaded`);
        logger.info(`  maxFeeds: ${config.maxFeeds}`);
        logger.info(`  commentTier: ${config.commentTier}`);
        logger.info(`  databasePath: ${config.databasePath}`);
        logger.info(`  syncSchedule: ${config.syncSchedule}`);
      },
    },
  };
}

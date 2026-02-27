import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { CommunityRssOptions } from './types/options';
import { resolveOptions } from './types/options';
import { startScheduler, stopScheduler } from './utils/build/scheduler';
import { createDatabase, closeDatabase } from './db/connection';
import type { EnvironmentVariables } from './types/context';

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
  let projectRoot: string = process.cwd();

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

      'astro:config:done': ({ config: astroConfig, logger }) => {
        // astroConfig.root may be a URL or a string depending on Astro version
        const root = astroConfig.root;
        projectRoot = root instanceof URL ? fileURLToPath(root) : String(root);
        // Strip trailing slash for consistent join() behavior
        projectRoot = projectRoot.replace(/\/$/, '');

        logger.info(`Community RSS integration loaded`);
        logger.info(`  maxFeeds: ${config.maxFeeds}`);
        logger.info(`  commentTier: ${config.commentTier}`);
        logger.info(`  databasePath: ${config.databasePath}`);
        logger.info(`  syncSchedule: ${config.syncSchedule}`);
      },

      'astro:server:start': ({ logger }) => {
        // Load .env from project root into process.env.
        // process.loadEnvFile does NOT override already-set vars, so explicit
        // environment variables (e.g. from Docker/CI) take precedence.
        const envPath = join(projectRoot, '.env');
        try {
          process.loadEnvFile(envPath);
        } catch {
          logger.warn(`No .env file found at ${envPath} — using environment variables only`);
        }

        // Build environment variables from process.env
        const env: EnvironmentVariables = {
          DATABASE_PATH: process.env.DATABASE_PATH ?? config.databasePath,
          FRESHRSS_URL: process.env.FRESHRSS_URL ?? '',
          FRESHRSS_USER: process.env.FRESHRSS_USER ?? '',
          FRESHRSS_API_PASSWORD: process.env.FRESHRSS_API_PASSWORD ?? '',
          PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL ?? '',
          SMTP_HOST: process.env.SMTP_HOST ?? '',
          SMTP_PORT: process.env.SMTP_PORT ?? '',
          SMTP_FROM: process.env.SMTP_FROM ?? '',
          S3_ENDPOINT: process.env.S3_ENDPOINT ?? '',
          S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? '',
          S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? '',
          S3_BUCKET: process.env.S3_BUCKET ?? '',
          MEDIA_BASE_URL: process.env.MEDIA_BASE_URL ?? '',
          RESEND_API_KEY: process.env.RESEND_API_KEY,
          EMAIL_TRANSPORT: process.env.EMAIL_TRANSPORT,
        };

        const db = createDatabase(env.DATABASE_PATH);
        startScheduler({ db, config, env });
      },

      'astro:server:done': () => {
        stopScheduler();
        closeDatabase();
      },
    },
  };
}

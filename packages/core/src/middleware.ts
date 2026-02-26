/**
 * Astro middleware that creates the AppContext and sets it on
 * `context.locals.app` for all route handlers.
 *
 * @since 0.4.0
 */

import { defineMiddleware } from 'astro:middleware';
import { createDatabase } from './db/connection';
import type { AppContext, EnvironmentVariables } from './types/context';
import type { ResolvedCommunityRssOptions } from './types/options';

/**
 * Creates an Astro middleware that injects the AppContext into locals.
 *
 * @param config - Resolved framework configuration
 * @returns Astro middleware function
 * @since 0.4.0
 */
export function createMiddleware(config: ResolvedCommunityRssOptions) {
  return defineMiddleware((context, next) => {
    const env = buildEnvironmentVariables();
    const dbPath = env.DATABASE_PATH || config.databasePath;
    const db = createDatabase(dbPath);

    const appContext: AppContext = {
      db,
      config,
      env,
    };

    (context.locals as Record<string, unknown>).app = appContext;

    return next();
  });
}

/**
 * Reads environment variables from `process.env` and returns a
 * typed `EnvironmentVariables` object.
 *
 * @returns Environment variables object
 * @since 0.4.0
 */
function buildEnvironmentVariables(): EnvironmentVariables {
  const env = process.env as Record<string, string | undefined>;

  return {
    DATABASE_PATH: env.DATABASE_PATH ?? './data/community.db',
    FRESHRSS_URL: env.FRESHRSS_URL ?? '',
    FRESHRSS_USER: env.FRESHRSS_USER ?? '',
    FRESHRSS_API_PASSWORD: env.FRESHRSS_API_PASSWORD ?? '',
    PUBLIC_SITE_URL: env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
    SMTP_HOST: env.SMTP_HOST ?? '',
    SMTP_PORT: env.SMTP_PORT ?? '1025',
    SMTP_FROM: env.SMTP_FROM ?? '',
    S3_ENDPOINT: env.S3_ENDPOINT ?? '',
    S3_ACCESS_KEY: env.S3_ACCESS_KEY ?? '',
    S3_SECRET_KEY: env.S3_SECRET_KEY ?? '',
    S3_BUCKET: env.S3_BUCKET ?? '',
    MEDIA_BASE_URL: env.MEDIA_BASE_URL ?? '',
    RESEND_API_KEY: env.RESEND_API_KEY,
    EMAIL_TRANSPORT: env.EMAIL_TRANSPORT,
  };
}

/**
 * Runtime context available to all route handlers via `context.locals.app`.
 *
 * @since 0.4.0
 */
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { ResolvedCommunityRssOptions } from './options';
/**
 * Runtime context injected by the Community RSS middleware.
 *
 * Available in all route handlers via `context.locals.app`.
 *
 * @since 0.4.0
 */
export interface AppContext {
    /** Drizzle ORM database instance (SQLite). @since 0.4.0 */
    db: BetterSQLite3Database;
    /** Resolved framework configuration. @since 0.4.0 */
    config: ResolvedCommunityRssOptions;
    /** Environment variables. @since 0.4.0 */
    env: EnvironmentVariables;
}
/**
 * Standard environment variables read from `process.env`.
 *
 * @since 0.4.0
 */
export interface EnvironmentVariables {
    /** Path to SQLite database file. @since 0.4.0 */
    DATABASE_PATH: string;
    /** FreshRSS API endpoint URL. @since 0.4.0 */
    FRESHRSS_URL: string;
    /** FreshRSS admin username. @since 0.4.0 */
    FRESHRSS_USER: string;
    /** FreshRSS API password. @since 0.4.0 */
    FRESHRSS_API_PASSWORD: string;
    /** Public site URL — must match the externally-accessible origin. @since 0.4.0 */
    PUBLIC_SITE_URL: string;
    /** SMTP host for email delivery. @since 0.4.0 */
    SMTP_HOST: string;
    /** SMTP port. @since 0.4.0 */
    SMTP_PORT: string;
    /** Email sender address. @since 0.4.0 */
    SMTP_FROM: string;
    /** S3-compatible endpoint for media storage. @since 0.4.0 */
    S3_ENDPOINT: string;
    /** S3 access key. @since 0.4.0 */
    S3_ACCESS_KEY: string;
    /** S3 secret key. @since 0.4.0 */
    S3_SECRET_KEY: string;
    /** S3 bucket name. @since 0.4.0 */
    S3_BUCKET: string;
    /** Base URL for rewritten media URLs. @since 0.4.0 */
    MEDIA_BASE_URL: string;
    /** Resend API key (optional, for production email). @since 0.4.0 */
    RESEND_API_KEY?: string;
    /** Email transport to use: 'smtp' or 'resend'. @since 0.4.0 */
    EMAIL_TRANSPORT?: string;
    /** Allow arbitrary additional env vars. */
    [key: string]: string | undefined;
}
//# sourceMappingURL=context.d.ts.map
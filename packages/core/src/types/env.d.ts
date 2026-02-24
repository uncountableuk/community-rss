/**
 * Cloudflare environment bindings for the Community RSS framework.
 *
 * These bindings are configured in `wrangler.toml` and injected
 * at runtime by the Cloudflare Workers platform.
 *
 * @since 0.1.0
 */
export interface Env {
  /**
   * Cloudflare D1 database binding.
   * The primary database for all community data.
   */
  DB: D1Database;

  /**
   * Cloudflare R2 bucket binding.
   * Used for caching media (images) from RSS articles.
   */
  MEDIA_BUCKET: R2Bucket;

  /**
   * Cloudflare Queue producer binding.
   * Used to enqueue new articles for background processing.
   */
  ARTICLE_QUEUE: Queue;

  /**
   * FreshRSS API endpoint URL.
   */
  FRESHRSS_URL: string;

  /**
   * FreshRSS admin username.
   */
  FRESHRSS_USER: string;

  /**
   * FreshRSS API password.
   */
  FRESHRSS_API_PASSWORD: string;

  /**
   * Cloudflare Access Client ID for Zero Trust (optional).
   */
  CF_ACCESS_CLIENT_ID?: string;

  /**
   * Cloudflare Access Client Secret for Zero Trust (optional).
   */
  CF_ACCESS_CLIENT_SECRET?: string;

  /**
   * Public site URL — must match the externally-accessible origin.
   * Critical for better-auth magic link generation and cookie setting.
   */
  PUBLIC_SITE_URL: string;

  /**
   * SMTP host for email delivery (Mailpit locally, Resend in production).
   */
  SMTP_HOST: string;

  /**
   * SMTP port.
   */
  SMTP_PORT: string;

  /**
   * Email sender address.
   */
  SMTP_FROM: string;

  /**
   * S3-compatible endpoint for media storage (MinIO locally, R2/DO Spaces in production).
   */
  S3_ENDPOINT: string;

  /**
   * S3 access key.
   */
  S3_ACCESS_KEY: string;

  /**
   * S3 secret key.
   */
  S3_SECRET_KEY: string;

  /**
   * S3 bucket name.
   */
  S3_BUCKET: string;

  /**
   * Base URL for rewritten media URLs.
   */
  MEDIA_BASE_URL: string;
}

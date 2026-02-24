/**
 * Configuration options for the Community RSS framework.
 *
 * All properties are optional with sensible defaults.
 * Consumers pass this to `communityRss(options)` in their `astro.config.mjs`.
 *
 * @since 0.1.0
 */
export interface CommunityRssOptions {
  /**
   * Maximum number of feeds a verified author can submit.
   * @default 5
   * @since 0.1.0
   */
  maxFeeds?: number;

  /**
   * Minimum user tier required to leave comments.
   * - `'verified'` — Only verified authors can comment
   * - `'registered'` — Registered users and above can comment
   * - `'guest'` — All users including guests can comment (moderated)
   * @default 'registered'
   * @since 0.1.0
   */
  commentTier?: 'verified' | 'registered' | 'guest';

  /**
   * Email configuration for magic links and notifications.
   * @since 0.3.0
   */
  email?: EmailConfig;
}

/**
 * Email configuration for transactional emails.
 *
 * Controls the transport adapter, sender address, and template
 * overrides for all emails sent by the framework.
 *
 * @since 0.3.0
 */
export interface EmailConfig {
  /**
   * Email sender address (e.g., 'noreply@example.com').
   * Falls back to `env.SMTP_FROM` if not set.
   * @since 0.3.0
   */
  from?: string;

  /**
   * Application name shown in email subject/body.
   * @default 'Community RSS'
   * @since 0.3.0
   */
  appName?: string;

  /**
   * Transport adapter configuration.
   *
   * - `'smtp'` — Uses Mailpit HTTP API (requires `SMTP_HOST` env var)
   * - `'resend'` — Uses Resend API (requires `RESEND_API_KEY` env var)
   * - `EmailTransport` object — Custom transport implementation
   *
   * When not set, emails are not sent and a warning is logged.
   *
   * @since 0.3.0
   */
  transport?: 'smtp' | 'resend' | import('./email').EmailTransport;

  /**
   * Override default email templates by type.
   *
   * Each key is an email type name (e.g., `'sign-in'`, `'welcome'`,
   * `'email-change'`). The value is a template function that receives
   * an `EmailTemplateContext` and type-specific data, returning
   * `{ subject, html, text }`.
   *
   * @example
   * ```typescript
   * templates: {
   *   'sign-in': (ctx, data) => ({
   *     subject: `Log in to ${ctx.appName}`,
   *     html: `<h1>Hi ${ctx.profile?.name ?? 'there'}!</h1><a href="${data.url}">Sign In</a>`,
   *     text: `Hi ${ctx.profile?.name ?? 'there'}, click here: ${data.url}`,
   *   }),
   * }
   * ```
   *
   * @since 0.3.0
   */
  templates?: import('./email').EmailTemplateMap;
}

/**
 * Resolves a partial options object into a fully-populated config
 * with all defaults applied.
 *
 * @param options - Partial user-supplied configuration
 * @returns Fully resolved configuration with defaults
 * @since 0.1.0
 */
export function resolveOptions(options: CommunityRssOptions = {}): Required<CommunityRssOptions> {
  return {
    maxFeeds: options.maxFeeds ?? 5,
    commentTier: options.commentTier ?? 'registered',
    email: {
      from: options.email?.from,
      appName: options.email?.appName ?? 'Community RSS',
      transport: options.email?.transport,
      templates: options.email?.templates,
    },
  };
}

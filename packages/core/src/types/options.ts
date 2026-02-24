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
    },
  };
}

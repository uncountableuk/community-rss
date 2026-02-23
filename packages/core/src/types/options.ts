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
  };
}

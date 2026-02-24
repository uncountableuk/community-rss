/**
 * @community-rss/core — White-label Astro Integration for community
 * content aggregation.
 *
 * @packageDocumentation
 * @since 0.1.0
 * @license GPL-3.0
 */

import type { AstroIntegration } from 'astro';
import type { CommunityRssOptions } from './src/types/options';
import { createIntegration } from './src/integration';

/**
 * Configures and returns the Community RSS Astro integration.
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
export default function communityRss(options?: CommunityRssOptions): AstroIntegration {
  return createIntegration(options);
}

// Public type exports
export type { CommunityRssOptions, EmailConfig } from './src/types/options';
export type { Env } from './src/types/env';
export type {
  UserTier,
  UserRole,
  FeedStatus,
  CommentStatus,
  InteractionType,
  CommunityRssError,
} from './src/types/models';

// Worker exports (stubs in 0.1.0)
export { scheduled } from './src/workers/scheduled';
export { queue } from './src/workers/queue';

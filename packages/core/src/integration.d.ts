import type { AstroIntegration } from 'astro';
import type { CommunityRssOptions } from './types/options';
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
export declare function createIntegration(options?: CommunityRssOptions): AstroIntegration;
//# sourceMappingURL=integration.d.ts.map
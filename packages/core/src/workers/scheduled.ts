import type { Env } from '../types/env';
import { syncFeeds } from '../utils/build/sync';

/**
 * Cloudflare Cron Trigger handler.
 *
 * This handler is exported by consumers in their worker entrypoint
 * to enable scheduled feed synchronisation from FreshRSS to D1.
 *
 * @param _controller - Cloudflare scheduled controller
 * @param env - Cloudflare environment bindings
 * @param ctx - Execution context
 * @since 0.1.0
 */
export async function scheduled(
  _controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  ctx.waitUntil(
    syncFeeds(env).then((result) => {
      console.log(
        `[community-rss] Sync complete: ${result.feedsProcessed} feeds, ${result.articlesEnqueued} articles enqueued`,
      );
    }).catch((error) => {
      console.error('[community-rss] Sync failed:', error);
    }),
  );
}

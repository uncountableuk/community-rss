import type { Env } from '../types/env';

/**
 * Cloudflare Cron Trigger handler (stub).
 *
 * This handler is exported by consumers in their worker entrypoint
 * to enable scheduled feed synchronisation.
 *
 * @param _controller - Cloudflare scheduled controller
 * @param _env - Cloudflare environment bindings
 * @param _ctx - Execution context
 * @since 0.1.0
 */
export async function scheduled(
  _controller: ScheduledController,
  _env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  // Stub — feed sync implemented in 0.2.0
  console.log('[community-rss] Scheduled handler triggered (stub)');
}

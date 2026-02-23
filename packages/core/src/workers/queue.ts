import type { Env } from '../types/env';

/**
 * Cloudflare Queue consumer handler (stub).
 *
 * This handler processes articles enqueued by the sync worker.
 * It handles HTML sanitisation, metadata extraction, and
 * image caching pipeline triggers.
 *
 * @param _batch - Cloudflare message batch
 * @param _env - Cloudflare environment bindings
 * @param _ctx - Execution context
 * @since 0.1.0
 */
export async function queue(
  _batch: MessageBatch,
  _env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  // Stub — article processing implemented in 0.2.0
  console.log('[community-rss] Queue consumer triggered (stub)');
}

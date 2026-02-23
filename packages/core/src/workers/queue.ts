import type { Env } from '../types/env';
import { processArticle } from '../utils/build/article-processor';
import { upsertArticle } from '../db/queries/articles';
import type { ArticleQueueMessage } from '../utils/build/sync';

/**
 * Cloudflare Queue consumer handler.
 *
 * This handler processes articles enqueued by the sync worker.
 * It handles HTML sanitisation, metadata extraction, and
 * stores processed articles in D1.
 *
 * @param batch - Cloudflare message batch
 * @param env - Cloudflare environment bindings
 * @param _ctx - Execution context
 * @since 0.1.0
 */
export async function queue(
  batch: MessageBatch<ArticleQueueMessage>,
  env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  for (const message of batch.messages) {
    try {
      const processed = processArticle(message.body);

      await upsertArticle(env.DB, {
        id: crypto.randomUUID(),
        feedId: processed.feedId,
        freshrssItemId: processed.freshrssItemId,
        title: processed.title,
        content: processed.content,
        summary: processed.summary,
        originalLink: processed.originalLink,
        authorName: processed.authorName,
        publishedAt: processed.publishedAt,
        mediaPending: true,
      });

      message.ack();
    } catch (error) {
      console.error(
        `[community-rss] Failed to process article ${message.body.freshrssItemId}:`,
        error,
      );
      message.retry();
    }
  }
}

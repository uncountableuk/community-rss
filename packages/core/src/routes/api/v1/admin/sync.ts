import type { APIRoute } from 'astro';
import { syncFeeds } from '../../../../utils/build/sync';
import { processArticle } from '../../../../utils/build/article-processor';
import { upsertArticle } from '../../../../db/queries/articles';
import type { Env } from '../../../../types/env';
import type { ArticleQueueMessage } from '../../../../utils/build/sync';

/**
 * POST /api/v1/admin/sync
 *
 * Manually triggers a FreshRSS → D1 feed sync.
 * In local dev mode (default), processes articles inline since
 * wrangler pages dev does not support queue consumers.
 *
 * Intended for local development use only — gate with authentication
 * before exposing in production.
 *
 * @since 0.2.0
 */
export const POST: APIRoute = async ({ locals }) => {
    const env = (locals as { runtime?: { env?: Env } }).runtime?.env;

    if (!env?.FRESHRSS_URL) {
        return new Response(
            JSON.stringify({ error: 'FreshRSS not configured' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        // Collect enqueued messages so we can process them inline
        const collectedMessages: ArticleQueueMessage[] = [];
        const originalSend = env.ARTICLE_QUEUE.send.bind(env.ARTICLE_QUEUE);
        env.ARTICLE_QUEUE.send = async (message: unknown) => {
            collectedMessages.push(message as ArticleQueueMessage);
            return originalSend(message);
        };

        const result = await syncFeeds(env);

        // Process articles inline (queue consumer doesn't work in Pages dev)
        let articlesProcessed = 0;
        for (const msg of collectedMessages) {
            try {
                const processed = processArticle(msg);
                await upsertArticle(env.DB, {
                    id: `art_${msg.freshrssItemId.replace(/[^a-zA-Z0-9]/g, '_')}`,
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
                articlesProcessed++;
            } catch (articleError) {
                console.error(`[sync] Failed to process article ${msg.freshrssItemId}:`, articleError);
            }
        }

        return new Response(
            JSON.stringify({
                ok: true,
                feedsProcessed: result.feedsProcessed,
                articlesEnqueued: result.articlesEnqueued,
                articlesProcessed,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({ ok: false, error: message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

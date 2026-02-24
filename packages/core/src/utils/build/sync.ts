import type { Env } from '../../types/env';
import { FreshRssClient } from './freshrss-client';
import { upsertFeed } from '../../db/queries/feeds';
import { ensureSystemUser } from '../../db/queries/users';
import type { FreshRssItem } from '../../types/freshrss';

/**
 * Generates a deterministic feed ID from a FreshRSS subscription ID.
 *
 * @param freshrssId - FreshRSS subscription ID (e.g., 'feed/1')
 * @returns A stable ID string
 * @since 0.2.0
 */
export function generateFeedId(freshrssId: string): string {
    // Use the numeric part of the FreshRSS feed ID
    return `feed_${freshrssId.replace('feed/', '')}`;
}

/**
 * Maps a FreshRSS item to a queue message payload.
 *
 * @since 0.2.0
 */
export interface ArticleQueueMessage {
    freshrssItemId: string;
    feedId: string;
    title: string;
    content?: string;
    summary?: string;
    authorName?: string;
    originalLink?: string;
    publishedAt?: number;
}

/**
 * Converts a FreshRSS item to a queue message payload.
 *
 * @param item - FreshRSS item
 * @param feedId - Internal feed ID
 * @returns Queue message payload
 * @since 0.2.0
 */
export function itemToQueueMessage(item: FreshRssItem, feedId: string): ArticleQueueMessage {
    return {
        freshrssItemId: item.id,
        feedId,
        title: item.title,
        content: item.content?.content || item.summary?.content,
        summary: item.summary?.content,
        authorName: item.author || undefined,
        originalLink: item.canonical?.[0]?.href || item.alternate?.[0]?.href,
        publishedAt: item.published,
    };
}

/**
 * Synchronises feeds and articles from FreshRSS to D1.
 *
 * This is the main sync orchestrator called by the Cron trigger.
 * It fetches all subscribed feeds from FreshRSS, upserts them into D1,
 * then fetches articles for each feed and enqueues them for processing.
 *
 * @param env - Cloudflare environment bindings
 * @since 0.2.0
 */
export async function syncFeeds(env: Env): Promise<{
    feedsProcessed: number;
    articlesEnqueued: number;
}> {
    const client = new FreshRssClient(env);

    // 0. Ensure the system user exists for feed ownership
    await ensureSystemUser(env.DB);

    // 1. Fetch all subscribed feeds
    const { subscriptions } = await client.fetchFeeds();
    let articlesEnqueued = 0;

    // 2. Upsert each feed into D1
    for (const sub of subscriptions) {
        const feedId = generateFeedId(sub.id);
        const category = sub.categories?.[0]?.label || 'Uncategorised';

        await upsertFeed(env.DB, {
            id: feedId,
            userId: 'system', // System-managed feeds during sync
            feedUrl: sub.url,
            title: sub.title,
            description: '',
            category,
            status: 'approved',
        });

        // 3. Fetch articles for this feed
        const stream = await client.fetchArticles(sub.id);

        // 4. Enqueue each article for processing
        for (const item of stream.items) {
            const message = itemToQueueMessage(item, feedId);
            await env.ARTICLE_QUEUE.send(message);
            articlesEnqueued++;
        }
    }

    return {
        feedsProcessed: subscriptions.length,
        articlesEnqueued,
    };
}

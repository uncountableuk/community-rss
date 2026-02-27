import { FreshRssClient } from './freshrss-client';
import { upsertFeed } from '../../db/queries/feeds';
import { upsertArticle } from '../../db/queries/articles';
import { ensureSystemUser } from '../../db/queries/users';
import { processArticle } from './article-processor';
/**
 * Generates a deterministic feed ID from a FreshRSS subscription ID.
 *
 * @param freshrssId - FreshRSS subscription ID (e.g., 'feed/1')
 * @returns A stable ID string
 * @since 0.2.0
 */
export function generateFeedId(freshrssId) {
    // Use the numeric part of the FreshRSS feed ID
    return `feed_${freshrssId.replace('feed/', '')}`;
}
/**
 * Converts a FreshRSS item to an article payload.
 *
 * @param item - FreshRSS item
 * @param feedId - Internal feed ID
 * @returns Article payload
 * @since 0.2.0
 */
export function mapFreshRssItem(item, feedId) {
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
 * Synchronises feeds and articles from FreshRSS to SQLite.
 *
 * This is the main sync orchestrator. It fetches all subscribed feeds
 * from FreshRSS, upserts them into the database, then fetches and
 * processes articles inline (no queue needed with Node.js long-lived process).
 *
 * @param app - Application context
 * @since 0.2.0
 */
export async function syncFeeds(app) {
    const client = new FreshRssClient(app.env);
    // 0. Ensure the system user exists for feed ownership
    await ensureSystemUser(app.db);
    // 1. Fetch all subscribed feeds
    const { subscriptions } = await client.fetchFeeds();
    let articlesProcessed = 0;
    // 2. Upsert each feed into the database
    for (const sub of subscriptions) {
        const feedId = generateFeedId(sub.id);
        const category = sub.categories?.[0]?.label || 'Uncategorised';
        await upsertFeed(app.db, {
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
        // 4. Process each article inline (replaces queue-based processing)
        for (const item of stream.items) {
            try {
                const message = mapFreshRssItem(item, feedId);
                const processed = processArticle(message);
                await upsertArticle(app.db, {
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
                articlesProcessed++;
            }
            catch (error) {
                console.error(`[community-rss] Failed to process article ${item.id}:`, error);
            }
        }
    }
    return {
        feedsProcessed: subscriptions.length,
        articlesProcessed,
    };
}
//# sourceMappingURL=sync.js.map
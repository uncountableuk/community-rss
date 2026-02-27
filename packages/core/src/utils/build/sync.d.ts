import type { AppContext } from '../../types/context';
import type { FreshRssItem } from '../../types/freshrss';
/**
 * Generates a deterministic feed ID from a FreshRSS subscription ID.
 *
 * @param freshrssId - FreshRSS subscription ID (e.g., 'feed/1')
 * @returns A stable ID string
 * @since 0.2.0
 */
export declare function generateFeedId(freshrssId: string): string;
/**
 * Maps a FreshRSS item to an article payload.
 *
 * @since 0.2.0
 */
export interface ArticlePayload {
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
 * Converts a FreshRSS item to an article payload.
 *
 * @param item - FreshRSS item
 * @param feedId - Internal feed ID
 * @returns Article payload
 * @since 0.2.0
 */
export declare function mapFreshRssItem(item: FreshRssItem, feedId: string): ArticlePayload;
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
export declare function syncFeeds(app: AppContext): Promise<{
    feedsProcessed: number;
    articlesProcessed: number;
}>;
//# sourceMappingURL=sync.d.ts.map
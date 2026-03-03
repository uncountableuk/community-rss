import { eq, desc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { articles, feeds } from '../schema';

/**
 * Article row with the feed's display title joined in.
 * Used by the homepage feed grid.
 * @since 0.6.0
 */
export interface ArticleWithFeedTitle {
    id: string;
    feedId: string;
    title: string;
    summary: string | null;
    authorName: string | null;
    publishedAt: Date | null;
    originalLink: string | null;
    feedTitle: string | null;
}

export async function getArticles(db: BetterSQLite3Database, limit = 20, offset = 0) {
    return db
        .select()
        .from(articles)
        .orderBy(desc(articles.publishedAt))
        .limit(limit)
        .offset(offset)
        .all();
}

export async function getArticleById(db: BetterSQLite3Database, id: string) {
    const result = await db.select().from(articles).where(eq(articles.id, id)).all();
    return result[0] || null;
}

/**
 * Returns a paginated list of articles with the feed's display title
 * joined from the feeds table.
 *
 * @param db - Drizzle ORM database instance
 * @param limit - Maximum number of rows to return (default: 20)
 * @param offset - Number of rows to skip for pagination (default: 0)
 * @returns Array of articles with `feedTitle` populated (null if feed has no title)
 * @since 0.6.0
 */
export async function getArticlesWithFeedTitle(
    db: BetterSQLite3Database,
    limit = 20,
    offset = 0,
): Promise<ArticleWithFeedTitle[]> {
    return db
        .select({
            id: articles.id,
            feedId: articles.feedId,
            title: articles.title,
            summary: articles.summary,
            authorName: articles.authorName,
            publishedAt: articles.publishedAt,
            originalLink: articles.originalLink,
            feedTitle: feeds.title,
        })
        .from(articles)
        .leftJoin(feeds, eq(articles.feedId, feeds.id))
        .orderBy(desc(articles.publishedAt))
        .limit(limit)
        .offset(offset)
        .all();
}

export async function upsertArticle(
    db: BetterSQLite3Database,
    article: {
        id: string;
        feedId: string;
        freshrssItemId: string;
        title: string;
        content: string;
        summary?: string;
        originalLink: string;
        authorName?: string;
        publishedAt: Date;
        mediaPending?: boolean;
    }
) {
    return db
        .insert(articles)
        .values({
            id: article.id,
            feedId: article.feedId,
            freshrssItemId: article.freshrssItemId,
            title: article.title,
            content: article.content,
            summary: article.summary,
            originalLink: article.originalLink,
            authorName: article.authorName,
            publishedAt: article.publishedAt,
            syncedAt: new Date(),
            mediaPending: article.mediaPending ?? true,
        })
        .onConflictDoUpdate({
            target: articles.freshrssItemId,
            set: {
                title: article.title,
                content: article.content,
                summary: article.summary,
                originalLink: article.originalLink,
                authorName: article.authorName,
                publishedAt: article.publishedAt,
                syncedAt: new Date(),
            },
        })
        .returning()
        .all();
}

import { eq, desc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { articles } from '../schema';

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

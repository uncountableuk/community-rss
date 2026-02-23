import { eq, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { articles } from '../schema';

export async function getArticles(db: D1Database, limit = 20, offset = 0) {
    const d1 = drizzle(db);
    return d1
        .select()
        .from(articles)
        .orderBy(desc(articles.publishedAt))
        .limit(limit)
        .offset(offset)
        .all();
}

export async function getArticleById(db: D1Database, id: string) {
    const d1 = drizzle(db);
    const result = await d1.select().from(articles).where(eq(articles.id, id)).all();
    return result[0] || null;
}

export async function upsertArticle(
    db: D1Database,
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
    const d1 = drizzle(db);
    return d1
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

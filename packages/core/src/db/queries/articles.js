import { eq, desc } from 'drizzle-orm';
import { articles } from '../schema';
export async function getArticles(db, limit = 20, offset = 0) {
    return db
        .select()
        .from(articles)
        .orderBy(desc(articles.publishedAt))
        .limit(limit)
        .offset(offset)
        .all();
}
export async function getArticleById(db, id) {
    const result = await db.select().from(articles).where(eq(articles.id, id)).all();
    return result[0] || null;
}
export async function upsertArticle(db, article) {
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
//# sourceMappingURL=articles.js.map
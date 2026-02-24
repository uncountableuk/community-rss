import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { feeds } from '../schema';

export async function getFeeds(db: D1Database) {
    const d1 = drizzle(db);
    return d1.select().from(feeds).all();
}

export async function getFeedById(db: D1Database, id: string) {
    const d1 = drizzle(db);
    const result = await d1.select().from(feeds).where(eq(feeds.id, id)).all();
    return result[0] || null;
}

export async function upsertFeed(
    db: D1Database,
    feed: {
        id: string;
        userId: string;
        feedUrl: string;
        title: string;
        description?: string;
        category?: string;
        status?: 'pending' | 'approved' | 'rejected';
    }
) {
    const d1 = drizzle(db);
    return d1
        .insert(feeds)
        .values({
            id: feed.id,
            userId: feed.userId,
            feedUrl: feed.feedUrl,
            title: feed.title,
            description: feed.description,
            category: feed.category,
            status: feed.status || 'approved',
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: feeds.id,
            set: {
                title: feed.title,
                description: feed.description,
                category: feed.category,
                updatedAt: new Date(),
            },
        })
        .returning()
        .all();
}

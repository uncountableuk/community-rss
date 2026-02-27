import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { feeds } from '../schema';

export async function getFeeds(db: BetterSQLite3Database) {
    return db.select().from(feeds).all();
}

export async function getFeedById(db: BetterSQLite3Database, id: string) {
    const result = await db.select().from(feeds).where(eq(feeds.id, id)).all();
    return result[0] || null;
}

/**
 * Returns all feeds owned by a specific user.
 *
 * @param db - Drizzle database instance
 * @param userId - The feed owner's user ID
 * @returns Array of feed records
 * @since 0.3.0
 */
export async function getFeedsByUserId(db: BetterSQLite3Database, userId: string) {
    return db.select().from(feeds).where(eq(feeds.userId, userId)).all();
}

/**
 * Deletes a feed by ID.
 *
 * Cascading foreign keys handle article and interaction cleanup.
 *
 * @param db - Drizzle database instance
 * @param id - The feed ID to delete
 * @returns The deleted feed record(s)
 * @since 0.3.0
 */
export async function deleteFeed(db: BetterSQLite3Database, id: string) {
    return db.delete(feeds).where(eq(feeds.id, id)).returning().all();
}

export async function upsertFeed(
    db: BetterSQLite3Database,
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
    return db
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

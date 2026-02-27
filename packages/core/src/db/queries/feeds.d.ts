import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
export declare function getFeeds(db: BetterSQLite3Database): Promise<{
    status: string;
    title: string | null;
    id: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    feedUrl: string;
    category: string | null;
    consentAt: Date | null;
}[]>;
export declare function getFeedById(db: BetterSQLite3Database, id: string): Promise<{
    status: string;
    title: string | null;
    id: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    feedUrl: string;
    category: string | null;
    consentAt: Date | null;
}>;
/**
 * Returns all feeds owned by a specific user.
 *
 * @param db - Drizzle database instance
 * @param userId - The feed owner's user ID
 * @returns Array of feed records
 * @since 0.3.0
 */
export declare function getFeedsByUserId(db: BetterSQLite3Database, userId: string): Promise<{
    status: string;
    title: string | null;
    id: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    feedUrl: string;
    category: string | null;
    consentAt: Date | null;
}[]>;
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
export declare function deleteFeed(db: BetterSQLite3Database, id: string): Promise<{
    status: string;
    title: string | null;
    id: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    feedUrl: string;
    category: string | null;
    consentAt: Date | null;
}[]>;
export declare function upsertFeed(db: BetterSQLite3Database, feed: {
    id: string;
    userId: string;
    feedUrl: string;
    title: string;
    description?: string;
    category?: string;
    status?: 'pending' | 'approved' | 'rejected';
}): Promise<{
    status: string;
    title: string | null;
    id: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    feedUrl: string;
    category: string | null;
    consentAt: Date | null;
}[]>;
//# sourceMappingURL=feeds.d.ts.map
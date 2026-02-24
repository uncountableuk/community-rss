import { drizzle } from 'drizzle-orm/d1';
import { users } from '../schema';

/**
 * System user ID used as the owner for feeds created during FreshRSS sync.
 * @since 0.2.0
 */
export const SYSTEM_USER_ID = 'system';

/**
 * Ensures the system user exists in the database.
 *
 * The system user owns feeds created during FreshRSS sync.
 * Uses INSERT OR IGNORE so it's safe to call on every sync run.
 *
 * @param db - D1 database binding
 * @since 0.2.0
 */
export async function ensureSystemUser(db: D1Database): Promise<void> {
    const d1 = drizzle(db);
    await d1
        .insert(users)
        .values({
            id: SYSTEM_USER_ID,
            name: 'System',
            isGuest: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .run();
}

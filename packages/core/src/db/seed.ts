/**
 * Database seed logic for the Community RSS framework.
 *
 * Seeds essential data such as the System User. Designed to be
 * called from a dev-only API route (`GET /api/dev/seed`) since
 * local D1 runs inside Miniflare/Wrangler and cannot be accessed
 * via standard Node.js SQLite drivers.
 *
 * Idempotent — safe to run multiple times.
 *
 * @since 0.3.0
 */

import { drizzle } from 'drizzle-orm/d1';
import { users } from './schema';

/**
 * System user ID — single source of truth.
 * Re-exported from queries/users.ts for consistency.
 */
const SYSTEM_USER_ID = 'system';

/**
 * Seeds the System User into the database.
 *
 * The System User owns global/community feeds imported from FreshRSS.
 * It cannot sign in and has `role: 'system'`.
 *
 * @param db - D1 database binding
 * @returns Object indicating whether the system user was created or already existed
 * @since 0.3.0
 */
export async function seedSystemUser(db: D1Database): Promise<{ created: boolean }> {
    const d1 = drizzle(db);
    const result = await d1
        .insert(users)
        .values({
            id: SYSTEM_USER_ID,
            name: 'System',
            isGuest: false,
            role: 'system',
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning()
        .all();

    return { created: result.length > 0 };
}

/**
 * Runs all database seed operations.
 *
 * Call this from the dev-only seed route or post-migration script.
 *
 * @param db - D1 database binding
 * @returns Summary of seed operations
 * @since 0.3.0
 */
export async function seedDatabase(db: D1Database): Promise<{
    systemUser: { created: boolean };
}> {
    const systemUser = await seedSystemUser(db);
    return { systemUser };
}

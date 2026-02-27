/**
 * Database seed logic for the Community RSS framework.
 *
 * Seeds essential data such as the System User. Designed to be
 * called from a dev-only API route (`GET /api/dev/seed`) or
 * post-migration script.
 *
 * Idempotent — safe to run multiple times.
 *
 * @since 0.3.0
 */
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
/**
 * Seeds the System User into the database.
 *
 * The System User owns global/community feeds imported from FreshRSS.
 * It cannot sign in and has `role: 'system'`.
 *
 * @param db - Drizzle database instance
 * @returns Object indicating whether the system user was created or already existed
 * @since 0.3.0
 */
export declare function seedSystemUser(db: BetterSQLite3Database): Promise<{
    created: boolean;
}>;
/**
 * Runs all database seed operations.
 *
 * Call this from the dev-only seed route or post-migration script.
 *
 * @param db - Drizzle database instance
 * @returns Summary of seed operations
 * @since 0.3.0
 */
export declare function seedDatabase(db: BetterSQLite3Database): Promise<{
    systemUser: {
        created: boolean;
    };
}>;
//# sourceMappingURL=seed.d.ts.map
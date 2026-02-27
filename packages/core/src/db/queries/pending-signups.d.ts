import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
/**
 * Creates a pending sign-up record.
 *
 * Stores the user's display name and terms consent timestamp
 * between sign-up form submission and magic-link verification.
 * Uses upsert to handle re-submissions with the same email.
 *
 * @param db - Drizzle database instance
 * @param email - User's email address
 * @param name - Display name from sign-up form
 * @returns The created/updated pending sign-up record
 * @since 0.3.0
 */
export declare function createPendingSignup(db: BetterSQLite3Database, email: string, name: string): Promise<{
    name: string;
    email: string;
    termsAcceptedAt: Date;
    createdAt: Date;
}>;
/**
 * Retrieves a pending sign-up record by email.
 *
 * @param db - Drizzle database instance
 * @param email - Email address to look up
 * @returns Pending sign-up record or null if not found
 * @since 0.3.0
 */
export declare function getPendingSignup(db: BetterSQLite3Database, email: string): Promise<{
    name: string;
    email: string;
    termsAcceptedAt: Date;
    createdAt: Date;
}>;
/**
 * Deletes a pending sign-up record after successful verification.
 *
 * @param db - Drizzle database instance
 * @param email - Email address to delete
 * @since 0.3.0
 */
export declare function deletePendingSignup(db: BetterSQLite3Database, email: string): Promise<void>;
/**
 * Cleans up expired pending sign-up records.
 *
 * Records older than the specified max age are deleted.
 * Should be called periodically to prevent stale data accumulation.
 *
 * @param db - Drizzle database instance
 * @param maxAgeMs - Maximum age in milliseconds (default: 24 hours)
 * @since 0.3.0
 */
export declare function cleanupExpiredSignups(db: BetterSQLite3Database, maxAgeMs?: number): Promise<void>;
//# sourceMappingURL=pending-signups.d.ts.map
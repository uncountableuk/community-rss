import { eq, lt } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { pendingSignups } from '../schema';

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
export async function createPendingSignup(
    db: BetterSQLite3Database,
    email: string,
    name: string,
) {
    const now = new Date();
    const result = await db
        .insert(pendingSignups)
        .values({
            email,
            name,
            termsAcceptedAt: now,
            createdAt: now,
        })
        .onConflictDoUpdate({
            target: pendingSignups.email,
            set: {
                name,
                termsAcceptedAt: now,
                createdAt: now,
            },
        })
        .returning()
        .all();
    return result[0] || null;
}

/**
 * Retrieves a pending sign-up record by email.
 *
 * @param db - Drizzle database instance
 * @param email - Email address to look up
 * @returns Pending sign-up record or null if not found
 * @since 0.3.0
 */
export async function getPendingSignup(db: BetterSQLite3Database, email: string) {
    const result = await db
        .select()
        .from(pendingSignups)
        .where(eq(pendingSignups.email, email))
        .all();
    return result[0] || null;
}

/**
 * Deletes a pending sign-up record after successful verification.
 *
 * @param db - Drizzle database instance
 * @param email - Email address to delete
 * @since 0.3.0
 */
export async function deletePendingSignup(
    db: BetterSQLite3Database,
    email: string,
): Promise<void> {
    await db
        .delete(pendingSignups)
        .where(eq(pendingSignups.email, email))
        .run();
}

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
export async function cleanupExpiredSignups(
    db: BetterSQLite3Database,
    maxAgeMs: number = 24 * 60 * 60 * 1000,
): Promise<void> {
    const cutoff = new Date(Date.now() - maxAgeMs);
    await db
        .delete(pendingSignups)
        .where(lt(pendingSignups.createdAt, cutoff))
        .run();
}

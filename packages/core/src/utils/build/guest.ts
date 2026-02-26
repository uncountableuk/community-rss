/**
 * Server-side guest management utilities.
 *
 * Handles creation of shadow profiles and migration of guest
 * interactions to registered user accounts.
 *
 * @since 0.3.0
 */

import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { createGuestUser, migrateGuestToUser as migrateGuest } from '../../db/queries/users';

/**
 * Creates a shadow profile for a guest user.
 *
 * Called server-side when a guest accepts the consent modal and
 * performs their first interaction.
 *
 * @param db - Drizzle database instance
 * @param guestId - Client-generated UUID from the `crss_guest` cookie
 * @returns The created guest user record, or null if already exists
 * @since 0.3.0
 */
export async function createShadowProfile(
    db: BetterSQLite3Database,
    guestId: string,
) {
    return createGuestUser(db, guestId);
}

/**
 * Migrates all guest interactions to a registered user account.
 *
 * Called after a guest registers via magic link. Transfers all hearts,
 * stars, and comments from the guest UUID to the new user ID, then
 * deletes the guest user row.
 *
 * Idempotent — migrating a non-existent guest is a no-op.
 *
 * @param db - Drizzle database instance
 * @param guestId - The guest's UUID from the cookie
 * @param userId - The registered user's ID from better-auth
 * @since 0.3.0
 */
export async function migrateGuestToUser(
    db: BetterSQLite3Database,
    guestId: string,
    userId: string,
): Promise<void> {
    return migrateGuest(db, guestId, userId);
}

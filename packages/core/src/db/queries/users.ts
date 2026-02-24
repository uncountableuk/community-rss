import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { users, interactions, comments } from '../schema';

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
 * Sets `role: 'system'` to distinguish from regular users.
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
            role: 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .run();
}

/**
 * Retrieves a user by their ID.
 *
 * @param db - D1 database binding
 * @param id - User ID
 * @returns User record or null if not found
 * @since 0.3.0
 */
export async function getUserById(db: D1Database, id: string) {
    const d1 = drizzle(db);
    const result = await d1.select().from(users).where(eq(users.id, id)).all();
    return result[0] || null;
}

/**
 * Retrieves a user by their email address.
 *
 * @param db - D1 database binding
 * @param email - User email address
 * @returns User record or null if not found
 * @since 0.3.0
 */
export async function getUserByEmail(db: D1Database, email: string) {
    const d1 = drizzle(db);
    const result = await d1.select().from(users).where(eq(users.email, email)).all();
    return result[0] || null;
}

/**
 * Creates a guest user with a shadow profile.
 *
 * Guests have `isGuest = true` and `role = 'user'`. Their ID is
 * the UUID generated client-side via `crypto.randomUUID()`.
 *
 * @param db - D1 database binding
 * @param guestId - Client-generated UUID
 * @returns The created guest user record
 * @since 0.3.0
 */
export async function createGuestUser(db: D1Database, guestId: string) {
    const d1 = drizzle(db);
    const result = await d1
        .insert(users)
        .values({
            id: guestId,
            isGuest: true,
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning()
        .all();
    return result[0] || null;
}

/**
 * Migrates all interactions and comments from a guest to a registered user.
 *
 * Transfers ownership of hearts, stars, and comments, then deletes
 * the guest user row. Idempotent — migrating a non-existent guest
 * is a no-op.
 *
 * @param db - D1 database binding
 * @param guestId - The guest's UUID
 * @param userId - The registered user's ID
 * @since 0.3.0
 */
export async function migrateGuestToUser(
    db: D1Database,
    guestId: string,
    userId: string,
): Promise<void> {
    const d1 = drizzle(db);

    // Transfer interactions (hearts/stars)
    await d1
        .update(interactions)
        .set({ userId })
        .where(eq(interactions.userId, guestId))
        .run();

    // Transfer comments
    await d1
        .update(comments)
        .set({ userId })
        .where(eq(comments.userId, guestId))
        .run();

    // Delete the guest user row
    await d1
        .delete(users)
        .where(eq(users.id, guestId))
        .run();
}

/**
 * Checks whether a user has the admin role.
 *
 * @param user - User record with at least `role` field
 * @returns `true` if the user is an admin
 * @since 0.3.0
 */
export function isAdmin(user: { role: string }): boolean {
    return user.role === 'admin';
}

/**
 * Checks whether a user has the system role.
 *
 * @param user - User record with at least `role` field
 * @returns `true` if the user is the system user
 * @since 0.3.0
 */
export function isSystemUser(user: { role: string }): boolean {
    return user.role === 'system';
}

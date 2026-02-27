import { eq } from 'drizzle-orm';
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
 * @param db - Drizzle database instance
 * @since 0.2.0
 */
export async function ensureSystemUser(db) {
    await db
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
 * @param db - Drizzle database instance
 * @param id - User ID
 * @returns User record or null if not found
 * @since 0.3.0
 */
export async function getUserById(db, id) {
    const result = await db.select().from(users).where(eq(users.id, id)).all();
    return result[0] || null;
}
/**
 * Retrieves a user by their email address.
 *
 * @param db - Drizzle database instance
 * @param email - User email address
 * @returns User record or null if not found
 * @since 0.3.0
 */
export async function getUserByEmail(db, email) {
    const result = await db.select().from(users).where(eq(users.email, email)).all();
    return result[0] || null;
}
/**
 * Creates a guest user with a shadow profile.
 *
 * Guests have `isGuest = true` and `role = 'user'`. Their ID is
 * the UUID generated client-side via `crypto.randomUUID()`.
 *
 * @param db - Drizzle database instance
 * @param guestId - Client-generated UUID
 * @returns The created guest user record
 * @since 0.3.0
 */
export async function createGuestUser(db, guestId) {
    const result = await db
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
 * @param db - Drizzle database instance
 * @param guestId - The guest's UUID
 * @param userId - The registered user's ID
 * @since 0.3.0
 */
export async function migrateGuestToUser(db, guestId, userId) {
    // Transfer interactions (hearts/stars)
    await db
        .update(interactions)
        .set({ userId })
        .where(eq(interactions.userId, guestId))
        .run();
    // Transfer comments
    await db
        .update(comments)
        .set({ userId })
        .where(eq(comments.userId, guestId))
        .run();
    // Delete the guest user row
    await db
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
export function isAdmin(user) {
    return user.role === 'admin';
}
/**
 * Checks whether a user has the system role.
 *
 * @param user - User record with at least `role` field
 * @returns `true` if the user is the system user
 * @since 0.3.0
 */
export function isSystemUser(user) {
    return user.role === 'system';
}
/**
 * Updates mutable fields on a user record.
 *
 * @param db - Drizzle database instance
 * @param id - User ID to update
 * @param data - Partial user fields to update
 * @returns The updated user record or null if not found
 * @since 0.3.0
 */
export async function updateUser(db, id, data) {
    const result = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()
        .all();
    return result[0] || null;
}
/**
 * Finds a user by their pending email change token.
 *
 * @param db - Drizzle database instance
 * @param token - The pending email change token
 * @returns User record or null if not found
 * @since 0.3.0
 */
export async function getUserByPendingEmailToken(db, token) {
    const result = await db
        .select()
        .from(users)
        .where(eq(users.pendingEmailToken, token))
        .all();
    return result[0] || null;
}
/**
 * Sets a pending email change on a user record.
 *
 * Stores the new address, verification token, and expiry. The change
 * does not take effect until {@link confirmEmailChange} is called with
 * the matching token.
 *
 * @param db - Drizzle database instance
 * @param userId - ID of the user requesting the change
 * @param pendingEmail - The new email address to verify
 * @param token - One-time verification token
 * @param expiresAt - Token expiry date
 * @returns The updated user record or null if not found
 * @since 0.3.0
 */
export async function setPendingEmail(db, userId, pendingEmail, token, expiresAt) {
    const result = await db
        .update(users)
        .set({ pendingEmail, pendingEmailToken: token, pendingEmailExpiresAt: expiresAt, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning()
        .all();
    return result[0] || null;
}
/**
 * Confirms an email change using a verification token.
 *
 * Validates the token, checks expiry, promotes `pendingEmail` to the
 * active `email`, and clears the pending fields. Returns the updated
 * user on success, `{ expired: true }` if the token has expired, or
 * `null` if no matching token exists.
 *
 * @param db - Drizzle database instance
 * @param token - The verification token from the confirmation link
 * @returns Updated user, `{ expired: true }`, or `null`
 * @since 0.3.0
 */
export async function confirmEmailChange(db, token) {
    const found = await db
        .select()
        .from(users)
        .where(eq(users.pendingEmailToken, token))
        .all();
    const user = found[0];
    if (!user || !user.pendingEmail || !user.pendingEmailExpiresAt)
        return null;
    if (user.pendingEmailExpiresAt < new Date()) {
        return { expired: true };
    }
    const updated = await db
        .update(users)
        .set({
        email: user.pendingEmail,
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpiresAt: null,
        updatedAt: new Date(),
    })
        .where(eq(users.id, user.id))
        .returning()
        .all();
    return updated[0] || null;
}
//# sourceMappingURL=users.js.map
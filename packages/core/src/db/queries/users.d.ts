import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
/**
 * System user ID used as the owner for feeds created during FreshRSS sync.
 * @since 0.2.0
 */
export declare const SYSTEM_USER_ID = "system";
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
export declare function ensureSystemUser(db: BetterSQLite3Database): Promise<void>;
/**
 * Retrieves a user by their ID.
 *
 * @param db - Drizzle database instance
 * @param id - User ID
 * @returns User record or null if not found
 * @since 0.3.0
 */
export declare function getUserById(db: BetterSQLite3Database, id: string): Promise<{
    name: string | null;
    email: string | null;
    id: string;
    role: string;
    isGuest: boolean;
    bio: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    termsAcceptedAt: Date | null;
    pendingEmail: string | null;
    pendingEmailToken: string | null;
    pendingEmailExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Retrieves a user by their email address.
 *
 * @param db - Drizzle database instance
 * @param email - User email address
 * @returns User record or null if not found
 * @since 0.3.0
 */
export declare function getUserByEmail(db: BetterSQLite3Database, email: string): Promise<{
    name: string | null;
    email: string | null;
    id: string;
    role: string;
    isGuest: boolean;
    bio: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    termsAcceptedAt: Date | null;
    pendingEmail: string | null;
    pendingEmailToken: string | null;
    pendingEmailExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
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
export declare function createGuestUser(db: BetterSQLite3Database, guestId: string): Promise<{
    name: string | null;
    email: string | null;
    id: string;
    role: string;
    isGuest: boolean;
    bio: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    termsAcceptedAt: Date | null;
    pendingEmail: string | null;
    pendingEmailToken: string | null;
    pendingEmailExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
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
export declare function migrateGuestToUser(db: BetterSQLite3Database, guestId: string, userId: string): Promise<void>;
/**
 * Checks whether a user has the admin role.
 *
 * @param user - User record with at least `role` field
 * @returns `true` if the user is an admin
 * @since 0.3.0
 */
export declare function isAdmin(user: {
    role: string;
}): boolean;
/**
 * Checks whether a user has the system role.
 *
 * @param user - User record with at least `role` field
 * @returns `true` if the user is the system user
 * @since 0.3.0
 */
export declare function isSystemUser(user: {
    role: string;
}): boolean;
/**
 * Updates mutable fields on a user record.
 *
 * @param db - Drizzle database instance
 * @param id - User ID to update
 * @param data - Partial user fields to update
 * @returns The updated user record or null if not found
 * @since 0.3.0
 */
export declare function updateUser(db: BetterSQLite3Database, id: string, data: {
    name?: string;
    bio?: string;
    termsAcceptedAt?: Date;
}): Promise<{
    name: string | null;
    email: string | null;
    id: string;
    role: string;
    isGuest: boolean;
    bio: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    termsAcceptedAt: Date | null;
    pendingEmail: string | null;
    pendingEmailToken: string | null;
    pendingEmailExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Finds a user by their pending email change token.
 *
 * @param db - Drizzle database instance
 * @param token - The pending email change token
 * @returns User record or null if not found
 * @since 0.3.0
 */
export declare function getUserByPendingEmailToken(db: BetterSQLite3Database, token: string): Promise<{
    name: string | null;
    email: string | null;
    id: string;
    role: string;
    isGuest: boolean;
    bio: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    termsAcceptedAt: Date | null;
    pendingEmail: string | null;
    pendingEmailToken: string | null;
    pendingEmailExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
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
export declare function setPendingEmail(db: BetterSQLite3Database, userId: string, pendingEmail: string, token: string, expiresAt: Date): Promise<{
    name: string | null;
    email: string | null;
    id: string;
    role: string;
    isGuest: boolean;
    bio: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    termsAcceptedAt: Date | null;
    pendingEmail: string | null;
    pendingEmailToken: string | null;
    pendingEmailExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
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
export declare function confirmEmailChange(db: BetterSQLite3Database, token: string): Promise<ReturnType<typeof updateUser> | {
    expired: true;
} | null>;
//# sourceMappingURL=users.d.ts.map
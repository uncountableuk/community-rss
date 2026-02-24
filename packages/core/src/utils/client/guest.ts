/**
 * Client-side guest session management.
 *
 * Manages the guest UUID cookie (`crss_guest`) that identifies
 * anonymous users who have accepted the consent prompt.
 * The UUID is generated via `crypto.randomUUID()` on first interaction.
 *
 * @since 0.3.0
 */

const GUEST_COOKIE_NAME = 'crss_guest';
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Initialises a guest session by generating a UUID and setting a cookie.
 *
 * Only called after the user accepts the consent modal.
 * Returns the generated guest ID.
 *
 * @returns The generated guest UUID
 * @since 0.3.0
 */
export function initGuestSession(): string {
    const guestId = crypto.randomUUID();
    document.cookie = `${GUEST_COOKIE_NAME}=${guestId}; path=/; max-age=${GUEST_COOKIE_MAX_AGE}; samesite=lax`;
    return guestId;
}

/**
 * Reads the guest UUID from the cookie.
 *
 * @returns The guest UUID or null if no guest session exists
 * @since 0.3.0
 */
export function getGuestId(): string | null {
    const match = document.cookie.match(new RegExp(`${GUEST_COOKIE_NAME}=([^;]+)`));
    return match ? match[1] : null;
}

/**
 * Checks whether the current user is a guest (has a guest cookie but no auth session).
 *
 * @returns `true` if a guest cookie exists
 * @since 0.3.0
 */
export function isGuest(): boolean {
    return getGuestId() !== null;
}

/**
 * Clears the guest session cookie.
 *
 * Called when a registered user signs out. A new guest UUID is NOT
 * automatically created — it's only generated when the user next
 * attempts an interaction (heart/star/comment) while signed out,
 * re-triggering the consent modal.
 *
 * @since 0.3.0
 */
export function clearGuestSession(): void {
    document.cookie = `${GUEST_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

import type { APIRoute } from 'astro';
/**
 * Confirm a pending email address change.
 *
 * Validates the one-time token from the verification link. On success,
 * the user's email is updated to the pending address and the pending
 * fields are cleared.
 *
 * - `GET /api/v1/profile/confirm-email-change?token=<token>`
 *
 * Returns:
 * - `200` with `{ message }` on success
 * - `400` with `{ code: 'TOKEN_EXPIRED' }` if the token has expired
 * - `404` with `{ code: 'TOKEN_NOT_FOUND' }` if no matching token exists
 * - `503` if the database is unavailable
 *
 * @route /api/v1/profile/confirm-email-change
 * @since 0.3.0
 */
export declare const GET: APIRoute;
//# sourceMappingURL=confirm-email-change.d.ts.map
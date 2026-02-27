import type { APIRoute } from 'astro';
/**
 * Check whether an email address is already registered.
 *
 * Used by the sign-in form to distinguish returning users from new
 * sign-ups. Returns `{ exists: true }` if a non-guest user with this
 * email exists, `{ exists: false }` otherwise.
 *
 * @route GET /api/v1/auth/check-email?email=...
 * @since 0.3.0
 */
export declare const GET: APIRoute;
//# sourceMappingURL=check-email.d.ts.map
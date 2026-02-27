import type { APIRoute } from 'astro';
/**
 * User profile API endpoint.
 *
 * - `GET /api/v1/profile` — returns the authenticated user's profile data
 * - `PATCH /api/v1/profile` — updates name and/or bio
 *
 * Both methods require authentication.
 *
 * @route /api/v1/profile
 * @since 0.3.0
 */
export declare const GET: APIRoute;
/**
 * Update the authenticated user's profile.
 *
 * Accepts optional `name` and `bio` fields. Returns the updated profile.
 *
 * @since 0.3.0
 */
export declare const PATCH: APIRoute;
//# sourceMappingURL=profile.d.ts.map
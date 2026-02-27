import type { APIRoute } from 'astro';
/**
 * Sign-up endpoint for new user registration.
 *
 * Accepts email, display name, and terms consent. Stores the
 * registration data in `pending_signups` and triggers a welcome
 * magic-link email via better-auth. The pending data is applied
 * to the user record after magic-link verification in the
 * auth catch-all route handler.
 *
 * @route POST /api/v1/auth/signup
 * @since 0.3.0
 */
export declare const POST: APIRoute;
//# sourceMappingURL=signup.d.ts.map
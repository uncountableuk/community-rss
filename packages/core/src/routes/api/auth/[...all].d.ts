import type { APIRoute } from 'astro';
/**
 * better-auth catch-all route handler.
 *
 * Delegates all requests under `/api/auth/*` to better-auth's native
 * router. This single handler covers:
 * - `POST /api/auth/sign-in/magic-link` — request magic link
 * - `GET /api/auth/magic-link/verify` — verify magic link token
 * - `GET /api/auth/get-session` — get current session
 * - `POST /api/auth/sign-out` — sign out
 * - All other better-auth endpoints
 *
 * After magic link verification, applies pending sign-up data (display
 * name, terms consent) and migrates guest interactions if applicable.
 *
 * @since 0.3.0
 */
export declare const ALL: APIRoute;
export declare const GET: APIRoute;
export declare const POST: APIRoute;
//# sourceMappingURL=%5B...all%5D.d.ts.map
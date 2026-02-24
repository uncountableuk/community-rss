import type { APIRoute } from 'astro';
import { createAuth } from '../../../utils/build/auth';
import { migrateGuestToUser } from '../../../db/queries/users';
import type { Env } from '../../../types/env';

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
 * No manual route wrappers needed — better-auth manages its own
 * URL namespace.
 *
 * @since 0.3.0
 */
export const ALL: APIRoute = async ({ request, locals }) => {
    const env = (locals as { runtime?: { env?: Env } }).runtime?.env;

    if (!env?.DB) {
        return new Response(
            JSON.stringify({ error: 'Database not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    const auth = createAuth(env);

    // Handle guest-to-user migration after magic link verification
    // Read the guest ID cookie from the request
    const guestId = getGuestIdFromCookie(request);

    const response = await auth.handler(request);

    // After successful magic link verification, check if we need to
    // migrate guest interactions to the newly created/authenticated user
    if (guestId && request.url.includes('/magic-link/verify')) {
        try {
            const session = await auth.api.getSession({
                headers: request.headers,
            });
            if (session?.user) {
                await migrateGuestToUser(env.DB, guestId, session.user.id);
                // Clear the guest cookie by setting it expired in the response
                const newResponse = new Response(response.body, response);
                newResponse.headers.append(
                    'Set-Cookie',
                    'crss_guest=; Path=/; Max-Age=0; SameSite=Lax',
                );
                return newResponse;
            }
        } catch {
            // Migration failure shouldn't block auth — log and continue
            console.warn('[community-rss] Guest migration failed for', guestId);
        }
    }

    return response;
};

// Also handle GET, POST, etc. individually for Astro route matching
export const GET = ALL;
export const POST = ALL;

/**
 * Extracts the guest UUID from the `crss_guest` cookie.
 *
 * @param request - The incoming request
 * @returns The guest UUID or null
 */
function getGuestIdFromCookie(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const match = cookieHeader.match(/crss_guest=([^;]+)/);
    return match ? match[1] : null;
}

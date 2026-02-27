import type { APIRoute } from 'astro';
import { createAuth } from '../../../utils/build/auth';
import { migrateGuestToUser, updateUser } from '../../../db/queries/users';
import { getPendingSignup, deletePendingSignup } from '../../../db/queries/pending-signups';
import type { AppContext } from '../../../types/context';

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
export const ALL: APIRoute = async ({ request, locals }) => {
    const app = (locals as { app?: AppContext }).app;

    if (!app?.db) {
        return new Response(
            JSON.stringify({ error: 'Database not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        const auth = createAuth(app);

        // Read the guest ID cookie from the request for potential migration
        const guestId = getGuestIdFromCookie(request);

        let response: Response;
        try {
            response = await auth.handler(request);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            const errorStack = err instanceof Error ? err.stack : undefined;
            console.error('[community-rss] Auth handler error:', {
                message: errorMsg,
                stack: errorStack,
                url: request.url,
                method: request.method,
            });
            return new Response(
                JSON.stringify({ error: 'Authentication failed', details: errorMsg }),
                { status: 500, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // After successful magic link verification, apply pending sign-up data
        // and migrate guest interactions if applicable
        if (request.url.includes('/magic-link/verify')) {
            try {
                // The session cookie is in the response headers, not the request headers
                const reqHeaders = new Headers(request.headers);
                const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
                const newCookies: string[] = [];

                for (const sc of setCookies) {
                    const match = sc.match(/^([^=]+)=([^;]+)/);
                    if (match) {
                        newCookies.push(`${match[1]}=${match[2]}`);
                    }
                }

                if (newCookies.length > 0) {
                    const existingCookie = reqHeaders.get('cookie');
                    reqHeaders.set('cookie', (existingCookie ? existingCookie + '; ' : '') + newCookies.join('; '));
                }

                const session = await auth.api.getSession({
                    headers: reqHeaders,
                });
                if (session?.user) {
                    const userId = session.user.id;
                    const userEmail = session.user.email;

                    // Apply pending sign-up data (name + terms consent)
                    if (userEmail) {
                        const pending = await getPendingSignup(app.db, userEmail);
                        if (pending) {
                            await updateUser(app.db, userId, {
                                name: pending.name,
                                termsAcceptedAt: pending.termsAcceptedAt,
                            });
                            await deletePendingSignup(app.db, userEmail);
                        }
                    }

                    // Migrate guest interactions to the new/authenticated user
                    if (guestId) {
                        await migrateGuestToUser(app.db, guestId, userId);
                    }

                    // Clear the guest cookie by setting it expired in the response
                    if (guestId) {
                        const newResponse = new Response(response.body, {
                            status: response.status,
                            statusText: response.statusText,
                            headers: new Headers(response.headers),
                        });
                        newResponse.headers.set(
                            'Set-Cookie',
                            'crss_guest=; Path=/; Max-Age=0; SameSite=Lax',
                        );
                        return newResponse;
                    }
                }
            } catch (err) {
                // Post-verification steps shouldn't block auth — log and continue
                console.warn('[community-rss] Post-verification processing failed:', err);
            }
        }

        return response;
    } catch (err) {
        console.error('[community-rss] Unexpected auth error:', err);
        return new Response(
            JSON.stringify({ error: 'Unexpected authentication error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
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

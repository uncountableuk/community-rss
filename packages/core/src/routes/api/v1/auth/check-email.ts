import type { APIRoute } from 'astro';
import { getUserByEmail } from '../../../../db/queries/users';
import type { Env } from '../../../../types/env';

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
export const GET: APIRoute = async ({ request, locals }) => {
    const env = (locals as { runtime?: { env?: Env } }).runtime?.env;

    if (!env?.DB) {
        return new Response(
            JSON.stringify({ error: 'Database not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    const url = new URL(request.url);
    const email = url.searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
        return new Response(
            JSON.stringify({ code: 'INVALID_EMAIL', message: 'Email is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
    }

    // Basic email format check
    if (!email.includes('@') || email.length < 3) {
        return new Response(
            JSON.stringify({ code: 'INVALID_EMAIL', message: 'Invalid email format' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        const user = await getUserByEmail(env.DB, email);
        const exists = user !== null && !user.isGuest;

        return new Response(
            JSON.stringify({ exists }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (err) {
        console.error('[community-rss] Email check failed:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

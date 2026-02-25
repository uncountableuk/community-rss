import type { APIRoute } from 'astro';
import { createAuth } from '../../../../utils/build/auth';
import { createPendingSignup } from '../../../../db/queries/pending-signups';
import { getUserByEmail } from '../../../../db/queries/users';
import type { Env } from '../../../../types/env';

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
export const POST: APIRoute = async ({ request, locals }) => {
    const env = (locals as { runtime?: { env?: Env } }).runtime?.env;

    if (!env?.DB) {
        return new Response(
            JSON.stringify({ error: 'Database not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    let body: { email?: string; name?: string; termsAccepted?: boolean };
    try {
        body = await request.json();
    } catch {
        return new Response(
            JSON.stringify({ code: 'INVALID_BODY', message: 'Invalid JSON body' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
    }

    const email = body.email?.trim().toLowerCase();
    const name = body.name?.trim();
    const termsAccepted = body.termsAccepted;

    // Validate required fields
    if (!email || !email.includes('@') || email.length < 3) {
        return new Response(
            JSON.stringify({ code: 'INVALID_EMAIL', message: 'Valid email is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
    }

    if (!name || name.length < 1) {
        return new Response(
            JSON.stringify({ code: 'INVALID_NAME', message: 'Display name is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
    }

    if (name.length > 100) {
        return new Response(
            JSON.stringify({ code: 'INVALID_NAME', message: 'Display name must be 100 characters or less' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
    }

    if (!termsAccepted) {
        return new Response(
            JSON.stringify({ code: 'TERMS_REQUIRED', message: 'You must accept the Terms of Service' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        // Check if this email already belongs to a registered (non-guest) user.
        // If so, send a sign-in magic link rather than a welcome link so the
        // existing account data is never overwritten.
        const existingUser = await getUserByEmail(env.DB, email);
        if (existingUser && !existingUser.isGuest) {
            const auth = createAuth(env);
            await auth.handler(
                new Request(`${env.PUBLIC_SITE_URL}/api/auth/sign-in/magic-link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, callbackURL: '/profile' }),
                }),
            ).catch((err: unknown) => {
                // Non-fatal — log but still return exists:true so the UI shows
                // "check your email". The response is indistinguishable from a
                // successful new sign-up, which avoids account enumeration.
                console.warn('[community-rss] Sign-in link send failed for existing account:', err);
            });

            return new Response(
                JSON.stringify({
                    exists: true,
                    message: 'An account with this email already exists. We\'ve sent a sign-in link to your email.',
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // Store pending sign-up data (will be applied after magic link verification)
        await createPendingSignup(env.DB, email, name);

        // Trigger magic link email via better-auth's internal API
        // The sendMagicLink callback in auth.ts will detect the pending signup
        // and send a welcome email template
        const auth = createAuth(env);
        const magicLinkResponse = await auth.handler(
            new Request(`${env.PUBLIC_SITE_URL}/api/auth/sign-in/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    callbackURL: '/profile',
                }),
            }),
        );

        if (!magicLinkResponse.ok) {
            const errorBody = await magicLinkResponse.text().catch(() => '');
            console.error('[community-rss] Magic link send failed:', errorBody);
            return new Response(
                JSON.stringify({ code: 'EMAIL_SEND_FAILED', message: 'Failed to send verification email' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } },
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Check your email to verify your account' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (err) {
        console.error('[community-rss] Sign-up failed:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

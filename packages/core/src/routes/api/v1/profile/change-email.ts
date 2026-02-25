import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../utils/build/auth';
import { getUserByEmail, setPendingEmail } from '../../../../db/queries/users';
import { sendEmailChangeEmail } from '../../../../utils/build/email';
import type { AppContext } from '../../../../types/context';
import type { EmailUserProfile } from '../../../../types/email';

/**
 * Request an email address change.
 *
 * Accepts the new email address, stores a pending change record, and sends
 * a verification link to the new address. The current email remains active
 * until the user confirms by following the link.
 *
 * Tokens expire after 24 hours. Submitting a new request overwrites any
 * existing pending change.
 *
 * - `POST /api/v1/profile/change-email` — body: `{ email: string }`
 *
 * @route /api/v1/profile/change-email
 * @since 0.3.0
 */
export const POST: APIRoute = async ({ request, locals }) => {
    const app = (locals as { app?: AppContext }).app;

    if (!app?.db) {
        return new Response(
            JSON.stringify({ error: 'Database not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        const session = await requireAuth(request, app);

        let body: { email?: string };
        try {
            body = await request.json();
        } catch {
            return new Response(
                JSON.stringify({ code: 'INVALID_BODY', message: 'Invalid JSON body' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        const newEmail = body.email?.trim().toLowerCase();

        if (!newEmail) {
            return new Response(
                JSON.stringify({ code: 'INVALID_EMAIL', message: 'Email address is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return new Response(
                JSON.stringify({ code: 'INVALID_EMAIL', message: 'Invalid email address format' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // Cannot be the same as the current email
        const currentEmail = session.user.email?.toLowerCase();
        if (newEmail === currentEmail) {
            return new Response(
                JSON.stringify({ code: 'SAME_EMAIL', message: 'New email address must differ from the current one' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // Check whether the new address is already taken
        const existing = await getUserByEmail(app.db, newEmail);
        if (existing) {
            return new Response(
                JSON.stringify({ code: 'EMAIL_IN_USE', message: 'That email address is already in use' }),
                { status: 409, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // Generate a one-time token and 24-hour expiry
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await setPendingEmail(app.db, session.user.id, newEmail, token, expiresAt);

        const siteUrl = app.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';
        const verificationUrl = `${siteUrl}/auth/verify-email-change?token=${token}`;

        // Fire-and-forget: email failure is logged but not surfaced to the caller
        try {
            // Build profile for email personalisation
            const profile: EmailUserProfile = {
                name: (session.user as Record<string, unknown>).name as string | undefined,
                email: currentEmail,
            };
            await sendEmailChangeEmail(app, newEmail, verificationUrl, undefined, profile);
        } catch (emailErr) {
            console.warn('[community-rss] Email change verification email failed to send:', emailErr);
        }

        return new Response(
            JSON.stringify({ message: `Verification link sent to ${newEmail}` }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (err) {
        if (err instanceof Response) return err;
        console.error('[community-rss] Change-email request failed:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

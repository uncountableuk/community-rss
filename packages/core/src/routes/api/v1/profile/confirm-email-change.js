import { confirmEmailChange } from '../../../../db/queries/users';
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
export const GET = async ({ request, locals }) => {
    const app = locals.app;
    if (!app?.db) {
        return new Response(JSON.stringify({ error: 'Database not available' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
    const url = new URL(request.url);
    const token = url.searchParams.get('token')?.trim();
    if (!token) {
        return new Response(JSON.stringify({ code: 'MISSING_TOKEN', message: 'Missing verification token' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    try {
        const result = await confirmEmailChange(app.db, token);
        if (result === null) {
            return new Response(JSON.stringify({ code: 'TOKEN_NOT_FOUND', message: 'Invalid or already-used verification token' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        if ('expired' in result && result.expired) {
            return new Response(JSON.stringify({ code: 'TOKEN_EXPIRED', message: 'This verification link has expired. Please request a new one from your profile.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ message: 'Email address updated successfully' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    catch (err) {
        console.error('[community-rss] Confirm email change failed:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
//# sourceMappingURL=confirm-email-change.js.map
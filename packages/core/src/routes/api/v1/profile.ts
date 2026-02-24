import type { APIRoute } from 'astro';
import { requireAuth } from '../../../utils/build/auth';
import { getUserById, updateUser } from '../../../db/queries/users';
import type { Env } from '../../../types/env';

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
export const GET: APIRoute = async ({ request, locals }) => {
    const env = (locals as { runtime?: { env?: Env } }).runtime?.env;

    if (!env?.DB) {
        return new Response(
            JSON.stringify({ error: 'Database not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        const session = await requireAuth(request, env);
        const user = await getUserById(env.DB, session.user.id);

        if (!user) {
            return new Response(
                JSON.stringify({ code: 'USER_NOT_FOUND', message: 'User not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } },
            );
        }

        return new Response(
            JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                role: user.role,
                emailVerified: user.emailVerified,
                termsAcceptedAt: user.termsAcceptedAt,
                createdAt: user.createdAt,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (err) {
        if (err instanceof Response) return err;
        console.error('[community-rss] Profile fetch failed:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

/**
 * Update the authenticated user's profile.
 *
 * Accepts optional `name` and `bio` fields. Returns the updated profile.
 *
 * @since 0.3.0
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
    const env = (locals as { runtime?: { env?: Env } }).runtime?.env;

    if (!env?.DB) {
        return new Response(
            JSON.stringify({ error: 'Database not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        const session = await requireAuth(request, env);

        let body: { name?: string; bio?: string };
        try {
            body = await request.json();
        } catch {
            return new Response(
                JSON.stringify({ code: 'INVALID_BODY', message: 'Invalid JSON body' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // Validate name if provided
        if (body.name !== undefined) {
            const name = body.name?.trim();
            if (!name || name.length < 1) {
                return new Response(
                    JSON.stringify({ code: 'INVALID_NAME', message: 'Display name cannot be empty' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } },
                );
            }
            if (name.length > 100) {
                return new Response(
                    JSON.stringify({ code: 'INVALID_NAME', message: 'Display name must be 100 characters or less' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } },
                );
            }
        }

        // Validate bio if provided
        if (body.bio !== undefined && body.bio !== null) {
            if (body.bio.length > 500) {
                return new Response(
                    JSON.stringify({ code: 'INVALID_BIO', message: 'Bio must be 500 characters or less' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } },
                );
            }
        }

        const updateData: { name?: string; bio?: string } = {};
        if (body.name !== undefined) updateData.name = body.name.trim();
        if (body.bio !== undefined) updateData.bio = body.bio;

        if (Object.keys(updateData).length === 0) {
            return new Response(
                JSON.stringify({ code: 'NO_CHANGES', message: 'No fields to update' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        const updated = await updateUser(env.DB, session.user.id, updateData);

        if (!updated) {
            return new Response(
                JSON.stringify({ code: 'USER_NOT_FOUND', message: 'User not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } },
            );
        }

        return new Response(
            JSON.stringify({
                id: updated.id,
                email: updated.email,
                name: updated.name,
                bio: updated.bio,
                avatarUrl: updated.avatarUrl,
                role: updated.role,
                emailVerified: updated.emailVerified,
                termsAcceptedAt: updated.termsAcceptedAt,
                createdAt: updated.createdAt,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (err) {
        if (err instanceof Response) return err;
        console.error('[community-rss] Profile update failed:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

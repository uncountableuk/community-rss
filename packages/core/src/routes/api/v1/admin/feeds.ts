import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../utils/build/auth';
import { submitAdminFeed } from '../../../../utils/build/admin-feeds';
import { getFeedsByUserId, getFeedById, deleteFeed } from '../../../../db/queries/feeds';
import type { Env } from '../../../../types/env';

/**
 * POST /api/v1/admin/feeds
 *
 * Creates a new feed owned by the authenticated admin user.
 * The feed URL is validated (must be reachable and return valid RSS/Atom).
 * Feeds are created with `status: 'approved'` immediately.
 *
 * Request body: `{ url: string, title?: string, category?: string }`
 *
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

    try {
        const session = await requireAdmin(request, env);

        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        if (!body || typeof body.url !== 'string' || !(body.url as string).trim()) {
            return new Response(
                JSON.stringify({ code: 'INVALID_INPUT', message: 'A valid feed URL is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        const feed = await submitAdminFeed(env.DB, session.user.id, (body.url as string).trim(), {
            title: body.title as string | undefined,
            category: body.category as string | undefined,
        });

        return new Response(
            JSON.stringify({ ok: true, feed }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        // requireAdmin throws Response objects for 401/403
        if (error instanceof Response) {
            return error;
        }

        const message = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({ code: 'FEED_ERROR', message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

/**
 * GET /api/v1/admin/feeds
 *
 * Lists all feeds owned by the authenticated admin user.
 *
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
        const session = await requireAdmin(request, env);
        const feeds = await getFeedsByUserId(env.DB, session.user.id);

        return new Response(
            JSON.stringify({ ok: true, feeds }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        if (error instanceof Response) {
            return error;
        }

        const message = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({ code: 'FETCH_ERROR', message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

/**
 * DELETE /api/v1/admin/feeds
 *
 * Deletes a feed owned by the authenticated admin user.
 * Expects `?id=<feedId>` query parameter.
 * Returns 404 if the feed does not exist, 403 if not owned by this admin.
 *
 * @since 0.3.0
 */
export const DELETE: APIRoute = async ({ request, locals }) => {
    const env = (locals as { runtime?: { env?: Env } }).runtime?.env;

    if (!env?.DB) {
        return new Response(
            JSON.stringify({ error: 'Database not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        const session = await requireAdmin(request, env);

        const url = new URL(request.url);
        const feedId = url.searchParams.get('id');

        if (!feedId) {
            return new Response(
                JSON.stringify({ code: 'INVALID_INPUT', message: 'Feed ID is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        const feed = await getFeedById(env.DB, feedId);
        if (!feed) {
            return new Response(
                JSON.stringify({ code: 'NOT_FOUND', message: 'Feed not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } },
            );
        }

        if (feed.userId !== session.user.id) {
            return new Response(
                JSON.stringify({ code: 'FORBIDDEN', message: 'You do not own this feed' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } },
            );
        }

        await deleteFeed(env.DB, feedId);

        return new Response(
            JSON.stringify({ ok: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        if (error instanceof Response) {
            return error;
        }

        const message = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({ code: 'DELETE_ERROR', message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

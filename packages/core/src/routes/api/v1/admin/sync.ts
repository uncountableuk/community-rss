import type { APIRoute } from 'astro';
import { syncFeeds } from '../../../../utils/build/sync';
import type { Env } from '../../../../types/env';

/**
 * POST /api/v1/admin/sync
 *
 * Manually triggers a FreshRSS → D1 feed sync.
 * Intended for local development use only — gate with authentication
 * before exposing in production.
 *
 * @since 0.2.0
 */
export const POST: APIRoute = async ({ locals }) => {
    const env = (locals as { runtime?: { env?: Env } }).runtime?.env;

    if (!env?.FRESHRSS_URL) {
        return new Response(
            JSON.stringify({ error: 'FreshRSS not configured' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        const result = await syncFeeds(env);
        return new Response(
            JSON.stringify({
                ok: true,
                feedsProcessed: result.feedsProcessed,
                articlesEnqueued: result.articlesEnqueued,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({ ok: false, error: message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

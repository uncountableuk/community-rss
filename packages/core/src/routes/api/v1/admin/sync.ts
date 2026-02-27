import type { APIRoute } from 'astro';
import { syncFeeds } from '../../../../utils/build/sync';
import type { AppContext } from '../../../../types/context';

/**
 * POST /api/v1/admin/sync
 *
 * Manually triggers a FreshRSS feed sync. Articles are processed
 * inline (no queue needed with Node.js long-lived process).
 *
 * Intended for local development use only — gate with authentication
 * before exposing in production.
 *
 * @since 0.2.0
 */
export const POST: APIRoute = async ({ locals }) => {
    const app = (locals as { app?: AppContext }).app;

    if (!app?.env?.FRESHRSS_URL) {
        return new Response(
            JSON.stringify({ error: 'FreshRSS not configured' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        const result = await syncFeeds(app);

        return new Response(
            JSON.stringify({
                ok: true,
                feedsProcessed: result.feedsProcessed,
                articlesProcessed: result.articlesProcessed,
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

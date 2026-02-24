import type { APIRoute } from 'astro';
import { getArticles } from '../../../db/queries/articles';

/**
 * Paginated article list endpoint.
 *
 * @route GET /api/v1/articles
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20, max: 100)
 * @query feed_id - Filter by feed ID (optional)
 * @query sort - Sort order: 'newest' | 'oldest' (default: 'newest')
 * @since 0.2.0
 */
export const GET: APIRoute = async ({ request, locals }) => {
    try {
        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
        const offset = (page - 1) * limit;

        const env = (locals as { runtime?: { env?: { DB?: D1Database } } }).runtime?.env;
        if (!env?.DB) {
            return new Response(
                JSON.stringify({ error: 'Database not available' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } },
            );
        }

        const articles = await getArticles(env.DB, limit, offset);

        return new Response(
            JSON.stringify({
                data: articles,
                pagination: {
                    page,
                    limit,
                    hasMore: articles.length === limit,
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    } catch (error) {
        console.error('[community-rss] Error fetching articles:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

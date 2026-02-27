import type { APIRoute } from 'astro';
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
export declare const GET: APIRoute;
//# sourceMappingURL=articles.d.ts.map
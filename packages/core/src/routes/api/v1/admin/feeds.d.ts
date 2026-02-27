import type { APIRoute } from 'astro';
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
export declare const POST: APIRoute;
/**
 * GET /api/v1/admin/feeds
 *
 * Lists all feeds owned by the authenticated admin user.
 *
 * @since 0.3.0
 */
export declare const GET: APIRoute;
/**
 * DELETE /api/v1/admin/feeds
 *
 * Deletes a feed owned by the authenticated admin user.
 * Expects `?id=<feedId>` query parameter.
 * Returns 404 if the feed does not exist, 403 if not owned by this admin.
 *
 * @since 0.3.0
 */
export declare const DELETE: APIRoute;
//# sourceMappingURL=feeds.d.ts.map
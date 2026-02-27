import type { APIRoute } from 'astro';
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
export declare const POST: APIRoute;
//# sourceMappingURL=sync.d.ts.map
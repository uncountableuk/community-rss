import type { APIRoute } from 'astro';
/**
 * GET /api/dev/seed
 *
 * Dev-only endpoint that seeds the database with essential data
 * (System User, etc.). Protected by `import.meta.env.DEV` check
 * so it cannot be called in production.
 *
 * Usage: `curl http://localhost:4321/api/dev/seed`
 *
 * @since 0.3.0
 */
export declare const GET: APIRoute;
//# sourceMappingURL=seed.d.ts.map
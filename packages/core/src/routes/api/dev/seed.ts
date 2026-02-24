import type { APIRoute } from 'astro';
import { seedDatabase } from '../../../db/seed';
import type { Env } from '../../../types/env';

/**
 * GET /api/dev/seed
 *
 * Dev-only endpoint that seeds the database with essential data
 * (System User, etc.). Protected by `import.meta.env.DEV` check
 * so it cannot be called in production.
 *
 * This exists because executing a .ts script directly against a local
 * Cloudflare D1 database is difficult — D1 runs inside Miniflare/Wrangler
 * and standard Node SQLite drivers can't access the .wrangler state files.
 *
 * Usage: `curl http://localhost:4321/api/dev/seed`
 *
 * @since 0.3.0
 */
export const GET: APIRoute = async ({ locals }) => {
    // Guard: only available in development
    if (!((import.meta as unknown as Record<string, Record<string, boolean>>).env.DEV)) {
        return new Response(
            JSON.stringify({ error: 'Not available in production' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
    }

    const env = (locals as { runtime?: { env?: Env } }).runtime?.env;

    if (!env?.DB) {
        return new Response(
            JSON.stringify({ error: 'Database not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        const result = await seedDatabase(env.DB);

        return new Response(
            JSON.stringify({ ok: true, ...result }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        console.error('[community-rss] Seed failed:', error);
        return new Response(
            JSON.stringify({
                error: 'Seed failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};

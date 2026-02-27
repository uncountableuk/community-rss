import type { APIRoute } from 'astro';
import { seedDatabase } from '../../../db/seed';
import type { AppContext } from '../../../types/context';

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
export const GET: APIRoute = async ({ locals }) => {
    // Guard: only available in development
    if (!((import.meta as unknown as Record<string, Record<string, boolean>>).env.DEV)) {
        return new Response(
            JSON.stringify({ error: 'Not available in production' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
    }

    const app = (locals as { app?: AppContext }).app;

    if (!app?.db) {
        return new Response(
            JSON.stringify({ error: 'Database not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        const result = await seedDatabase(app.db);

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

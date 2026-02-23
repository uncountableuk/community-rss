import { describe, it, expect, vi } from 'vitest';
import { GET } from '@routes/api/v1/articles';

// Mock the DB queries module
vi.mock('../../../../src/db/queries/articles', () => ({
    getArticles: vi.fn().mockResolvedValue([
        {
            id: 'article-1',
            title: 'Test Article 1',
            summary: 'Summary 1',
            authorName: 'Author 1',
            publishedAt: new Date('2024-01-01'),
            feedId: 'feed_1',
        },
        {
            id: 'article-2',
            title: 'Test Article 2',
            summary: 'Summary 2',
            authorName: 'Author 2',
            publishedAt: new Date('2024-01-02'),
            feedId: 'feed_1',
        },
    ]),
}));

function createMockContext(url: string, env?: Record<string, unknown>) {
    return {
        request: new Request(url),
        locals: {
            runtime: {
                env: env || { DB: {} },
            },
        },
        // Minimal Astro context stubs
        params: {},
        redirect: (path: string) => new Response(null, { status: 302, headers: { Location: path } }),
        url: new URL(url),
        site: new URL('http://localhost:4321'),
        generator: 'astro',
        props: {},
        cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), has: vi.fn() },
        preferredLocale: undefined,
        preferredLocaleList: undefined,
        currentLocale: undefined,
    } as any;
}

describe('GET /api/v1/articles', () => {
    it('returns articles with default pagination', async () => {
        const ctx = createMockContext('http://localhost:4321/api/v1/articles');
        const response = await GET(ctx);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data).toHaveLength(2);
        expect(body.pagination.page).toBe(1);
        expect(body.pagination.limit).toBe(20);
    });

    it('respects page and limit parameters', async () => {
        const ctx = createMockContext('http://localhost:4321/api/v1/articles?page=2&limit=10');
        const response = await GET(ctx);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.pagination.page).toBe(2);
        expect(body.pagination.limit).toBe(10);
    });

    it('clamps limit to maximum 100', async () => {
        const ctx = createMockContext('http://localhost:4321/api/v1/articles?limit=500');
        const response = await GET(ctx);
        const body = await response.json();

        expect(body.pagination.limit).toBe(100);
    });

    it('returns 503 when database is not available', async () => {
        const ctx = createMockContext('http://localhost:4321/api/v1/articles', {});
        // Override locals to have no DB
        ctx.locals = { runtime: { env: {} } };
        const response = await GET(ctx);

        expect(response.status).toBe(503);
    });
});

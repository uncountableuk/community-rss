import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
    return {
        mockGetArticles: vi.fn(),
    };
});

vi.mock('@db/queries/articles', () => ({
    getArticles: mocks.mockGetArticles,
}));

import { fetchArticlesHandler } from '@actions/articles';
import type { AppContext } from '@core-types/context';

const mockApp = {
    db: {} as Record<string, unknown>,
    config: {},
    env: { PUBLIC_SITE_URL: 'http://localhost:4321' },
} as unknown as AppContext;

describe('fetchArticlesHandler', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.mockGetArticles.mockReset();
    });

    it('should return paginated articles with defaults', async () => {
        const articles = [
            { id: '1', title: 'Article 1' },
            { id: '2', title: 'Article 2' },
        ];
        mocks.mockGetArticles.mockResolvedValue(articles);

        const result = await fetchArticlesHandler({}, mockApp);

        expect(mocks.mockGetArticles).toHaveBeenCalledWith(mockApp.db, 20, 0);
        expect(result.data).toEqual(articles);
        expect(result.pagination).toEqual({
            page: 1,
            limit: 20,
            hasMore: false,
        });
    });

    it('should respect page and limit parameters', async () => {
        mocks.mockGetArticles.mockResolvedValue([]);

        const result = await fetchArticlesHandler({ page: 3, limit: 10 }, mockApp);

        expect(mocks.mockGetArticles).toHaveBeenCalledWith(mockApp.db, 10, 20);
        expect(result.pagination).toEqual({
            page: 3,
            limit: 10,
            hasMore: false,
        });
    });

    it('should clamp page minimum to 1', async () => {
        mocks.mockGetArticles.mockResolvedValue([]);

        await fetchArticlesHandler({ page: -5 }, mockApp);

        expect(mocks.mockGetArticles).toHaveBeenCalledWith(mockApp.db, 20, 0);
    });

    it('should clamp limit to maximum of 100', async () => {
        mocks.mockGetArticles.mockResolvedValue([]);

        await fetchArticlesHandler({ limit: 500 }, mockApp);

        expect(mocks.mockGetArticles).toHaveBeenCalledWith(mockApp.db, 100, 0);
    });

    it('should clamp limit minimum to 1', async () => {
        mocks.mockGetArticles.mockResolvedValue([]);

        await fetchArticlesHandler({ limit: 0 }, mockApp);

        expect(mocks.mockGetArticles).toHaveBeenCalledWith(mockApp.db, 1, 0);
    });

    it('should indicate hasMore when results equal limit', async () => {
        const articles = Array.from({ length: 5 }, (_, i) => ({ id: String(i), title: `Art ${i}` }));
        mocks.mockGetArticles.mockResolvedValue(articles);

        const result = await fetchArticlesHandler({ limit: 5 }, mockApp);

        expect(result.pagination.hasMore).toBe(true);
    });

    it('should indicate no hasMore when results are less than limit', async () => {
        const articles = [{ id: '1', title: 'Only one' }];
        mocks.mockGetArticles.mockResolvedValue(articles);

        const result = await fetchArticlesHandler({ limit: 5 }, mockApp);

        expect(result.pagination.hasMore).toBe(false);
    });
});

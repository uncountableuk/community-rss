import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
    mockAll,
    mockOffset,
    mockLimit,
    mockOrderBy,
    mockLeftJoin,
    mockSelect,
} = vi.hoisted(() => {
    const mockAll = vi.fn().mockResolvedValue([]);
    const mockOffset = vi.fn(() => ({ all: mockAll }));
    const mockLimit = vi.fn(() => ({ offset: mockOffset }));
    const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
    const mockLeftJoin = vi.fn(() => ({ orderBy: mockOrderBy }));
    const mockFrom = vi.fn(() => ({ leftJoin: mockLeftJoin }));
    const mockSelect = vi.fn(() => ({ from: mockFrom }));
    return { mockAll, mockOffset, mockLimit, mockOrderBy, mockLeftJoin, mockSelect };
});

vi.mock('@db/schema', () => ({
    articles: { id: 'id', feedId: 'feedId', title: 'title', summary: 'summary',
        authorName: 'authorName', publishedAt: 'publishedAt', originalLink: 'originalLink' },
    feeds: { id: 'feeds.id', title: 'feeds.title' },
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((a, b) => ({ eq: [a, b] })),
    desc: vi.fn((col) => ({ desc: col })),
}));

import { getArticlesWithFeedTitle } from '@db/queries/articles';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

describe('getArticlesWithFeedTitle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAll.mockResolvedValue([]);
    });

    const mockDb = {
        select: mockSelect,
    } as unknown as BetterSQLite3Database;

    it('returns articles array from DB', async () => {
        const fixture = [
            { id: 'a1', feedId: 'f1', title: 'Article 1', summary: 'Sum 1',
              authorName: 'Alice', publishedAt: new Date('2024-01-02'), originalLink: 'https://example.com/1', feedTitle: 'Feed One' },
            { id: 'a2', feedId: 'f1', title: 'Article 2', summary: null,
              authorName: null, publishedAt: new Date('2024-01-01'), originalLink: 'https://example.com/2', feedTitle: 'Feed One' },
        ];
        mockAll.mockResolvedValueOnce(fixture);

        const result = await getArticlesWithFeedTitle(mockDb);

        expect(result).toEqual(fixture);
        expect(result).toHaveLength(2);
    });

    it('returns null feedTitle when feed is missing (left join)', async () => {
        const fixture = [
            { id: 'a3', feedId: 'f-deleted', title: 'Orphan', summary: null,
              authorName: null, publishedAt: null, originalLink: null, feedTitle: null },
        ];
        mockAll.mockResolvedValueOnce(fixture);

        const result = await getArticlesWithFeedTitle(mockDb);

        expect(result[0].feedTitle).toBeNull();
    });

    it('returns empty array when no articles exist', async () => {
        mockAll.mockResolvedValueOnce([]);

        const result = await getArticlesWithFeedTitle(mockDb);

        expect(result).toEqual([]);
    });

    it('applies default limit of 20', async () => {
        await getArticlesWithFeedTitle(mockDb);

        expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('applies default offset of 0', async () => {
        await getArticlesWithFeedTitle(mockDb);

        expect(mockOffset).toHaveBeenCalledWith(0);
    });

    it('passes custom limit and offset for pagination', async () => {
        await getArticlesWithFeedTitle(mockDb, 10, 40);

        expect(mockLimit).toHaveBeenCalledWith(10);
        expect(mockOffset).toHaveBeenCalledWith(40);
    });

    it('passes limit + 1 probe correctly (caller pattern for hasMore)', async () => {
        // Homepage probes with ARTICLES_PER_PAGE + 1 to detect next page
        await getArticlesWithFeedTitle(mockDb, 21, 0);

        expect(mockLimit).toHaveBeenCalledWith(21);
    });

    it('uses leftJoin to include feedTitle', async () => {
        await getArticlesWithFeedTitle(mockDb);

        expect(mockLeftJoin).toHaveBeenCalledTimes(1);
    });

    it('orders by publishedAt descending', async () => {
        await getArticlesWithFeedTitle(mockDb);

        expect(mockOrderBy).toHaveBeenCalledTimes(1);
        // desc() is called with articles.publishedAt — verify desc was invoked
        const { desc } = await import('drizzle-orm');
        expect(desc).toHaveBeenCalledWith(expect.anything());
    });

    it('calls select with specific column projection', async () => {
        await getArticlesWithFeedTitle(mockDb);

        expect(mockSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                id: expect.anything(),
                feedId: expect.anything(),
                title: expect.anything(),
                summary: expect.anything(),
                authorName: expect.anything(),
                publishedAt: expect.anything(),
                originalLink: expect.anything(),
                feedTitle: expect.anything(),
            }),
        );
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
    return {
        mockUpsertFeed: vi.fn(),
        mockFetch: vi.fn(),
    };
});

vi.mock('@db/queries/feeds', () => ({
    upsertFeed: mocks.mockUpsertFeed,
}));

// Mock global fetch for validateFeedUrl
const originalFetch = globalThis.fetch;
beforeEach(() => {
    vi.restoreAllMocks();
    mocks.mockUpsertFeed.mockReset();
    mocks.mockFetch.mockReset();
    globalThis.fetch = mocks.mockFetch;
});

// Restore fetch after all tests
import { afterAll } from 'vitest';
afterAll(() => {
    globalThis.fetch = originalFetch;
});

import { validateFeedUrl, submitAdminFeed } from '@utils/build/admin-feeds';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

describe('Admin Feeds', () => {
    describe('validateFeedUrl', () => {
        it('should reject invalid URL format', async () => {
            const result = await validateFeedUrl('not-a-url');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid URL format');
        });

        it('should reject non-http protocols', async () => {
            const result = await validateFeedUrl('ftp://example.com/feed.xml');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('http or https');
        });

        it('should reject URLs that return non-200 status', async () => {
            mocks.mockFetch.mockResolvedValue(
                new Response('Not Found', { status: 404 }),
            );

            const result = await validateFeedUrl('https://example.com/missing.xml');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('HTTP 404');
        });

        it('should reject URLs that return non-RSS content', async () => {
            mocks.mockFetch.mockResolvedValue(
                new Response('<html><body>Not a feed</body></html>', {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' },
                }),
            );

            const result = await validateFeedUrl('https://example.com/page');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('RSS or Atom');
        });

        it('should accept valid RSS feed by content-type', async () => {
            mocks.mockFetch.mockResolvedValue(
                new Response('<rss><channel><title>My Blog</title></channel></rss>', {
                    status: 200,
                    headers: { 'Content-Type': 'application/rss+xml' },
                }),
            );

            const result = await validateFeedUrl('https://example.com/feed.xml');
            expect(result.valid).toBe(true);
            expect(result.title).toBe('My Blog');
        });

        it('should accept valid Atom feed by body markers', async () => {
            mocks.mockFetch.mockResolvedValue(
                new Response('<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom Blog</title></feed>', {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' },
                }),
            );

            const result = await validateFeedUrl('https://example.com/atom.xml');
            expect(result.valid).toBe(true);
            expect(result.title).toBe('Atom Blog');
        });

        it('should handle fetch errors gracefully', async () => {
            mocks.mockFetch.mockRejectedValue(new Error('Connection refused'));

            const result = await validateFeedUrl('https://unreachable.example.com/feed.xml');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Connection refused');
        });
    });

    describe('submitAdminFeed', () => {
        const mockDb = {} as BetterSQLite3Database;

        it('should create an approved feed when URL is valid', async () => {
            mocks.mockFetch.mockResolvedValue(
                new Response('<rss><channel><title>Admin Feed</title></channel></rss>', {
                    status: 200,
                    headers: { 'Content-Type': 'application/rss+xml' },
                }),
            );
            mocks.mockUpsertFeed.mockResolvedValue([{
                id: 'feed-abc123',
                userId: 'user-admin-1',
                feedUrl: 'https://example.com/feed.xml',
                title: 'Admin Feed',
                status: 'approved',
            }]);

            const result = await submitAdminFeed(mockDb, 'user-admin-1', 'https://example.com/feed.xml');

            expect(result).toBeDefined();
            expect(mocks.mockUpsertFeed).toHaveBeenCalledWith(
                mockDb,
                expect.objectContaining({
                    userId: 'user-admin-1',
                    feedUrl: 'https://example.com/feed.xml',
                    title: 'Admin Feed',
                    status: 'approved',
                }),
            );
        });

        it('should use custom title when provided', async () => {
            mocks.mockFetch.mockResolvedValue(
                new Response('<rss><channel><title>Original</title></channel></rss>', {
                    status: 200,
                    headers: { 'Content-Type': 'application/rss+xml' },
                }),
            );
            mocks.mockUpsertFeed.mockResolvedValue([{
                id: 'feed-abc123',
                title: 'My Custom Title',
            }]);

            await submitAdminFeed(mockDb, 'user-admin-1', 'https://example.com/feed.xml', {
                title: 'My Custom Title',
            });

            expect(mocks.mockUpsertFeed).toHaveBeenCalledWith(
                mockDb,
                expect.objectContaining({ title: 'My Custom Title' }),
            );
        });

        it('should throw when feed URL is invalid', async () => {
            await expect(
                submitAdminFeed(mockDb, 'user-admin-1', 'not-a-url'),
            ).rejects.toThrow('Invalid URL format');
        });

        it('should throw when feed URL returns non-RSS content', async () => {
            mocks.mockFetch.mockResolvedValue(
                new Response('<html></html>', {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' },
                }),
            );

            await expect(
                submitAdminFeed(mockDb, 'user-admin-1', 'https://example.com/page'),
            ).rejects.toThrow('RSS or Atom');
        });

        it('should generate deterministic IDs for deduplication', async () => {
            mocks.mockFetch.mockResolvedValue(
                new Response('<rss><channel><title>Blog</title></channel></rss>', {
                    status: 200,
                    headers: { 'Content-Type': 'application/rss+xml' },
                }),
            );
            mocks.mockUpsertFeed.mockResolvedValue([{ id: 'feed-abc' }]);

            await submitAdminFeed(mockDb, 'admin-1', 'https://example.com/feed.xml');
            const firstCallId = mocks.mockUpsertFeed.mock.calls[0][1].id;

            mocks.mockUpsertFeed.mockClear();
            mocks.mockFetch.mockResolvedValue(
                new Response('<rss><channel><title>Blog</title></channel></rss>', {
                    status: 200,
                    headers: { 'Content-Type': 'application/rss+xml' },
                }),
            );
            mocks.mockUpsertFeed.mockResolvedValue([{ id: 'feed-abc' }]);

            await submitAdminFeed(mockDb, 'admin-2', 'https://example.com/feed.xml');
            const secondCallId = mocks.mockUpsertFeed.mock.calls[0][1].id;

            expect(firstCallId).toBe(secondCallId);
        });
    });
});

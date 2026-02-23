import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { syncFeeds, generateFeedId, itemToQueueMessage } from '@utils/build/sync';
import { mockFeedsResponse, mockArticlesResponse } from '@fixtures/freshrss-responses';
import type { Env } from '@core-types/env';

// Mock the DB query module so syncFeeds doesn't hit real Drizzle
vi.mock('../../../src/db/queries/feeds', () => ({
    upsertFeed: vi.fn().mockResolvedValue([]),
}));

const mockQueue = {
    send: vi.fn().mockResolvedValue(undefined),
};

const mockEnv: Env = {
    FRESHRSS_URL: 'https://freshrss.example.com',
    FRESHRSS_USER: 'admin',
    FRESHRSS_API_PASSWORD: 'password123',
    DB: {} as D1Database,
    ARTICLE_QUEUE: mockQueue,
    MEDIA_BUCKET: {} as R2Bucket,
} as unknown as Env;

const server = setupServer(
    http.get('https://freshrss.example.com/api/greader.php/reader/api/0/subscription/list', () => {
        return HttpResponse.json(mockFeedsResponse);
    }),
    http.get('https://freshrss.example.com/api/greader.php/reader/api/0/stream/contents/:feedId', () => {
        return HttpResponse.json(mockArticlesResponse);
    }),
);

describe('Sync Utilities', () => {
    describe('generateFeedId', () => {
        it('generates a feed ID from FreshRSS format', () => {
            expect(generateFeedId('feed/1')).toBe('feed_1');
            expect(generateFeedId('feed/42')).toBe('feed_42');
        });
    });

    describe('itemToQueueMessage', () => {
        it('maps a FreshRSS item to a queue message', () => {
            const item = mockArticlesResponse.items[0];
            const message = itemToQueueMessage(item, 'feed_1');

            expect(message.freshrssItemId).toBe(item.id);
            expect(message.feedId).toBe('feed_1');
            expect(message.title).toBe('New Framework Released');
            expect(message.content).toContain('A new framework');
            expect(message.authorName).toBe('Jane Doe');
            expect(message.publishedAt).toBe(1672531200);
        });

        it('handles items without content', () => {
            const item = mockArticlesResponse.items[1]; // No content field
            const message = itemToQueueMessage(item, 'feed_1');

            expect(message.content).toBe('Some CSS tips.');
            expect(message.summary).toBe('Some CSS tips.');
        });
    });
});

describe('syncFeeds', () => {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
    afterAll(() => server.close());
    afterEach(() => {
        server.resetHandlers();
        vi.clearAllMocks();
    });

    it('syncs feeds and enqueues articles', async () => {
        const result = await syncFeeds(mockEnv);

        expect(result.feedsProcessed).toBe(2); // 2 subscriptions
        expect(result.articlesEnqueued).toBe(4); // 2 articles × 2 feeds
        expect(mockQueue.send).toHaveBeenCalledTimes(4);
    });

    it('sends correct queue messages', async () => {
        await syncFeeds(mockEnv);

        const firstCall = mockQueue.send.mock.calls[0][0];
        expect(firstCall).toHaveProperty('freshrssItemId');
        expect(firstCall).toHaveProperty('feedId');
        expect(firstCall).toHaveProperty('title');
    });

    it('handles FreshRSS API errors', async () => {
        server.use(
            http.get('https://freshrss.example.com/api/greader.php/reader/api/0/subscription/list', () => {
                return new HttpResponse(null, { status: 500 });
            }),
        );

        await expect(syncFeeds(mockEnv)).rejects.toThrow('FreshRSS API error');
    });
});

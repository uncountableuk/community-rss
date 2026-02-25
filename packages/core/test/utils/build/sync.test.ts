import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { syncFeeds, generateFeedId, itemToQueueMessage } from '@utils/build/sync';
import { mockFeedsResponse, mockArticlesResponse } from '@fixtures/freshrss-responses';
import type { AppContext } from '@core-types/context';

// Mock the DB query module so syncFeeds doesn't hit real Drizzle
vi.mock('../../../src/db/queries/feeds', () => ({
    upsertFeed: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../src/db/queries/users', () => ({
    ensureSystemUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/db/queries/articles', () => ({
    upsertArticle: vi.fn().mockResolvedValue([]),
}));

const mockApp: AppContext = {
    db: {} as any,
    config: {} as any,
    env: {
        DATABASE_PATH: './data/test.db',
        FRESHRSS_URL: 'https://freshrss.example.com',
        FRESHRSS_USER: 'admin',
        FRESHRSS_API_PASSWORD: 'password123',
        PUBLIC_SITE_URL: 'http://localhost:4321',
        SMTP_HOST: 'localhost',
        SMTP_PORT: '1025',
        SMTP_FROM: 'noreply@localhost',
        S3_ENDPOINT: 'http://minio:9000',
        S3_ACCESS_KEY: 'key',
        S3_SECRET_KEY: 'secret',
        S3_BUCKET: 'bucket',
        MEDIA_BASE_URL: 'http://localhost:9000/bucket',
    },
};

const MOCK_AUTH_TOKEN = 'admin/abc123synctoken';

const server = setupServer(
    // ClientLogin endpoint for auth
    http.post('https://freshrss.example.com/api/greader.php/accounts/ClientLogin', () => {
        return new HttpResponse(
            `SID=${MOCK_AUTH_TOKEN}\nLSID=null\nAuth=${MOCK_AUTH_TOKEN}`,
            { status: 200, headers: { 'Content-Type': 'text/plain' } }
        );
    }),
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

    it('syncs feeds and processes articles inline', async () => {
        const result = await syncFeeds(mockApp);

        expect(result.feedsProcessed).toBe(2); // 2 subscriptions
        expect(result.articlesProcessed).toBe(4); // 2 articles × 2 feeds
    });

    it('processes articles with correct data', async () => {
        const { upsertArticle } = await import('../../../src/db/queries/articles');
        await syncFeeds(mockApp);

        expect(upsertArticle).toHaveBeenCalledTimes(4);
        const firstCall = (upsertArticle as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(firstCall[1]).toHaveProperty('freshrssItemId');
        expect(firstCall[1]).toHaveProperty('feedId');
        expect(firstCall[1]).toHaveProperty('title');
    });

    it('handles FreshRSS API errors', async () => {
        server.use(
            http.post('https://freshrss.example.com/api/greader.php/accounts/ClientLogin', () => {
                return new HttpResponse('Error=BadAuthentication', { status: 403 });
            }),
        );

        await expect(syncFeeds(mockApp)).rejects.toThrow('FreshRSS login failed');
    });
});

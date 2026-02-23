import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { FreshRssClient } from '@utils/build/freshrss-client';
import { mockFeedsResponse, mockArticlesResponse } from '@fixtures/freshrss-responses';
import type { Env } from '@core-types/env';

const mockEnv: Env = {
    FRESHRSS_URL: 'https://freshrss.example.com',
    FRESHRSS_USER: 'admin',
    FRESHRSS_API_PASSWORD: 'password123',
    CF_ACCESS_CLIENT_ID: 'client-id',
    CF_ACCESS_CLIENT_SECRET: 'client-secret',
} as Env;

const server = setupServer(
    http.get('https://freshrss.example.com/api/greader.php/reader/api/0/subscription/list', ({ request }) => {
        const auth = request.headers.get('Authorization');
        if (auth !== 'GoogleLogin auth=admin/password123') {
            return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json(mockFeedsResponse);
    }),
    http.get('https://freshrss.example.com/api/greader.php/reader/api/0/stream/contents/:feedId', ({ request, params }) => {
        const auth = request.headers.get('Authorization');
        if (auth !== 'GoogleLogin auth=admin/password123') {
            return new HttpResponse(null, { status: 401 });
        }

        const url = new URL(request.url);
        const since = url.searchParams.get('ot');

        if (since === '9999999999') {
            return HttpResponse.json({ ...mockArticlesResponse, items: [] });
        }

        return HttpResponse.json(mockArticlesResponse);
    })
);

describe('FreshRssClient', () => {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
    afterAll(() => server.close());
    afterEach(() => server.resetHandlers());

    it('fetches feeds successfully', async () => {
        const client = new FreshRssClient(mockEnv);
        const feeds = await client.fetchFeeds();

        expect(feeds.subscriptions).toHaveLength(2);
        expect(feeds.subscriptions[0].title).toBe('Tech Blog');
    });

    it('fetches articles successfully', async () => {
        const client = new FreshRssClient(mockEnv);
        const articles = await client.fetchArticles('feed/1');

        expect(articles.items).toHaveLength(2);
        expect(articles.items[0].title).toBe('New Framework Released');
    });

    it('fetches articles with since parameter', async () => {
        const client = new FreshRssClient(mockEnv);
        const articles = await client.fetchArticles('feed/1', 9999999999);

        expect(articles.items).toHaveLength(0);
    });

    it('handles authentication errors', async () => {
        const badEnv = { ...mockEnv, FRESHRSS_API_PASSWORD: 'wrong' };
        const client = new FreshRssClient(badEnv);

        await expect(client.fetchFeeds()).rejects.toThrow('FreshRSS API error: 401 Unauthorized');
    });
});

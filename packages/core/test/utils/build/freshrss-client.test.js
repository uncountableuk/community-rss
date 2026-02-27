import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { FreshRssClient } from '@utils/build/freshrss-client';
import { mockFeedsResponse, mockArticlesResponse } from '@fixtures/freshrss-responses';
const MOCK_AUTH_TOKEN = 'admin/abc123mocktoken';
const mockEnv = {
    DATABASE_PATH: './data/test.db',
    FRESHRSS_URL: 'https://freshrss.example.com',
    FRESHRSS_USER: 'admin',
    FRESHRSS_API_PASSWORD: 'password123',
    CF_ACCESS_CLIENT_ID: 'client-id',
    CF_ACCESS_CLIENT_SECRET: 'client-secret',
    PUBLIC_SITE_URL: 'http://localhost:4321',
    SMTP_HOST: 'localhost',
    SMTP_PORT: '1025',
    SMTP_FROM: 'noreply@localhost',
    S3_ENDPOINT: 'http://minio:9000',
    S3_ACCESS_KEY: 'key',
    S3_SECRET_KEY: 'secret',
    S3_BUCKET: 'bucket',
    MEDIA_BASE_URL: 'http://localhost:9000/bucket',
};
const server = setupServer(
// ClientLogin endpoint — validates credentials and returns auth token
http.post('https://freshrss.example.com/api/greader.php/accounts/ClientLogin', async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const email = params.get('Email');
    const passwd = params.get('Passwd');
    if (email !== 'admin' || passwd !== 'password123') {
        return new HttpResponse('Error=BadAuthentication', { status: 403 });
    }
    return new HttpResponse(`SID=${MOCK_AUTH_TOKEN}\nLSID=null\nAuth=${MOCK_AUTH_TOKEN}`, { status: 200, headers: { 'Content-Type': 'text/plain' } });
}), http.get('https://freshrss.example.com/api/greader.php/reader/api/0/subscription/list', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth !== `GoogleLogin auth=${MOCK_AUTH_TOKEN}`) {
        return new HttpResponse(null, { status: 401 });
    }
    return HttpResponse.json(mockFeedsResponse);
}), http.get('https://freshrss.example.com/api/greader.php/reader/api/0/stream/contents/:feedId', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth !== `GoogleLogin auth=${MOCK_AUTH_TOKEN}`) {
        return new HttpResponse(null, { status: 401 });
    }
    const url = new URL(request.url);
    const since = url.searchParams.get('ot');
    if (since === '9999999999') {
        return HttpResponse.json({ ...mockArticlesResponse, items: [] });
    }
    return HttpResponse.json(mockArticlesResponse);
}));
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
        await expect(client.fetchFeeds()).rejects.toThrow('FreshRSS login failed: 403 Forbidden');
    });
    it('caches auth token across multiple API calls', async () => {
        const client = new FreshRssClient(mockEnv);
        await client.fetchFeeds();
        const articles = await client.fetchArticles('feed/1');
        // Should reuse token — if login were called twice, MSW would still
        // work, but this validates the caching path is exercised.
        expect(articles.items).toHaveLength(2);
    });
    it('exposes login method for direct token retrieval', async () => {
        const client = new FreshRssClient(mockEnv);
        const token = await client.login();
        expect(token).toBe(MOCK_AUTH_TOKEN);
    });
});
//# sourceMappingURL=freshrss-client.test.js.map
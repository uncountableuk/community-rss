import { describe, it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => {
    return {
        mockRequireAdmin: vi.fn(),
        mockSubmitAdminFeed: vi.fn(),
        mockGetFeedsByUserId: vi.fn(),
        mockGetFeedById: vi.fn(),
        mockDeleteFeed: vi.fn(),
    };
});
vi.mock('@utils/build/auth', () => ({
    requireAdmin: mocks.mockRequireAdmin,
}));
vi.mock('@utils/build/admin-feeds', () => ({
    submitAdminFeed: mocks.mockSubmitAdminFeed,
}));
vi.mock('@db/queries/feeds', () => ({
    getFeedsByUserId: mocks.mockGetFeedsByUserId,
    getFeedById: mocks.mockGetFeedById,
    deleteFeed: mocks.mockDeleteFeed,
}));
import { POST, GET, DELETE } from '@routes/api/v1/admin/feeds';
import { mockUsers } from '@fixtures/users';
const mockApp = {
    db: {},
    config: { email: undefined },
    env: {
        PUBLIC_SITE_URL: 'http://localhost:4321',
    },
};
function createContext(request, app = mockApp) {
    return {
        request,
        locals: { app },
        // Minimal APIContext stubs
        params: {},
        redirect: (url) => new Response(null, { status: 302, headers: { Location: url } }),
        url: new URL(request.url),
        cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), has: vi.fn() },
        props: {},
    };
}
describe('Admin Feeds Route', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.mockRequireAdmin.mockReset();
        mocks.mockSubmitAdminFeed.mockReset();
        mocks.mockGetFeedsByUserId.mockReset();
        mocks.mockGetFeedById.mockReset();
        mocks.mockDeleteFeed.mockReset();
    });
    describe('POST /api/v1/admin/feeds', () => {
        it('should return 503 when DB is not available', async () => {
            const request = new Request('http://localhost/api/v1/admin/feeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: 'https://example.com/feed.xml' }),
            });
            const response = await POST(createContext(request, {}));
            expect(response.status).toBe(503);
        });
        it('should create a feed and return 201', async () => {
            mocks.mockRequireAdmin.mockResolvedValue({
                user: mockUsers.admin,
                session: { id: 'session-1' },
            });
            mocks.mockSubmitAdminFeed.mockResolvedValue({
                id: 'feed-abc',
                userId: 'user-admin-1',
                feedUrl: 'https://example.com/feed.xml',
                title: 'Example Feed',
                status: 'approved',
            });
            const request = new Request('http://localhost/api/v1/admin/feeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: 'https://example.com/feed.xml' }),
            });
            const response = await POST(createContext(request));
            expect(response.status).toBe(201);
            const data = (await response.json());
            expect(data.ok).toBe(true);
            expect((data.feed).feedUrl).toBe('https://example.com/feed.xml');
        });
        it('should return 403 for non-admin users', async () => {
            mocks.mockRequireAdmin.mockRejectedValue(new Response(JSON.stringify({ code: 'ADMIN_REQUIRED' }), { status: 403, headers: { 'Content-Type': 'application/json' } }));
            const request = new Request('http://localhost/api/v1/admin/feeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: 'https://example.com/feed.xml' }),
            });
            const response = await POST(createContext(request));
            expect(response.status).toBe(403);
        });
        it('should return 400 for missing URL', async () => {
            mocks.mockRequireAdmin.mockResolvedValue({
                user: mockUsers.admin,
                session: { id: 'session-1' },
            });
            const request = new Request('http://localhost/api/v1/admin/feeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const response = await POST(createContext(request));
            expect(response.status).toBe(400);
            const data = (await response.json());
            expect(data.code).toBe('INVALID_INPUT');
        });
        it('should return 400 for invalid feed URL', async () => {
            mocks.mockRequireAdmin.mockResolvedValue({
                user: mockUsers.admin,
                session: { id: 'session-1' },
            });
            mocks.mockSubmitAdminFeed.mockRejectedValue(new Error('URL does not appear to be an RSS or Atom feed'));
            const request = new Request('http://localhost/api/v1/admin/feeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: 'https://example.com/not-a-feed' }),
            });
            const response = await POST(createContext(request));
            expect(response.status).toBe(400);
            const data = (await response.json());
            expect(data.code).toBe('FEED_ERROR');
        });
    });
    describe('GET /api/v1/admin/feeds', () => {
        it('should return 503 when DB is not available', async () => {
            const request = new Request('http://localhost/api/v1/admin/feeds');
            const response = await GET(createContext(request, {}));
            expect(response.status).toBe(503);
        });
        it('should return feeds owned by the admin', async () => {
            mocks.mockRequireAdmin.mockResolvedValue({
                user: mockUsers.admin,
                session: { id: 'session-1' },
            });
            mocks.mockGetFeedsByUserId.mockResolvedValue([
                { id: 'feed-1', userId: 'user-admin-1', title: 'Admin Feed 1' },
                { id: 'feed-2', userId: 'user-admin-1', title: 'Admin Feed 2' },
            ]);
            const request = new Request('http://localhost/api/v1/admin/feeds');
            const response = await GET(createContext(request));
            expect(response.status).toBe(200);
            const data = (await response.json());
            expect(data.ok).toBe(true);
            expect((data.feeds)).toHaveLength(2);
        });
    });
    describe('DELETE /api/v1/admin/feeds', () => {
        it('should return 503 when DB is not available', async () => {
            const request = new Request('http://localhost/api/v1/admin/feeds?id=feed-1', {
                method: 'DELETE',
            });
            const response = await DELETE(createContext(request, {}));
            expect(response.status).toBe(503);
        });
        it('should delete a feed owned by the admin', async () => {
            mocks.mockRequireAdmin.mockResolvedValue({
                user: mockUsers.admin,
                session: { id: 'session-1' },
            });
            mocks.mockGetFeedById.mockResolvedValue({
                id: 'feed-1',
                userId: 'user-admin-1',
            });
            mocks.mockDeleteFeed.mockResolvedValue([{ id: 'feed-1' }]);
            const request = new Request('http://localhost/api/v1/admin/feeds?id=feed-1', {
                method: 'DELETE',
            });
            const response = await DELETE(createContext(request));
            expect(response.status).toBe(200);
            const data = (await response.json());
            expect(data.ok).toBe(true);
        });
        it('should return 404 for non-existent feed', async () => {
            mocks.mockRequireAdmin.mockResolvedValue({
                user: mockUsers.admin,
                session: { id: 'session-1' },
            });
            mocks.mockGetFeedById.mockResolvedValue(null);
            const request = new Request('http://localhost/api/v1/admin/feeds?id=missing', {
                method: 'DELETE',
            });
            const response = await DELETE(createContext(request));
            expect(response.status).toBe(404);
        });
        it('should return 403 when admin does not own the feed', async () => {
            mocks.mockRequireAdmin.mockResolvedValue({
                user: mockUsers.admin,
                session: { id: 'session-1' },
            });
            mocks.mockGetFeedById.mockResolvedValue({
                id: 'feed-1',
                userId: 'other-user-id',
            });
            const request = new Request('http://localhost/api/v1/admin/feeds?id=feed-1', {
                method: 'DELETE',
            });
            const response = await DELETE(createContext(request));
            expect(response.status).toBe(403);
        });
        it('should return 400 when feed ID is missing', async () => {
            mocks.mockRequireAdmin.mockResolvedValue({
                user: mockUsers.admin,
                session: { id: 'session-1' },
            });
            const request = new Request('http://localhost/api/v1/admin/feeds', {
                method: 'DELETE',
            });
            const response = await DELETE(createContext(request));
            expect(response.status).toBe(400);
        });
    });
});
//# sourceMappingURL=feeds.test.js.map
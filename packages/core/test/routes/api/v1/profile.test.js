import { describe, it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => {
    return {
        mockRequireAuth: vi.fn(),
        mockGetUserById: vi.fn(),
        mockUpdateUser: vi.fn(),
    };
});
vi.mock('@utils/build/auth', () => ({
    requireAuth: mocks.mockRequireAuth,
}));
vi.mock('@db/queries/users', () => ({
    getUserById: mocks.mockGetUserById,
    updateUser: mocks.mockUpdateUser,
}));
import { GET, PATCH } from '@routes/api/v1/profile';
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
        params: {},
        redirect: (url) => new Response(null, { status: 302, headers: { Location: url } }),
        url: new URL(request.url),
        cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), has: vi.fn() },
        props: {},
    };
}
describe('Profile API', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.mockRequireAuth.mockReset();
        mocks.mockGetUserById.mockReset();
        mocks.mockUpdateUser.mockReset();
    });
    describe('GET /api/v1/profile', () => {
        it('should return 503 when DB is not available', async () => {
            const request = new Request('http://localhost/api/v1/profile');
            const response = await GET(createContext(request, {}));
            expect(response.status).toBe(503);
        });
        it('should return 401 when not authenticated', async () => {
            mocks.mockRequireAuth.mockRejectedValue(new Response(JSON.stringify({ code: 'UNAUTHORIZED' }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
            const request = new Request('http://localhost/api/v1/profile');
            const response = await GET(createContext(request));
            expect(response.status).toBe(401);
        });
        it('should return profile data for authenticated user', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: mockUsers.registered,
                session: { id: 'session-1' },
            });
            mocks.mockGetUserById.mockResolvedValue(mockUsers.registered);
            const request = new Request('http://localhost/api/v1/profile');
            const response = await GET(createContext(request));
            expect(response.status).toBe(200);
            const data = (await response.json());
            expect(data.id).toBe(mockUsers.registered.id);
            expect(data.email).toBe(mockUsers.registered.email);
            expect(data.name).toBe(mockUsers.registered.name);
            expect(data.bio).toBe(mockUsers.registered.bio);
            expect(data.role).toBe(mockUsers.registered.role);
        });
        it('should return 404 when user not found in DB', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: { id: 'nonexistent' },
                session: { id: 'session-1' },
            });
            mocks.mockGetUserById.mockResolvedValue(null);
            const request = new Request('http://localhost/api/v1/profile');
            const response = await GET(createContext(request));
            expect(response.status).toBe(404);
            const data = (await response.json());
            expect(data.code).toBe('USER_NOT_FOUND');
        });
        it('should return 500 on unexpected error', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: mockUsers.registered,
                session: { id: 'session-1' },
            });
            mocks.mockGetUserById.mockRejectedValue(new Error('DB crash'));
            const request = new Request('http://localhost/api/v1/profile');
            const response = await GET(createContext(request));
            expect(response.status).toBe(500);
        });
    });
    describe('PATCH /api/v1/profile', () => {
        it('should return 503 when DB is not available', async () => {
            const request = new Request('http://localhost/api/v1/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test' }),
            });
            const response = await PATCH(createContext(request, {}));
            expect(response.status).toBe(503);
        });
        it('should return 401 when not authenticated', async () => {
            mocks.mockRequireAuth.mockRejectedValue(new Response(JSON.stringify({ code: 'UNAUTHORIZED' }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
            const request = new Request('http://localhost/api/v1/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test' }),
            });
            const response = await PATCH(createContext(request));
            expect(response.status).toBe(401);
        });
        it('should update name successfully', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: mockUsers.registered,
                session: { id: 'session-1' },
            });
            const updated = { ...mockUsers.registered, name: 'Updated Name' };
            mocks.mockUpdateUser.mockResolvedValue(updated);
            const request = new Request('http://localhost/api/v1/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Updated Name' }),
            });
            const response = await PATCH(createContext(request));
            expect(response.status).toBe(200);
            const data = (await response.json());
            expect(data.name).toBe('Updated Name');
            expect(mocks.mockUpdateUser).toHaveBeenCalledWith(expect.anything(), mockUsers.registered.id, { name: 'Updated Name' });
        });
        it('should update bio successfully', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: mockUsers.registered,
                session: { id: 'session-1' },
            });
            const updated = { ...mockUsers.registered, bio: 'New bio' };
            mocks.mockUpdateUser.mockResolvedValue(updated);
            const request = new Request('http://localhost/api/v1/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio: 'New bio' }),
            });
            const response = await PATCH(createContext(request));
            expect(response.status).toBe(200);
            const data = (await response.json());
            expect(data.bio).toBe('New bio');
        });
        it('should return 400 for invalid JSON body', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: mockUsers.registered,
                session: { id: 'session-1' },
            });
            const request = new Request('http://localhost/api/v1/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: 'not json',
            });
            const response = await PATCH(createContext(request));
            expect(response.status).toBe(400);
            const data = (await response.json());
            expect(data.code).toBe('INVALID_BODY');
        });
        it('should return 400 for empty name', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: mockUsers.registered,
                session: { id: 'session-1' },
            });
            const request = new Request('http://localhost/api/v1/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: '   ' }),
            });
            const response = await PATCH(createContext(request));
            expect(response.status).toBe(400);
            const data = (await response.json());
            expect(data.code).toBe('INVALID_NAME');
        });
        it('should return 400 for name exceeding 100 characters', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: mockUsers.registered,
                session: { id: 'session-1' },
            });
            const request = new Request('http://localhost/api/v1/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'A'.repeat(101) }),
            });
            const response = await PATCH(createContext(request));
            expect(response.status).toBe(400);
            const data = (await response.json());
            expect(data.code).toBe('INVALID_NAME');
        });
        it('should return 400 for bio exceeding 500 characters', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: mockUsers.registered,
                session: { id: 'session-1' },
            });
            const request = new Request('http://localhost/api/v1/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio: 'B'.repeat(501) }),
            });
            const response = await PATCH(createContext(request));
            expect(response.status).toBe(400);
            const data = (await response.json());
            expect(data.code).toBe('INVALID_BIO');
        });
        it('should return 400 when no fields provided', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: mockUsers.registered,
                session: { id: 'session-1' },
            });
            const request = new Request('http://localhost/api/v1/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const response = await PATCH(createContext(request));
            expect(response.status).toBe(400);
            const data = (await response.json());
            expect(data.code).toBe('NO_CHANGES');
        });
        it('should return 404 when user not found during update', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: { id: 'nonexistent' },
                session: { id: 'session-1' },
            });
            mocks.mockUpdateUser.mockResolvedValue(null);
            const request = new Request('http://localhost/api/v1/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test' }),
            });
            const response = await PATCH(createContext(request));
            expect(response.status).toBe(404);
            const data = (await response.json());
            expect(data.code).toBe('USER_NOT_FOUND');
        });
        it('should return 500 on unexpected error', async () => {
            mocks.mockRequireAuth.mockResolvedValue({
                user: mockUsers.registered,
                session: { id: 'session-1' },
            });
            mocks.mockUpdateUser.mockRejectedValue(new Error('DB crash'));
            const request = new Request('http://localhost/api/v1/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test' }),
            });
            const response = await PATCH(createContext(request));
            expect(response.status).toBe(500);
        });
    });
});
//# sourceMappingURL=profile.test.js.map
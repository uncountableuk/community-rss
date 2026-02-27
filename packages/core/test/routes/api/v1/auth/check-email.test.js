import { describe, it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => {
    return {
        mockGetUserByEmail: vi.fn(),
    };
});
vi.mock('@db/queries/users', () => ({
    getUserByEmail: mocks.mockGetUserByEmail,
}));
import { GET } from '@routes/api/v1/auth/check-email';
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
describe('GET /api/v1/auth/check-email', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.mockGetUserByEmail.mockReset();
    });
    it('should return 503 when DB is not available', async () => {
        const request = new Request('http://localhost/api/v1/auth/check-email?email=test@example.com');
        const response = await GET(createContext(request, {}));
        expect(response.status).toBe(503);
    });
    it('should return 400 when email is missing', async () => {
        const request = new Request('http://localhost/api/v1/auth/check-email');
        const response = await GET(createContext(request));
        expect(response.status).toBe(400);
        const data = (await response.json());
        expect(data.code).toBe('INVALID_EMAIL');
    });
    it('should return 400 for invalid email format', async () => {
        const request = new Request('http://localhost/api/v1/auth/check-email?email=notanemail');
        const response = await GET(createContext(request));
        expect(response.status).toBe(400);
        const data = (await response.json());
        expect(data.code).toBe('INVALID_EMAIL');
    });
    it('should return exists=true for registered user', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue(mockUsers.registered);
        const request = new Request('http://localhost/api/v1/auth/check-email?email=reader@example.com');
        const response = await GET(createContext(request));
        expect(response.status).toBe(200);
        const data = (await response.json());
        expect(data.exists).toBe(true);
    });
    it('should return exists=false for guest user', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue(mockUsers.guest);
        const request = new Request('http://localhost/api/v1/auth/check-email?email=ghost@example.com');
        const response = await GET(createContext(request));
        expect(response.status).toBe(200);
        const data = (await response.json());
        expect(data.exists).toBe(false);
    });
    it('should return exists=false for unknown email', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue(null);
        const request = new Request('http://localhost/api/v1/auth/check-email?email=nobody@example.com');
        const response = await GET(createContext(request));
        expect(response.status).toBe(200);
        const data = (await response.json());
        expect(data.exists).toBe(false);
    });
    it('should normalize email to lowercase', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue(null);
        const request = new Request('http://localhost/api/v1/auth/check-email?email=TEST@EXAMPLE.COM');
        const response = await GET(createContext(request));
        expect(response.status).toBe(200);
        expect(mocks.mockGetUserByEmail).toHaveBeenCalledWith(expect.anything(), 'test@example.com');
    });
    it('should return 500 on database error', async () => {
        mocks.mockGetUserByEmail.mockRejectedValue(new Error('DB error'));
        const request = new Request('http://localhost/api/v1/auth/check-email?email=test@example.com');
        const response = await GET(createContext(request));
        expect(response.status).toBe(500);
    });
});
//# sourceMappingURL=check-email.test.js.map
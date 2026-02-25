import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth and query modules
const { mockHandler, mockGetSession, mockMigrateGuestToUser } = vi.hoisted(() => ({
    mockHandler: vi.fn(),
    mockGetSession: vi.fn(),
    mockMigrateGuestToUser: vi.fn(),
}));

vi.mock('@utils/build/auth', () => ({
    createAuth: vi.fn(() => ({
        handler: mockHandler,
        api: { getSession: mockGetSession },
    })),
}));

vi.mock('@db/queries/users', () => ({
    migrateGuestToUser: mockMigrateGuestToUser,
}));

// Dynamic import to get the route handler after mocks are set up
const { ALL } = await import('@routes/api/auth/[...all]');

describe('auth catch-all route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockApp = {
        db: {} as Record<string, unknown>,
        config: { email: undefined } as Record<string, unknown>,
        env: {
            FRESHRSS_URL: 'http://freshrss:80',
            FRESHRSS_USER: 'admin',
            FRESHRSS_API_PASSWORD: 'password',
            PUBLIC_SITE_URL: 'http://localhost:4321',
            SMTP_HOST: 'mailpit',
            SMTP_PORT: '1025',
            SMTP_FROM: 'noreply@localhost',
            S3_ENDPOINT: 'http://minio:9000',
            S3_ACCESS_KEY: 'key',
            S3_SECRET_KEY: 'secret',
            S3_BUCKET: 'bucket',
            MEDIA_BASE_URL: 'http://localhost:9000/bucket',
        } as Record<string, unknown>,
    };

    const createContext = (url: string, options: RequestInit = {}) => ({
        request: new Request(url, options),
        locals: { app: mockApp },
        // Provide minimal Astro API context stubs
        params: {},
        redirect: vi.fn(),
        cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), has: vi.fn() },
        url: new URL(url),
        site: new URL('http://localhost:4321'),
        generator: 'test',
        props: {},
        slots: {},
    });

    it('should delegate to auth.handler', async () => {
        const mockResponse = new Response(JSON.stringify({ status: true }), { status: 200 });
        mockHandler.mockResolvedValueOnce(mockResponse);

        const ctx = createContext('http://localhost:4321/api/auth/sign-in/magic-link', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com' }),
        });

        const response = await ALL(ctx as any);

        expect(mockHandler).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('should return 503 when DB is not available', async () => {
        const ctx = createContext('http://localhost:4321/api/auth/get-session');
        ctx.locals = { app: undefined } as any;

        const response = await ALL(ctx as any);

        expect(response.status).toBe(503);
    });

    it('should handle magic link verification with guest migration', async () => {
        const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
        mockHandler.mockResolvedValueOnce(mockResponse);
        mockGetSession.mockResolvedValueOnce({
            user: { id: 'new-user-1' },
            session: { id: 'session-1' },
        });

        const ctx = createContext('http://localhost:4321/api/auth/magic-link/verify?token=abc', {
            headers: { cookie: 'crss_guest=guest-uuid-123' },
        });

        const response = await ALL(ctx as any);

        expect(mockMigrateGuestToUser).toHaveBeenCalledWith(
            mockApp.db,
            'guest-uuid-123',
            'new-user-1',
        );
        // Should clear guest cookie
        const setCookie = response.headers.get('set-cookie');
        expect(setCookie).toContain('crss_guest=');
        expect(setCookie).toContain('Max-Age=0');
    });

    it('should not attempt migration without guest cookie', async () => {
        const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
        mockHandler.mockResolvedValueOnce(mockResponse);

        const ctx = createContext('http://localhost:4321/api/auth/magic-link/verify?token=abc');

        await ALL(ctx as any);

        expect(mockMigrateGuestToUser).not.toHaveBeenCalled();
    });
});

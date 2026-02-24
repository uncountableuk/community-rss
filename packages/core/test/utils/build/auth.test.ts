import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock better-auth and dependencies
const mockGetSession = vi.fn();
const mockHandler = vi.fn();
const mockBetterAuth = vi.hoisted(() =>
    vi.fn(() => ({
        api: { getSession: mockGetSession },
        handler: mockHandler,
    })),
);

const { mockSendMagicLinkEmail } = vi.hoisted(() => ({
    mockSendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('better-auth', () => ({
    betterAuth: mockBetterAuth,
}));

vi.mock('better-auth/adapters/drizzle', () => ({
    drizzleAdapter: vi.fn(() => vi.fn()),
}));

vi.mock('better-auth/plugins/magic-link', () => ({
    magicLink: vi.fn((opts: Record<string, unknown>) => ({ id: 'magic-link', opts })),
}));

vi.mock('drizzle-orm/d1', () => ({
    drizzle: vi.fn(() => ({})),
}));

vi.mock('@utils/build/email', () => ({
    sendMagicLinkEmail: mockSendMagicLinkEmail,
}));

vi.mock('@db/queries/pending-signups', () => ({
    getPendingSignup: vi.fn().mockResolvedValue(null),
}));

vi.mock('@db/queries/users', () => ({
    getUserByEmail: vi.fn().mockResolvedValue(null),
}));

import { createAuth, requireAuth, requireAdmin } from '@utils/build/auth';
import type { Env } from '@core-types/env';

const mockEnv: Env = {
    DB: {} as D1Database,
    MEDIA_BUCKET: {} as R2Bucket,
    ARTICLE_QUEUE: {} as Queue,
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
};

describe('auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createAuth', () => {
        it('should return a valid better-auth instance', () => {
            const auth = createAuth(mockEnv);
            expect(auth).toBeDefined();
            expect(auth.api).toBeDefined();
            expect(auth.handler).toBeDefined();
        });

        it('should configure betterAuth with correct baseURL', () => {
            createAuth(mockEnv);
            expect(mockBetterAuth).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: 'http://localhost:4321',
                }),
            );
        });

        it('should include magic-link plugin', () => {
            createAuth(mockEnv);
            const calls = mockBetterAuth.mock.calls as unknown[][];
            const config = ((calls[0]?.[0] as unknown) as Record<string, unknown>) || {};
            expect(config.plugins).toBeDefined();
            expect((config.plugins as unknown[]).length).toBe(1);
            expect(((config.plugins as unknown[])[0] as Record<string, unknown>).id).toBe('magic-link');
        });

        it('should configure additionalFields for user', () => {
            createAuth(mockEnv);
            const calls = mockBetterAuth.mock.calls as unknown[][];
            const config = ((calls[0]?.[0] as unknown) as Record<string, unknown>) || {};
            expect((config.user as Record<string, unknown>).additionalFields).toEqual(
                expect.objectContaining({
                    isGuest: expect.objectContaining({ type: 'boolean' }),
                    role: expect.objectContaining({ type: 'string', defaultValue: 'user' }),
                }),
            );
        });
    });

    describe('requireAuth', () => {
        it('should return session when authenticated', async () => {
            const mockSession = {
                user: { id: 'user-1', role: 'user', email: 'test@example.com' },
                session: { id: 'session-1' },
            };
            mockGetSession.mockResolvedValueOnce(mockSession);

            const request = new Request('http://localhost:4321/api/v1/test');
            const session = await requireAuth(request, mockEnv);

            expect(session).toEqual(mockSession);
            expect(mockGetSession).toHaveBeenCalledWith({
                headers: request.headers,
            });
        });

        it('should throw 401 when not authenticated', async () => {
            mockGetSession.mockResolvedValueOnce(null);

            const request = new Request('http://localhost:4321/api/v1/test');

            try {
                await requireAuth(request, mockEnv);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(Response);
                const response = error as Response;
                expect(response.status).toBe(401);
                const body = (await response.json()) as Record<string, string>;
                expect(body.code).toBe('AUTH_REQUIRED');
            }
        });
    });

    describe('requireAdmin', () => {
        it('should return session for admin users', async () => {
            const mockSession = {
                user: { id: 'admin-1', role: 'admin', email: 'admin@example.com' },
                session: { id: 'session-1' },
            };
            mockGetSession.mockResolvedValueOnce(mockSession);

            const request = new Request('http://localhost:4321/api/v1/admin/test');
            const session = await requireAdmin(request, mockEnv);

            expect(session).toEqual(mockSession);
        });

        it('should throw 403 for non-admin users', async () => {
            const mockSession = {
                user: { id: 'user-1', role: 'user', email: 'user@example.com' },
                session: { id: 'session-1' },
            };
            mockGetSession.mockResolvedValueOnce(mockSession);

            const request = new Request('http://localhost:4321/api/v1/admin/test');

            try {
                await requireAdmin(request, mockEnv);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(Response);
                const response = error as Response;
                expect(response.status).toBe(403);
                const body = (await response.json()) as Record<string, string>;
                expect(body.code).toBe('ADMIN_REQUIRED');
            }
        });

        it('should throw 401 when not authenticated', async () => {
            mockGetSession.mockResolvedValueOnce(null);

            const request = new Request('http://localhost:4321/api/v1/admin/test');

            try {
                await requireAdmin(request, mockEnv);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(Response);
                const response = error as Response;
                expect(response.status).toBe(401);
            }
        });
    });
});

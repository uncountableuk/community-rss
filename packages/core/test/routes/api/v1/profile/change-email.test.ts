import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
    mockRequireAuth: vi.fn(),
    mockGetUserByEmail: vi.fn(),
    mockSetPendingEmail: vi.fn(),
    mockSendEmailChangeEmail: vi.fn(),
}));

vi.mock('@utils/build/auth', () => ({
    requireAuth: mocks.mockRequireAuth,
}));

vi.mock('@db/queries/users', () => ({
    getUserByEmail: mocks.mockGetUserByEmail,
    setPendingEmail: mocks.mockSetPendingEmail,
}));

vi.mock('@utils/build/email', () => ({
    sendEmailChangeEmail: mocks.mockSendEmailChangeEmail,
}));

// Stable UUID for deterministic token generation
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1234' });

import { POST } from '@routes/api/v1/profile/change-email';
import { mockUsers } from '@fixtures/users';

const mockEnv = {
    DB: {} as D1Database,
    PUBLIC_SITE_URL: 'http://localhost:4321',
};

function createContext(request: Request, env: Record<string, unknown> = mockEnv) {
    return {
        request,
        locals: { runtime: { env } },
        params: {},
        redirect: (url: string) =>
            new Response(null, { status: 302, headers: { Location: url } }),
        url: new URL(request.url),
        cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), has: vi.fn() },
        props: {},
    } as unknown as Parameters<typeof POST>[0];
}

describe('POST /api/v1/profile/change-email', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.mockRequireAuth.mockReset();
        mocks.mockGetUserByEmail.mockReset();
        mocks.mockSetPendingEmail.mockReset();
        mocks.mockSendEmailChangeEmail.mockReset();
        mocks.mockSendEmailChangeEmail.mockResolvedValue(undefined);
    });

    it('should return 503 when DB is not available', async () => {
        const request = new Request('http://localhost/api/v1/profile/change-email', {
            method: 'POST',
            body: JSON.stringify({ email: 'new@example.com' }),
            headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(createContext(request, {}));
        expect(response.status).toBe(503);
    });

    it('should return 401 when not authenticated', async () => {
        mocks.mockRequireAuth.mockRejectedValue(
            new Response(JSON.stringify({ code: 'UNAUTHORIZED' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            }),
        );
        const request = new Request('http://localhost/api/v1/profile/change-email', {
            method: 'POST',
            body: JSON.stringify({ email: 'new@example.com' }),
            headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(401);
    });

    it('should return 400 for invalid JSON body', async () => {
        mocks.mockRequireAuth.mockResolvedValue({ user: mockUsers.registered });
        const request = new Request('http://localhost/api/v1/profile/change-email', {
            method: 'POST',
            body: 'not-json',
            headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(400);
        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('INVALID_BODY');
    });

    it('should return 400 when email is missing from body', async () => {
        mocks.mockRequireAuth.mockResolvedValue({ user: mockUsers.registered });
        const request = new Request('http://localhost/api/v1/profile/change-email', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(400);
        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('INVALID_EMAIL');
    });

    it('should return 400 for malformed email address', async () => {
        mocks.mockRequireAuth.mockResolvedValue({ user: mockUsers.registered });
        const request = new Request('http://localhost/api/v1/profile/change-email', {
            method: 'POST',
            body: JSON.stringify({ email: 'not-an-email' }),
            headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(400);
        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('INVALID_EMAIL');
    });

    it('should return 400 when new email matches current email', async () => {
        mocks.mockRequireAuth.mockResolvedValue({
            user: { ...mockUsers.registered, email: 'reader@example.com' },
        });
        const request = new Request('http://localhost/api/v1/profile/change-email', {
            method: 'POST',
            body: JSON.stringify({ email: 'reader@example.com' }),
            headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(400);
        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('SAME_EMAIL');
    });

    it('should return 409 when new email is already in use', async () => {
        mocks.mockRequireAuth.mockResolvedValue({
            user: { ...mockUsers.registered, email: 'reader@example.com' },
        });
        mocks.mockGetUserByEmail.mockResolvedValue(mockUsers.admin);
        const request = new Request('http://localhost/api/v1/profile/change-email', {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@example.com' }),
            headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(409);
        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('EMAIL_IN_USE');
    });

    it('should set pending email and send verification on valid request', async () => {
        mocks.mockRequireAuth.mockResolvedValue({
            user: { ...mockUsers.registered, email: 'reader@example.com' },
        });
        mocks.mockGetUserByEmail.mockResolvedValue(null);
        mocks.mockSetPendingEmail.mockResolvedValue({ ...mockUsers.registered, pendingEmail: 'new@example.com' });

        const request = new Request('http://localhost/api/v1/profile/change-email', {
            method: 'POST',
            body: JSON.stringify({ email: 'new@example.com' }),
            headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(200);

        expect(mocks.mockSetPendingEmail).toHaveBeenCalledWith(
            mockEnv.DB,
            mockUsers.registered.id,
            'new@example.com',
            'test-uuid-1234',
            expect.any(Date),
        );

        expect(mocks.mockSendEmailChangeEmail).toHaveBeenCalledWith(
            mockEnv,
            'new@example.com',
            expect.stringContaining('/auth/verify-email-change?token=test-uuid-1234'),
        );

        const data = (await response.json()) as Record<string, string>;
        expect(data.message).toContain('new@example.com');
    });

    it('should still return 200 even if email sending fails', async () => {
        mocks.mockRequireAuth.mockResolvedValue({
            user: { ...mockUsers.registered, email: 'reader@example.com' },
        });
        mocks.mockGetUserByEmail.mockResolvedValue(null);
        mocks.mockSetPendingEmail.mockResolvedValue({ ...mockUsers.registered });
        mocks.mockSendEmailChangeEmail.mockRejectedValue(new Error('SMTP down'));

        const request = new Request('http://localhost/api/v1/profile/change-email', {
            method: 'POST',
            body: JSON.stringify({ email: 'new@example.com' }),
            headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(200);
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
    return {
        mockCreatePendingSignup: vi.fn(),
        mockCreateAuth: vi.fn(),
        mockGetUserByEmail: vi.fn(),
    };
});

vi.mock('@db/queries/pending-signups', () => ({
    createPendingSignup: mocks.mockCreatePendingSignup,
}));

vi.mock('@db/queries/users', () => ({
    getUserByEmail: mocks.mockGetUserByEmail,
}));

vi.mock('@utils/build/auth', () => ({
    createAuth: mocks.mockCreateAuth,
}));

import { POST } from '@routes/api/v1/auth/signup';

const mockEnv = {
    DB: {} as D1Database,
    PUBLIC_SITE_URL: 'http://localhost:4321',
};

function createContext(request: Request, env: Record<string, unknown> = mockEnv) {
    return {
        request,
        locals: { runtime: { env } },
        params: {},
        redirect: (url: string) => new Response(null, { status: 302, headers: { Location: url } }),
        url: new URL(request.url),
        cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), has: vi.fn() },
        props: {},
    } as unknown as Parameters<typeof POST>[0];
}

function createPostRequest(body: unknown) {
    return new Request('http://localhost/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('POST /api/v1/auth/signup', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.mockCreatePendingSignup.mockReset();
        mocks.mockCreateAuth.mockReset();
        mocks.mockGetUserByEmail.mockReset();
        // Default: no existing user
        mocks.mockGetUserByEmail.mockResolvedValue(null);
    });

    it('should return 503 when DB is not available', async () => {
        const request = createPostRequest({ email: 'a@b.com', name: 'Test', termsAccepted: true });
        const response = await POST(createContext(request, {}));
        expect(response.status).toBe(503);
    });

    it('should return 400 for invalid JSON body', async () => {
        const request = new Request('http://localhost/api/v1/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'not json',
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(400);

        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('INVALID_BODY');
    });

    it('should return 400 for missing email', async () => {
        const request = createPostRequest({ name: 'Test', termsAccepted: true });
        const response = await POST(createContext(request));
        expect(response.status).toBe(400);

        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('INVALID_EMAIL');
    });

    it('should return 400 for invalid email format', async () => {
        const request = createPostRequest({ email: 'not-email', name: 'Test', termsAccepted: true });
        const response = await POST(createContext(request));
        expect(response.status).toBe(400);

        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('INVALID_EMAIL');
    });

    it('should return 400 for missing name', async () => {
        const request = createPostRequest({ email: 'a@b.com', termsAccepted: true });
        const response = await POST(createContext(request));
        expect(response.status).toBe(400);

        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('INVALID_NAME');
    });

    it('should return 400 for name exceeding 100 characters', async () => {
        const longName = 'A'.repeat(101);
        const request = createPostRequest({ email: 'a@b.com', name: longName, termsAccepted: true });
        const response = await POST(createContext(request));
        expect(response.status).toBe(400);

        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('INVALID_NAME');
    });

    it('should return 400 when terms not accepted', async () => {
        const request = createPostRequest({ email: 'a@b.com', name: 'Test', termsAccepted: false });
        const response = await POST(createContext(request));
        expect(response.status).toBe(400);

        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('TERMS_REQUIRED');
    });

    it('should send sign-in link and return exists:true when account already exists', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue({
            id: 'existing-id',
            email: 'existing@example.com',
            isGuest: false,
            name: 'Existing User',
        });

        const mockHandler = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), { status: 200 }),
        );
        mocks.mockCreateAuth.mockReturnValue({ handler: mockHandler });

        const request = createPostRequest({
            email: 'existing@example.com',
            name: 'New Name Attempt',
            termsAccepted: true,
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(200);

        const data = (await response.json()) as Record<string, unknown>;
        expect(data.exists).toBe(true);

        // Should NOT create a pending signup (avoids overwriting existing profile)
        expect(mocks.mockCreatePendingSignup).not.toHaveBeenCalled();
        // Should have sent a sign-in magic link instead
        expect(mockHandler).toHaveBeenCalled();
        const handlerCallArg = mockHandler.mock.calls[0][0] as Request;
        const body = await handlerCallArg.json() as Record<string, unknown>;
        expect(body.email).toBe('existing@example.com');
    });

    it('should not overwrite guest user — treat as new signup if isGuest is true', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue({
            id: 'guest-id',
            email: 'guest@example.com',
            isGuest: true,
        });

        mocks.mockCreatePendingSignup.mockResolvedValue({
            email: 'guest@example.com',
            name: 'Guest Upgrading',
        });

        const mockHandler = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), { status: 200 }),
        );
        mocks.mockCreateAuth.mockReturnValue({ handler: mockHandler });

        const request = createPostRequest({
            email: 'guest@example.com',
            name: 'Guest Upgrading',
            termsAccepted: true,
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(200);

        const data = (await response.json()) as Record<string, unknown>;
        expect(data.exists).toBeUndefined();
        expect(data.success).toBe(true);
        expect(mocks.mockCreatePendingSignup).toHaveBeenCalled();
    });

    it('should create pending signup and send magic link on success', async () => {
        mocks.mockCreatePendingSignup.mockResolvedValue({
            email: 'new@example.com',
            name: 'New User',
        });

        const mockHandler = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), { status: 200 }),
        );
        mocks.mockCreateAuth.mockReturnValue({ handler: mockHandler });

        const request = createPostRequest({
            email: 'new@example.com',
            name: 'New User',
            termsAccepted: true,
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(200);

        const data = (await response.json()) as Record<string, unknown>;
        expect(data.success).toBe(true);

        expect(mocks.mockCreatePendingSignup).toHaveBeenCalledWith(
            expect.anything(),
            'new@example.com',
            'New User',
        );
        expect(mockHandler).toHaveBeenCalled();
    });

    it('should return 500 when magic link send fails', async () => {
        mocks.mockCreatePendingSignup.mockResolvedValue({
            email: 'new@example.com',
            name: 'New User',
        });

        const mockHandler = vi.fn().mockResolvedValue(
            new Response('error', { status: 500 }),
        );
        mocks.mockCreateAuth.mockReturnValue({ handler: mockHandler });

        const request = createPostRequest({
            email: 'new@example.com',
            name: 'New User',
            termsAccepted: true,
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(500);

        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('EMAIL_SEND_FAILED');
    });

    it('should return 500 on unexpected error', async () => {
        mocks.mockCreatePendingSignup.mockRejectedValue(new Error('DB crash'));

        const request = createPostRequest({
            email: 'new@example.com',
            name: 'New User',
            termsAccepted: true,
        });
        const response = await POST(createContext(request));
        expect(response.status).toBe(500);
    });
});

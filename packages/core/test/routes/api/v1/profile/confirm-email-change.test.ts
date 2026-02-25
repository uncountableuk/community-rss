import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
    mockConfirmEmailChange: vi.fn(),
}));

vi.mock('@db/queries/users', () => ({
    confirmEmailChange: mocks.mockConfirmEmailChange,
}));

import { GET } from '@routes/api/v1/profile/confirm-email-change';
import { mockUsers } from '@fixtures/users';

const mockApp = {
    db: {} as Record<string, unknown>,
    config: { email: undefined } as Record<string, unknown>,
    env: {
        PUBLIC_SITE_URL: 'http://localhost:4321',
    } as Record<string, unknown>,
};

function createContext(request: Request, app: Record<string, unknown> | null = mockApp) {
    return {
        request,
        locals: { app },
        params: {},
        redirect: (url: string) =>
            new Response(null, { status: 302, headers: { Location: url } }),
        url: new URL(request.url),
        cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), has: vi.fn() },
        props: {},
    } as unknown as Parameters<typeof GET>[0];
}

describe('GET /api/v1/profile/confirm-email-change', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.mockConfirmEmailChange.mockReset();
    });

    it('should return 503 when DB is not available', async () => {
        const request = new Request('http://localhost/api/v1/profile/confirm-email-change?token=xyz');
        const response = await GET(createContext(request, {}));
        expect(response.status).toBe(503);
    });

    it('should return 400 when token is missing', async () => {
        const request = new Request('http://localhost/api/v1/profile/confirm-email-change');
        const response = await GET(createContext(request));
        expect(response.status).toBe(400);
        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('MISSING_TOKEN');
    });

    it('should return 404 when token is not found', async () => {
        mocks.mockConfirmEmailChange.mockResolvedValue(null);
        const request = new Request('http://localhost/api/v1/profile/confirm-email-change?token=bad-token');
        const response = await GET(createContext(request));
        expect(response.status).toBe(404);
        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('TOKEN_NOT_FOUND');
    });

    it('should return 400 when token is expired', async () => {
        mocks.mockConfirmEmailChange.mockResolvedValue({ expired: true });
        const request = new Request('http://localhost/api/v1/profile/confirm-email-change?token=old-token');
        const response = await GET(createContext(request));
        expect(response.status).toBe(400);
        const data = (await response.json()) as Record<string, string>;
        expect(data.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 200 on successful email change', async () => {
        const updatedUser = { ...mockUsers.registered, email: 'new@example.com', pendingEmail: null };
        mocks.mockConfirmEmailChange.mockResolvedValue(updatedUser);
        const request = new Request('http://localhost/api/v1/profile/confirm-email-change?token=valid-token');
        const response = await GET(createContext(request));
        expect(response.status).toBe(200);
        const data = (await response.json()) as Record<string, string>;
        expect(data.message).toContain('updated');
        expect(mocks.mockConfirmEmailChange).toHaveBeenCalledWith(mockApp.db, 'valid-token');
    });

    it('should return 500 when an unexpected error occurs', async () => {
        mocks.mockConfirmEmailChange.mockRejectedValue(new Error('DB crash'));
        const request = new Request('http://localhost/api/v1/profile/confirm-email-change?token=tok');
        const response = await GET(createContext(request));
        expect(response.status).toBe(500);
    });
});

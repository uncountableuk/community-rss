import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
    return {
        mockGetUserByEmail: vi.fn(),
        mockCreatePendingSignup: vi.fn(),
        mockCreateAuth: vi.fn(),
    };
});

vi.mock('@db/queries/users', () => ({
    getUserByEmail: mocks.mockGetUserByEmail,
}));

vi.mock('@db/queries/pending-signups', () => ({
    createPendingSignup: mocks.mockCreatePendingSignup,
}));

vi.mock('@utils/build/auth', () => ({
    createAuth: mocks.mockCreateAuth,
}));

import { checkEmailHandler, submitSignupHandler } from '@actions/auth';
import type { AppContext } from '@core-types/context';

const mockApp = {
    db: {} as Record<string, unknown>,
    config: {},
    env: { PUBLIC_SITE_URL: 'http://localhost:4321' },
} as unknown as AppContext;

describe('checkEmailHandler', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.mockGetUserByEmail.mockReset();
    });

    it('should return exists: false for unknown email', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue(null);

        const result = await checkEmailHandler({ email: 'new@example.com' }, mockApp);

        expect(result.exists).toBe(false);
        expect(mocks.mockGetUserByEmail).toHaveBeenCalledWith(mockApp.db, 'new@example.com');
    });

    it('should return exists: true for registered non-guest user', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue({
            id: 'user-1',
            email: 'known@example.com',
            isGuest: false,
        });

        const result = await checkEmailHandler({ email: 'known@example.com' }, mockApp);

        expect(result.exists).toBe(true);
    });

    it('should return exists: false for guest user', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue({
            id: 'guest-1',
            email: 'guest@example.com',
            isGuest: true,
        });

        const result = await checkEmailHandler({ email: 'guest@example.com' }, mockApp);

        expect(result.exists).toBe(false);
    });

    it('should normalise email to lowercase and trim', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue(null);

        await checkEmailHandler({ email: '  Test@Example.COM  ' }, mockApp);

        expect(mocks.mockGetUserByEmail).toHaveBeenCalledWith(mockApp.db, 'test@example.com');
    });

    it('should throw on empty email', async () => {
        await expect(checkEmailHandler({ email: '' }, mockApp)).rejects.toThrow(
            'Invalid email format',
        );
    });

    it('should throw on email without @', async () => {
        await expect(checkEmailHandler({ email: 'notanemail' }, mockApp)).rejects.toThrow(
            'Invalid email format',
        );
    });

    it('should throw on very short email', async () => {
        await expect(checkEmailHandler({ email: 'a@' }, mockApp)).rejects.toThrow(
            'Invalid email format',
        );
    });
});

describe('submitSignupHandler', () => {
    const mockAuthHandler = vi.fn();

    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.mockGetUserByEmail.mockReset();
        mocks.mockCreatePendingSignup.mockReset();
        mocks.mockCreateAuth.mockReset();
        mockAuthHandler.mockReset();
        mocks.mockCreateAuth.mockReturnValue({ handler: mockAuthHandler });
        // Default: no existing user, auth succeeds
        mocks.mockGetUserByEmail.mockResolvedValue(null);
        mockAuthHandler.mockResolvedValue(new Response(null, { status: 200 }));
    });

    it('should create pending signup and send magic link', async () => {
        const result = await submitSignupHandler(
            { email: 'new@example.com', name: 'New User', termsAccepted: true },
            mockApp,
        );

        expect(mocks.mockCreatePendingSignup).toHaveBeenCalledWith(mockApp.db, 'new@example.com', 'New User');
        expect(mocks.mockCreateAuth).toHaveBeenCalledWith(mockApp);
        expect(mockAuthHandler).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.message).toContain('email');
    });

    it('should send sign-in link if user already exists', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue({
            id: 'user-1',
            email: 'existing@example.com',
            isGuest: false,
        });
        mockAuthHandler.mockResolvedValue(new Response(null, { status: 200 }));

        const result = await submitSignupHandler(
            { email: 'existing@example.com', name: 'Someone', termsAccepted: true },
            mockApp,
        );

        expect(result.success).toBe(true);
        expect(result.exists).toBe(true);
        expect(mocks.mockCreatePendingSignup).not.toHaveBeenCalled();
    });

    it('should throw on missing email', async () => {
        await expect(
            submitSignupHandler({ email: '', name: 'Test', termsAccepted: true }, mockApp),
        ).rejects.toThrow('Valid email is required');
    });

    it('should throw on invalid email format', async () => {
        await expect(
            submitSignupHandler({ email: 'nope', name: 'Test', termsAccepted: true }, mockApp),
        ).rejects.toThrow('Valid email is required');
    });

    it('should throw on missing name', async () => {
        await expect(
            submitSignupHandler({ email: 'a@b.com', name: '', termsAccepted: true }, mockApp),
        ).rejects.toThrow('Display name is required');
    });

    it('should throw on name exceeding 100 characters', async () => {
        const longName = 'a'.repeat(101);
        await expect(
            submitSignupHandler({ email: 'a@b.com', name: longName, termsAccepted: true }, mockApp),
        ).rejects.toThrow('Display name must be 100 characters or less');
    });

    it('should throw when terms not accepted', async () => {
        await expect(
            submitSignupHandler({ email: 'a@b.com', name: 'Test', termsAccepted: false }, mockApp),
        ).rejects.toThrow('You must accept the Terms of Service');
    });

    it('should throw when magic link fails', async () => {
        mockAuthHandler.mockResolvedValue(new Response(null, { status: 500 }));

        await expect(
            submitSignupHandler({ email: 'a@b.com', name: 'Test', termsAccepted: true }, mockApp),
        ).rejects.toThrow('Failed to send verification email');
    });

    it('should normalise email to lowercase', async () => {
        const result = await submitSignupHandler(
            { email: '  USER@Example.COM  ', name: 'Test', termsAccepted: true },
            mockApp,
        );

        expect(mocks.mockCreatePendingSignup).toHaveBeenCalledWith(
            mockApp.db,
            'user@example.com',
            'Test',
        );
        expect(result.success).toBe(true);
    });
});

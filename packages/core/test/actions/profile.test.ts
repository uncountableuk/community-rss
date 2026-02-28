import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
    return {
        mockGetUserById: vi.fn(),
        mockGetUserByEmail: vi.fn(),
        mockUpdateUser: vi.fn(),
        mockSetPendingEmail: vi.fn(),
        mockConfirmEmailChange: vi.fn(),
        mockSendEmailChangeEmail: vi.fn(),
    };
});

vi.mock('@db/queries/users', () => ({
    getUserById: mocks.mockGetUserById,
    getUserByEmail: mocks.mockGetUserByEmail,
    updateUser: mocks.mockUpdateUser,
    setPendingEmail: mocks.mockSetPendingEmail,
    confirmEmailChange: mocks.mockConfirmEmailChange,
}));

vi.mock('@utils/build/email', () => ({
    sendEmailChangeEmail: mocks.mockSendEmailChangeEmail,
}));

import {
    updateProfileHandler,
    changeEmailHandler,
    confirmEmailChangeHandler,
} from '@actions/profile';
import type { AppContext } from '@core-types/context';

const mockApp = {
    db: {} as Record<string, unknown>,
    config: {},
    env: { PUBLIC_SITE_URL: 'http://localhost:4321' },
} as unknown as AppContext;

describe('updateProfileHandler', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.mockUpdateUser.mockReset();
    });

    it('should update name successfully', async () => {
        mocks.mockUpdateUser.mockResolvedValue({
            id: 'user-1',
            email: 'user@test.com',
            name: 'New Name',
            bio: null,
            avatarUrl: null,
            role: 'user',
            emailVerified: true,
        });

        const result = await updateProfileHandler(
            { userId: 'user-1', name: 'New Name' },
            mockApp,
        );

        expect(mocks.mockUpdateUser).toHaveBeenCalledWith(mockApp.db, 'user-1', {
            name: 'New Name',
        });
        expect(result.id).toBe('user-1');
        expect(result.name).toBe('New Name');
    });

    it('should update bio successfully', async () => {
        mocks.mockUpdateUser.mockResolvedValue({
            id: 'user-1',
            email: 'user@test.com',
            name: 'User',
            bio: 'Hello world',
            avatarUrl: null,
            role: 'user',
            emailVerified: true,
        });

        const result = await updateProfileHandler(
            { userId: 'user-1', bio: 'Hello world' },
            mockApp,
        );

        expect(mocks.mockUpdateUser).toHaveBeenCalledWith(mockApp.db, 'user-1', {
            bio: 'Hello world',
        });
        expect(result.bio).toBe('Hello world');
    });

    it('should update both name and bio', async () => {
        mocks.mockUpdateUser.mockResolvedValue({
            id: 'user-1',
            email: 'user@test.com',
            name: 'Updated',
            bio: 'Bio text',
            avatarUrl: null,
            role: 'user',
            emailVerified: true,
        });

        await updateProfileHandler(
            { userId: 'user-1', name: 'Updated', bio: 'Bio text' },
            mockApp,
        );

        expect(mocks.mockUpdateUser).toHaveBeenCalledWith(mockApp.db, 'user-1', {
            name: 'Updated',
            bio: 'Bio text',
        });
    });

    it('should throw on empty name', async () => {
        await expect(
            updateProfileHandler({ userId: 'user-1', name: '  ' }, mockApp),
        ).rejects.toThrow('Display name cannot be empty');
    });

    it('should throw on name exceeding 100 characters', async () => {
        await expect(
            updateProfileHandler({ userId: 'user-1', name: 'a'.repeat(101) }, mockApp),
        ).rejects.toThrow('Display name must be 100 characters or less');
    });

    it('should throw on bio exceeding 500 characters', async () => {
        await expect(
            updateProfileHandler({ userId: 'user-1', bio: 'a'.repeat(501) }, mockApp),
        ).rejects.toThrow('Bio must be 500 characters or less');
    });

    it('should throw when no fields provided', async () => {
        await expect(
            updateProfileHandler({ userId: 'user-1' }, mockApp),
        ).rejects.toThrow('No fields to update');
    });

    it('should throw when user not found', async () => {
        mocks.mockUpdateUser.mockResolvedValue(null);

        await expect(
            updateProfileHandler({ userId: 'nonexistent', name: 'Test' }, mockApp),
        ).rejects.toThrow('User not found');
    });
});

describe('changeEmailHandler', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.mockGetUserByEmail.mockReset();
        mocks.mockSetPendingEmail.mockReset();
        mocks.mockSendEmailChangeEmail.mockReset();
        // Default: no existing user with the new email
        mocks.mockGetUserByEmail.mockResolvedValue(null);
        mocks.mockSetPendingEmail.mockResolvedValue(undefined);
        mocks.mockSendEmailChangeEmail.mockResolvedValue(undefined);
    });

    it('should set pending email and send verification', async () => {
        const result = await changeEmailHandler(
            {
                userId: 'user-1',
                currentEmail: 'old@example.com',
                currentName: 'User',
                newEmail: 'new@example.com',
            },
            mockApp,
        );

        expect(mocks.mockSetPendingEmail).toHaveBeenCalledWith(
            mockApp.db,
            'user-1',
            'new@example.com',
            expect.any(String), // token
            expect.any(Date), // expiresAt
        );
        expect(mocks.mockSendEmailChangeEmail).toHaveBeenCalled();
        expect(result.message).toContain('new@example.com');
    });

    it('should throw when email is empty', async () => {
        await expect(
            changeEmailHandler(
                { userId: 'user-1', currentEmail: 'old@x.com', newEmail: '' },
                mockApp,
            ),
        ).rejects.toThrow('Email address is required');
    });

    it('should throw for invalid email format', async () => {
        await expect(
            changeEmailHandler(
                { userId: 'user-1', currentEmail: 'old@x.com', newEmail: 'notanemail' },
                mockApp,
            ),
        ).rejects.toThrow('Invalid email address format');
    });

    it('should throw when new email matches current', async () => {
        await expect(
            changeEmailHandler(
                { userId: 'user-1', currentEmail: 'same@example.com', newEmail: 'same@example.com' },
                mockApp,
            ),
        ).rejects.toThrow('New email address must differ from the current one');
    });

    it('should throw when new email already taken', async () => {
        mocks.mockGetUserByEmail.mockResolvedValue({
            id: 'other-user',
            email: 'taken@example.com',
        });

        await expect(
            changeEmailHandler(
                { userId: 'user-1', currentEmail: 'old@x.com', newEmail: 'taken@example.com' },
                mockApp,
            ),
        ).rejects.toThrow('That email address is already in use');
    });

    it('should still succeed if email sending fails (fire-and-forget)', async () => {
        mocks.mockSendEmailChangeEmail.mockRejectedValue(new Error('SMTP down'));

        const result = await changeEmailHandler(
            {
                userId: 'user-1',
                currentEmail: 'old@example.com',
                newEmail: 'new@example.com',
            },
            mockApp,
        );

        // Should not throw — email failure is swallowed
        expect(result.message).toContain('new@example.com');
    });
});

describe('confirmEmailChangeHandler', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.mockConfirmEmailChange.mockReset();
    });

    it('should confirm email change with valid token', async () => {
        mocks.mockConfirmEmailChange.mockResolvedValue({ id: 'user-1', email: 'new@x.com' });

        const result = await confirmEmailChangeHandler({ token: 'valid-token' }, mockApp);

        expect(mocks.mockConfirmEmailChange).toHaveBeenCalledWith(mockApp.db, 'valid-token');
        expect(result.message).toContain('successfully');
    });

    it('should throw on empty token', async () => {
        await expect(
            confirmEmailChangeHandler({ token: '' }, mockApp),
        ).rejects.toThrow('Missing verification token');
    });

    it('should throw on invalid token', async () => {
        mocks.mockConfirmEmailChange.mockResolvedValue(null);

        await expect(
            confirmEmailChangeHandler({ token: 'bad-token' }, mockApp),
        ).rejects.toThrow('Invalid or already-used verification token');
    });

    it('should throw on expired token', async () => {
        mocks.mockConfirmEmailChange.mockResolvedValue({ expired: true });

        await expect(
            confirmEmailChangeHandler({ token: 'expired-token' }, mockApp),
        ).rejects.toThrow('expired');
    });
});

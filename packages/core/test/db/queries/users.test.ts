import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must use vi.hoisted() for variables referenced in vi.mock() factories
const {
    mockAll, mockOnConflictDoNothing, mockRun,
    mockValues, mockInsert, mockUpdate, mockDelete, mockSet, mockSelect,
} = vi.hoisted(() => {
    const mockRun = vi.fn().mockResolvedValue(undefined);
    const mockAll = vi.fn().mockResolvedValue([]);
    const mockReturning = vi.fn(() => ({ all: mockAll }));
    const mockOnConflictDoNothing = vi.fn(() => ({ returning: mockReturning, run: mockRun }));
    const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
    const mockInsert = vi.fn(() => ({ values: mockValues }));
    const mockWhere = vi.fn(() => ({ all: mockAll, run: mockRun, returning: mockReturning }));
    const mockSet = vi.fn(() => ({ where: mockWhere }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    const mockSelect = vi.fn(() => ({ from: mockFrom }));
    const mockUpdate = vi.fn(() => ({ set: mockSet }));
    const mockDelete = vi.fn(() => ({ where: mockWhere }));
    return {
        mockAll, mockOnConflictDoNothing, mockRun,
        mockValues, mockInsert, mockUpdate, mockDelete, mockSet, mockSelect,
    };
});

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((col, val) => ({ col, val })),
}));

import {
    SYSTEM_USER_ID,
    ensureSystemUser,
    getUserById,
    getUserByEmail,
    createGuestUser,
    migrateGuestToUser,
    updateUser,
    getUserByPendingEmailToken,
    setPendingEmail,
    confirmEmailChange,
    isAdmin,
    isSystemUser,
} from '@db/queries/users';
import { mockUsers } from '@fixtures/users';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

describe('users queries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockDb = {
        insert: mockInsert,
        select: mockSelect,
        update: mockUpdate,
        delete: mockDelete,
    } as unknown as BetterSQLite3Database;

    describe('SYSTEM_USER_ID', () => {
        it('should be "system"', () => {
            expect(SYSTEM_USER_ID).toBe('system');
        });
    });

    describe('ensureSystemUser', () => {
        it('should insert system user with role "system"', async () => {
            await ensureSystemUser(mockDb);

            expect(mockInsert).toHaveBeenCalled();
            expect(mockValues).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'system',
                    name: 'System',
                    isGuest: false,
                    role: 'system',
                }),
            );
            expect(mockOnConflictDoNothing).toHaveBeenCalled();
            expect(mockRun).toHaveBeenCalled();
        });
    });

    describe('getUserById', () => {
        it('should return user when found', async () => {
            mockAll.mockResolvedValueOnce([mockUsers.registered]);
            const user = await getUserById(mockDb, 'user-registered-1');
            expect(user).toEqual(mockUsers.registered);
        });

        it('should return null when not found', async () => {
            mockAll.mockResolvedValueOnce([]);
            const user = await getUserById(mockDb, 'nonexistent');
            expect(user).toBeNull();
        });
    });

    describe('getUserByEmail', () => {
        it('should return user when found by email', async () => {
            mockAll.mockResolvedValueOnce([mockUsers.registered]);
            const user = await getUserByEmail(mockDb, 'reader@example.com');
            expect(user).toEqual(mockUsers.registered);
        });

        it('should return null when email not found', async () => {
            mockAll.mockResolvedValueOnce([]);
            const user = await getUserByEmail(mockDb, 'nobody@example.com');
            expect(user).toBeNull();
        });
    });

    describe('createGuestUser', () => {
        it('should create guest with isGuest=true and role=user', async () => {
            const guestId = 'guest-uuid-123';
            mockAll.mockResolvedValueOnce([{ id: guestId, isGuest: true, role: 'user' }]);
            const guest = await createGuestUser(mockDb, guestId);

            expect(mockValues).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: guestId,
                    isGuest: true,
                    role: 'user',
                }),
            );
            expect(guest).toEqual({ id: guestId, isGuest: true, role: 'user' });
        });

        it('should return null if guest already exists (idempotent)', async () => {
            mockAll.mockResolvedValueOnce([]);
            const guest = await createGuestUser(mockDb, 'existing-guest');
            expect(guest).toBeNull();
        });
    });

    describe('migrateGuestToUser', () => {
        it('should transfer interactions and comments then delete guest', async () => {
            await migrateGuestToUser(mockDb, 'guest-123', 'user-456');

            // Should call update twice (interactions + comments) and delete once
            expect(mockUpdate).toHaveBeenCalledTimes(2);
            expect(mockDelete).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateUser', () => {
        it('should update name and bio and return updated user', async () => {
            const updated = { ...mockUsers.registered, name: 'New Name', bio: 'New bio' };
            mockAll.mockResolvedValueOnce([updated]);
            const result = await updateUser(mockDb, 'user-registered-1', {
                name: 'New Name',
                bio: 'New bio',
            });

            expect(mockUpdate).toHaveBeenCalled();
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'New Name',
                    bio: 'New bio',
                }),
            );
            expect(result).toEqual(updated);
        });

        it('should update termsAcceptedAt', async () => {
            const now = new Date();
            const updated = { ...mockUsers.registered, termsAcceptedAt: now };
            mockAll.mockResolvedValueOnce([updated]);
            const result = await updateUser(mockDb, 'user-registered-1', {
                termsAcceptedAt: now,
            });

            expect(mockUpdate).toHaveBeenCalled();
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({ termsAcceptedAt: now }),
            );
            expect(result).toEqual(updated);
        });

        it('should return null if user not found', async () => {
            mockAll.mockResolvedValueOnce([]);
            const result = await updateUser(mockDb, 'nonexistent', { name: 'Test' });
            expect(result).toBeNull();
        });
    });

    describe('isAdmin', () => {
        it('should return true for admin role', () => {
            expect(isAdmin({ role: 'admin' })).toBe(true);
        });

        it('should return false for user role', () => {
            expect(isAdmin({ role: 'user' })).toBe(false);
        });

        it('should return false for system role', () => {
            expect(isAdmin({ role: 'system' })).toBe(false);
        });
    });

    describe('isSystemUser', () => {
        it('should return true for system role', () => {
            expect(isSystemUser({ role: 'system' })).toBe(true);
        });

        it('should return false for user role', () => {
            expect(isSystemUser({ role: 'user' })).toBe(false);
        });

        it('should return false for admin role', () => {
            expect(isSystemUser({ role: 'admin' })).toBe(false);
        });
    });

    describe('getUserByPendingEmailToken', () => {
        it('should return user when matching token is found', async () => {
            const token = 'token-abc-123';
            mockAll.mockResolvedValueOnce([{ ...mockUsers.registered, pendingEmailToken: token }]);
            const result = await getUserByPendingEmailToken(mockDb, token);
            expect(result?.pendingEmailToken).toBe(token);
        });

        it('should return null when no matching token exists', async () => {
            mockAll.mockResolvedValueOnce([]);
            const result = await getUserByPendingEmailToken(mockDb, 'nonexistent-token');
            expect(result).toBeNull();
        });
    });

    describe('setPendingEmail', () => {
        it('should set pending email fields on the user', async () => {
            const expiresAt = new Date(Date.now() + 86400000);
            const updated = {
                ...mockUsers.registered,
                pendingEmail: 'new@example.com',
                pendingEmailToken: 'tok-xyz',
                pendingEmailExpiresAt: expiresAt,
            };
            mockAll.mockResolvedValueOnce([updated]);
            const result = await setPendingEmail(
                mockDb,
                mockUsers.registered.id,
                'new@example.com',
                'tok-xyz',
                expiresAt,
            );
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    pendingEmail: 'new@example.com',
                    pendingEmailToken: 'tok-xyz',
                    pendingEmailExpiresAt: expiresAt,
                }),
            );
            expect(result).toEqual(updated);
        });

        it('should return null if user not found', async () => {
            mockAll.mockResolvedValueOnce([]);
            const result = await setPendingEmail(
                mockDb,
                'nonexistent',
                'new@example.com',
                'tok-xyz',
                new Date(),
            );
            expect(result).toBeNull();
        });
    });

    describe('confirmEmailChange', () => {
        it('should return null when no matching token', async () => {
            mockAll.mockResolvedValueOnce([]);
            const result = await confirmEmailChange(mockDb, 'bad-token');
            expect(result).toBeNull();
        });

        it('should return null when user has no pendingEmail', async () => {
            mockAll.mockResolvedValueOnce([{ ...mockUsers.registered, pendingEmailToken: 'tok', pendingEmail: null, pendingEmailExpiresAt: new Date(Date.now() + 1000) }]);
            const result = await confirmEmailChange(mockDb, 'tok');
            expect(result).toBeNull();
        });

        it('should return { expired: true } when token is expired', async () => {
            mockAll.mockResolvedValueOnce([{
                ...mockUsers.registered,
                pendingEmailToken: 'tok',
                pendingEmail: 'new@example.com',
                pendingEmailExpiresAt: new Date(Date.now() - 1000),
            }]);
            const result = await confirmEmailChange(mockDb, 'tok');
            expect(result).toEqual({ expired: true });
        });

        it('should update email and clear pending fields on valid token', async () => {
            const expiresAt = new Date(Date.now() + 86400000);
            mockAll
                .mockResolvedValueOnce([{
                    ...mockUsers.registered,
                    pendingEmailToken: 'valid-tok',
                    pendingEmail: 'new@example.com',
                    pendingEmailExpiresAt: expiresAt,
                }])
                .mockResolvedValueOnce([{
                    ...mockUsers.registered,
                    email: 'new@example.com',
                    pendingEmail: null,
                    pendingEmailToken: null,
                    pendingEmailExpiresAt: null,
                }]);
            const result = await confirmEmailChange(mockDb, 'valid-tok');
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'new@example.com',
                    pendingEmail: null,
                    pendingEmailToken: null,
                    pendingEmailExpiresAt: null,
                }),
            );
            expect(result).toMatchObject({ email: 'new@example.com' });
        });
    });
});

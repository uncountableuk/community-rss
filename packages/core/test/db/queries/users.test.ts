import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must use vi.hoisted() for variables referenced in vi.mock() factories
const {
    mockAll, mockOnConflictDoNothing, mockRun,
    mockValues, mockInsert, mockUpdate, mockDelete, mockDrizzle,
} = vi.hoisted(() => {
    const mockRun = vi.fn().mockResolvedValue(undefined);
    const mockAll = vi.fn().mockResolvedValue([]);
    const mockReturning = vi.fn(() => ({ all: mockAll }));
    const mockOnConflictDoNothing = vi.fn(() => ({ returning: mockReturning, run: mockRun }));
    const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
    const mockInsert = vi.fn(() => ({ values: mockValues }));
    const mockWhere = vi.fn(() => ({ all: mockAll, run: mockRun }));
    const mockSet = vi.fn(() => ({ where: mockWhere }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    const mockSelect = vi.fn(() => ({ from: mockFrom }));
    const mockUpdate = vi.fn(() => ({ set: mockSet }));
    const mockDelete = vi.fn(() => ({ where: mockWhere }));
    const mockDrizzle = vi.fn(() => ({
        insert: mockInsert,
        select: mockSelect,
        update: mockUpdate,
        delete: mockDelete,
    }));
    return {
        mockAll, mockOnConflictDoNothing, mockRun,
        mockValues, mockInsert, mockUpdate, mockDelete, mockDrizzle,
    };
});

vi.mock('drizzle-orm/d1', () => ({
    drizzle: mockDrizzle,
}));

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
    isAdmin,
    isSystemUser,
} from '@db/queries/users';
import { mockUsers } from '@fixtures/users';

describe('users queries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockDb = {} as D1Database;

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
});

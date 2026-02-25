import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreateGuestUser, mockMigrateGuest } = vi.hoisted(() => ({
    mockCreateGuestUser: vi.fn(),
    mockMigrateGuest: vi.fn(),
}));

vi.mock('@db/queries/users', () => ({
    createGuestUser: mockCreateGuestUser,
    migrateGuestToUser: mockMigrateGuest,
}));

import { createShadowProfile, migrateGuestToUser } from '@utils/build/guest';

describe('server guest management', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockDb = {} as D1Database;

    describe('createShadowProfile', () => {
        it('should create a guest user in D1', async () => {
            const guestId = 'guest-uuid-123';
            mockCreateGuestUser.mockResolvedValueOnce({ id: guestId, isGuest: true, role: 'user' });

            const result = await createShadowProfile(mockDb, guestId);

            expect(mockCreateGuestUser).toHaveBeenCalledWith(mockDb, guestId);
            expect(result).toEqual({ id: guestId, isGuest: true, role: 'user' });
        });

        it('should return null if guest already exists', async () => {
            mockCreateGuestUser.mockResolvedValueOnce(null);

            const result = await createShadowProfile(mockDb, 'existing-guest');
            expect(result).toBeNull();
        });
    });

    describe('migrateGuestToUser', () => {
        it('should delegate to the DB query', async () => {
            mockMigrateGuest.mockResolvedValueOnce(undefined);

            await migrateGuestToUser(mockDb, 'guest-123', 'user-456');

            expect(mockMigrateGuest).toHaveBeenCalledWith(mockDb, 'guest-123', 'user-456');
        });

        it('should be a no-op for non-existent guest (idempotent)', async () => {
            mockMigrateGuest.mockResolvedValueOnce(undefined);

            // Should not throw even if guest doesn't exist
            await expect(migrateGuestToUser(mockDb, 'nonexistent', 'user-789')).resolves.toBeUndefined();
        });
    });
});

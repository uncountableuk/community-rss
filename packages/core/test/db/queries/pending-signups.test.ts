import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
    mockAll, mockRun, mockOnConflictDoUpdate,
    mockValues, mockInsert, mockDelete, mockSelect,
} = vi.hoisted(() => {
    const mockRun = vi.fn().mockResolvedValue(undefined);
    const mockAll = vi.fn().mockResolvedValue([]);
    const mockReturning = vi.fn(() => ({ all: mockAll }));
    const mockOnConflictDoUpdate = vi.fn(() => ({ returning: mockReturning }));
    const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }));
    const mockInsert = vi.fn(() => ({ values: mockValues }));
    const mockWhere = vi.fn(() => ({ all: mockAll, run: mockRun }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    const mockSelect = vi.fn(() => ({ from: mockFrom }));
    const mockDelete = vi.fn(() => ({ where: mockWhere }));
    return {
        mockAll, mockRun, mockOnConflictDoUpdate,
        mockValues, mockInsert, mockDelete, mockSelect,
    };
});

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((col, val) => ({ col, val })),
    lt: vi.fn((col, val) => ({ col, val })),
}));

import {
    createPendingSignup,
    getPendingSignup,
    deletePendingSignup,
    cleanupExpiredSignups,
} from '@db/queries/pending-signups';

import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

describe('pending-signups queries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockDb = {
        insert: mockInsert,
        select: mockSelect,
        delete: mockDelete,
    } as unknown as BetterSQLite3Database;

    describe('createPendingSignup', () => {
        it('should insert a pending signup with upsert', async () => {
            const pending = {
                email: 'new@example.com',
                name: 'New User',
                termsAcceptedAt: new Date(),
                createdAt: new Date(),
            };
            mockAll.mockResolvedValueOnce([pending]);

            const result = await createPendingSignup(mockDb, 'new@example.com', 'New User');

            expect(mockInsert).toHaveBeenCalled();
            expect(mockValues).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'new@example.com',
                    name: 'New User',
                }),
            );
            expect(mockOnConflictDoUpdate).toHaveBeenCalled();
            expect(result).toEqual(pending);
        });

        it('should return null when no record returned', async () => {
            mockAll.mockResolvedValueOnce([]);

            const result = await createPendingSignup(mockDb, 'test@example.com', 'Test');

            expect(result).toBeNull();
        });
    });

    describe('getPendingSignup', () => {
        it('should return pending signup when found', async () => {
            const pending = {
                email: 'new@example.com',
                name: 'New User',
                termsAcceptedAt: new Date(),
                createdAt: new Date(),
            };
            mockAll.mockResolvedValueOnce([pending]);

            const result = await getPendingSignup(mockDb, 'new@example.com');
            expect(result).toEqual(pending);
        });

        it('should return null when not found', async () => {
            mockAll.mockResolvedValueOnce([]);

            const result = await getPendingSignup(mockDb, 'missing@example.com');
            expect(result).toBeNull();
        });
    });

    describe('deletePendingSignup', () => {
        it('should delete a pending signup by email', async () => {
            await deletePendingSignup(mockDb, 'new@example.com');

            expect(mockDelete).toHaveBeenCalled();
            expect(mockRun).toHaveBeenCalled();
        });
    });

    describe('cleanupExpiredSignups', () => {
        it('should delete signups older than maxAgeMs', async () => {
            await cleanupExpiredSignups(mockDb, 1000 * 60 * 60);

            expect(mockDelete).toHaveBeenCalled();
            expect(mockRun).toHaveBeenCalled();
        });

        it('should use 24h default when no maxAgeMs provided', async () => {
            await cleanupExpiredSignups(mockDb);

            expect(mockDelete).toHaveBeenCalled();
            expect(mockRun).toHaveBeenCalled();
        });
    });
});

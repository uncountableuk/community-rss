import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must use vi.hoisted() for variables referenced in vi.mock() factories
const { mockAll, mockOnConflictDoNothing, mockValues, mockInsert, mockDrizzle } = vi.hoisted(() => {
    const mockRun = vi.fn().mockResolvedValue(undefined);
    const mockAll = vi.fn().mockResolvedValue([]);
    const mockReturning = vi.fn(() => ({ all: mockAll }));
    const mockOnConflictDoNothing = vi.fn(() => ({ returning: mockReturning, run: mockRun }));
    const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
    const mockInsert = vi.fn(() => ({ values: mockValues }));
    const mockDrizzle = vi.fn(() => ({ insert: mockInsert }));
    return { mockAll, mockOnConflictDoNothing, mockValues, mockInsert, mockDrizzle };
});

vi.mock('drizzle-orm/d1', () => ({
    drizzle: mockDrizzle,
}));

import { seedSystemUser, seedDatabase } from '@db/seed';

describe('seed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockDb = {} as D1Database;

    describe('seedSystemUser', () => {
        it('should create system user with correct values', async () => {
            mockAll.mockResolvedValueOnce([{ id: 'system', role: 'system' }]);
            const result = await seedSystemUser(mockDb);

            expect(mockInsert).toHaveBeenCalled();
            expect(mockValues).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'system',
                    name: 'System',
                    isGuest: false,
                    role: 'system',
                    emailVerified: false,
                }),
            );
            expect(mockOnConflictDoNothing).toHaveBeenCalled();
            expect(result).toEqual({ created: true });
        });

        it('should be idempotent — running twice does not error', async () => {
            // First call: user created
            mockAll.mockResolvedValueOnce([{ id: 'system' }]);
            const first = await seedSystemUser(mockDb);
            expect(first.created).toBe(true);

            // Second call: user already exists (onConflictDoNothing returns empty)
            mockAll.mockResolvedValueOnce([]);
            const second = await seedSystemUser(mockDb);
            expect(second.created).toBe(false);
        });
    });

    describe('seedDatabase', () => {
        it('should seed all required data', async () => {
            mockAll.mockResolvedValueOnce([{ id: 'system' }]);
            const result = await seedDatabase(mockDb);

            expect(result).toEqual({
                systemUser: { created: true },
            });
        });
    });
});

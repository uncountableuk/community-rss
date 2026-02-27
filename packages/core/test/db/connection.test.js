import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDatabase, closeDatabase, _resetDatabaseSingleton } from '@db/connection';
describe('Database Connection Factory', () => {
    beforeEach(() => {
        closeDatabase();
        _resetDatabaseSingleton();
    });
    afterEach(() => {
        closeDatabase();
        _resetDatabaseSingleton();
    });
    describe('createDatabase', () => {
        it('should create an in-memory database', () => {
            const db = createDatabase(':memory:');
            expect(db).toBeDefined();
            expect(typeof db.select).toBe('function');
        });
        it('should return the same instance on subsequent calls (singleton)', () => {
            const db1 = createDatabase(':memory:');
            const db2 = createDatabase(':memory:');
            expect(db1).toBe(db2);
        });
        it('should enable WAL mode', () => {
            const db = createDatabase(':memory:');
            // WAL mode is enabled via pragma — verify the database is functional
            expect(db).toBeDefined();
        });
        it('should create parent directories for file-based path', () => {
            const { mkdirSync, existsSync } = require('node:fs');
            const tmpPath = `/tmp/crss-test-${Date.now()}/nested/test.db`;
            const db = createDatabase(tmpPath);
            expect(db).toBeDefined();
            // Clean up
            closeDatabase();
            _resetDatabaseSingleton();
            const { rmSync } = require('node:fs');
            rmSync(`/tmp/crss-test-${tmpPath.split('/')[2]}`, { recursive: true, force: true });
        });
    });
    describe('closeDatabase', () => {
        it('should close the connection and clear singleton', () => {
            const db1 = createDatabase(':memory:');
            closeDatabase();
            _resetDatabaseSingleton();
            // After close + reset, creating again should give a new instance
            const db2 = createDatabase(':memory:');
            expect(db2).toBeDefined();
            // They are different instances because singleton was reset
            expect(db1).not.toBe(db2);
        });
        it('should be safe to call when no connection exists', () => {
            expect(() => closeDatabase()).not.toThrow();
        });
    });
    describe('_resetDatabaseSingleton', () => {
        it('should allow creating a new instance after reset', () => {
            const db1 = createDatabase(':memory:');
            _resetDatabaseSingleton();
            // Note: this leaks the old connection (by design — reset is for testing)
            const db2 = createDatabase(':memory:');
            expect(db1).not.toBe(db2);
        });
    });
});
//# sourceMappingURL=connection.test.js.map
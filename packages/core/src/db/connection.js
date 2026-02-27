/**
 * SQLite database connection factory for Community RSS.
 *
 * Creates a `better-sqlite3` connection wrapped by Drizzle ORM.
 * Uses WAL mode for concurrent read performance, a singleton pattern
 * for connection reuse, and auto-applies Drizzle migrations on first connect.
 *
 * @since 0.4.0
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
/** Module-level singleton for the database connection. */
let _db = null;
let _raw = null;
/**
 * Path to the bundled Drizzle migration files.
 * Resolved relative to this source file so it works whether the package
 * is consumed via workspace symlink or from node_modules.
 */
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
/**
 * Creates (or returns the existing) Drizzle ORM database instance
 * backed by better-sqlite3.
 *
 * - Creates parent directories if they don't exist.
 * - Enables WAL mode for better concurrent read performance.
 * - Runs Drizzle migrations automatically on first connection.
 * - Uses a singleton pattern — subsequent calls with the same path
 *   return the same instance.
 *
 * @param dbPath - Path to the SQLite database file.
 *   Use `':memory:'` for in-memory databases (testing).
 * @returns Drizzle ORM database instance
 * @since 0.4.0
 */
export function createDatabase(dbPath) {
    if (_db)
        return _db;
    // Ensure parent directory exists (skip for in-memory)
    if (dbPath !== ':memory:') {
        const dir = dirname(dbPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    _raw = sqlite;
    _db = drizzle(sqlite);
    // Apply any pending migrations (idempotent — skips already-applied ones)
    migrate(_db, { migrationsFolder: MIGRATIONS_DIR });
    return _db;
}
/**
 * Closes the database connection and clears the singleton.
 *
 * Call this during graceful shutdown to release the SQLite file lock.
 *
 * @since 0.4.0
 */
export function closeDatabase() {
    if (_raw) {
        _raw.close();
        _raw = null;
    }
    _db = null;
}
/**
 * Resets the singleton reference (for testing only).
 *
 * This does NOT close the underlying connection — use `closeDatabase()`
 * for graceful shutdown.
 *
 * @internal
 */
export function _resetDatabaseSingleton() {
    _db = null;
    _raw = null;
}
//# sourceMappingURL=connection.js.map
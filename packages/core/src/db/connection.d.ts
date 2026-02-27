/**
 * SQLite database connection factory for Community RSS.
 *
 * Creates a `better-sqlite3` connection wrapped by Drizzle ORM.
 * Uses WAL mode for concurrent read performance, a singleton pattern
 * for connection reuse, and auto-applies Drizzle migrations on first connect.
 *
 * @since 0.4.0
 */
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
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
export declare function createDatabase(dbPath: string): BetterSQLite3Database;
/**
 * Closes the database connection and clears the singleton.
 *
 * Call this during graceful shutdown to release the SQLite file lock.
 *
 * @since 0.4.0
 */
export declare function closeDatabase(): void;
/**
 * Resets the singleton reference (for testing only).
 *
 * This does NOT close the underlying connection — use `closeDatabase()`
 * for graceful shutdown.
 *
 * @internal
 */
export declare function _resetDatabaseSingleton(): void;
//# sourceMappingURL=connection.d.ts.map
/**
 * SQLite database connection factory for Community RSS.
 *
 * Replaces the Cloudflare D1 binding with a standard `better-sqlite3`
 * connection wrapped by Drizzle ORM. Uses WAL mode for concurrent
 * read performance and a singleton pattern for connection reuse.
 *
 * @since 0.4.0
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

/** Module-level singleton for the database connection. */
let _db: BetterSQLite3Database | null = null;
let _raw: InstanceType<typeof Database> | null = null;

/**
 * Creates (or returns the existing) Drizzle ORM database instance
 * backed by better-sqlite3.
 *
 * - Creates parent directories if they don't exist.
 * - Enables WAL mode for better concurrent read performance.
 * - Uses a singleton pattern — subsequent calls with the same path
 *   return the same instance.
 *
 * @param dbPath - Path to the SQLite database file.
 *   Use `':memory:'` for in-memory databases (testing).
 * @returns Drizzle ORM database instance
 * @since 0.4.0
 */
export function createDatabase(dbPath: string): BetterSQLite3Database {
  if (_db) return _db;

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
  return _db;
}

/**
 * Closes the database connection and clears the singleton.
 *
 * Call this during graceful shutdown to release the SQLite file lock.
 *
 * @since 0.4.0
 */
export function closeDatabase(): void {
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
export function _resetDatabaseSingleton(): void {
  _db = null;
  _raw = null;
}

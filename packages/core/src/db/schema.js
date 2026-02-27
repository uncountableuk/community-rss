/**
 * Drizzle ORM schema — single source of truth for the Community RSS database.
 *
 * SQL migrations are generated via `npx drizzle-kit generate` — never hand-written.
 * This file defines all tables, indexes, and relationships for the SQLite database.
 *
 * @since 0.1.0
 */
import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
// ─── Timestamps ──────────────────────────────────────────────
const timestamps = {
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
};
// ─── Users ───────────────────────────────────────────────────
/**
 * Users table — covers all tiers: guest, registered, verified, admin.
 * Guests have `isGuest = true` and nullable email.
 * @since 0.1.0
 */
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email'),
    isGuest: integer('is_guest', { mode: 'boolean' }).notNull().default(false),
    /** User privilege level: 'user' | 'admin' | 'system'. @since 0.3.0 */
    role: text('role').notNull().default('user'),
    name: text('name'),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    /** Timestamp when user accepted Terms of Service. @since 0.3.0 */
    termsAcceptedAt: integer('terms_accepted_at', { mode: 'timestamp' }),
    /** Pending new email address awaiting verification. @since 0.3.0 */
    pendingEmail: text('pending_email'),
    /** One-time token used to confirm a pending email change. @since 0.3.0 */
    pendingEmailToken: text('pending_email_token'),
    /** Expiry for the pending email change token. @since 0.3.0 */
    pendingEmailExpiresAt: integer('pending_email_expires_at', { mode: 'timestamp' }),
    ...timestamps,
}, (table) => [
    uniqueIndex('users_email_idx').on(table.email),
]);
// ─── Pending Sign-Ups ───────────────────────────────────────
/**
 * Pending sign-ups — temporary storage between sign-up form submission
 * and magic-link verification. Keyed by email. Cleaned up after
 * successful verification or expiry.
 * @since 0.3.0
 */
export const pendingSignups = sqliteTable('pending_signups', {
    email: text('email').primaryKey(),
    name: text('name').notNull(),
    termsAcceptedAt: integer('terms_accepted_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
});
// ─── better-auth tables ──────────────────────────────────────
/**
 * Sessions table — managed by better-auth.
 * @since 0.1.0
 */
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    ...timestamps,
});
/**
 * Accounts table — managed by better-auth.
 * Links authentication providers to users.
 * @since 0.1.0
 */
export const accounts = sqliteTable('accounts', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
    scope: text('scope'),
    idToken: text('id_token'),
    password: text('password'),
    ...timestamps,
});
/**
 * Verifications table — managed by better-auth.
 * Stores pending email verification tokens (magic links).
 * @since 0.1.0
 */
export const verifications = sqliteTable('verifications', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    ...timestamps,
});
// ─── Domain Verification ─────────────────────────────────────
/**
 * Verified domains — tracks which domains authors have proven ownership of.
 * Subsequent feeds from the same root domain bypass verification.
 * @since 0.1.0
 */
export const verifiedDomains = sqliteTable('verified_domains', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    domainName: text('domain_name').notNull(),
    verifiedAt: integer('verified_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
    uniqueIndex('verified_domains_user_domain_idx').on(table.userId, table.domainName),
]);
// ─── Feeds ───────────────────────────────────────────────────
/**
 * Feeds table — RSS feeds submitted by verified authors.
 * @since 0.1.0
 */
export const feeds = sqliteTable('feeds', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    feedUrl: text('feed_url').notNull(),
    title: text('title'),
    description: text('description'),
    category: text('category'),
    status: text('status').notNull().default('pending'),
    consentAt: integer('consent_at', { mode: 'timestamp' }),
    ...timestamps,
}, (table) => [
    index('feeds_user_id_idx').on(table.userId),
    index('feeds_status_idx').on(table.status),
]);
// ─── Articles ────────────────────────────────────────────────
/**
 * Articles table — synced from FreshRSS via background workers.
 * `freshrssItemId` is the idempotency key — UNIQUE index prevents
 * duplicate insertion across repeated Cron runs.
 * @since 0.1.0
 */
export const articles = sqliteTable('articles', {
    id: text('id').primaryKey(),
    feedId: text('feed_id')
        .notNull()
        .references(() => feeds.id, { onDelete: 'cascade' }),
    freshrssItemId: text('freshrss_item_id').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    summary: text('summary'),
    originalLink: text('original_link'),
    authorName: text('author_name'),
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    syncedAt: integer('synced_at', { mode: 'timestamp' }).notNull(),
    mediaPending: integer('media_pending', { mode: 'boolean' }).notNull().default(true),
}, (table) => [
    uniqueIndex('articles_freshrss_item_id_idx').on(table.freshrssItemId),
    index('articles_feed_id_idx').on(table.feedId),
    index('articles_published_at_idx').on(table.publishedAt),
]);
// ─── Followers ───────────────────────────────────────────────
/**
 * Followers join table — user follows another user (author).
 * Composite primary key prevents duplicate follow relationships.
 * @since 0.1.0
 */
export const followers = sqliteTable('followers', {
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    targetUserId: text('target_user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
}, (table) => [
    primaryKey({ columns: [table.userId, table.targetUserId] }),
]);
// ─── Interactions ────────────────────────────────────────────
/**
 * Interactions table — hearts and stars on articles.
 * Composite primary key enforces one interaction per type per user per article.
 * @since 0.1.0
 */
export const interactions = sqliteTable('interactions', {
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    articleId: text('article_id')
        .notNull()
        .references(() => articles.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'heart' | 'star'
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
}, (table) => [
    primaryKey({ columns: [table.userId, table.articleId, table.type] }),
    index('interactions_article_id_idx').on(table.articleId),
]);
// ─── Comments ────────────────────────────────────────────────
/**
 * Comments table — user comments on articles, moderated by authors.
 * @since 0.1.0
 */
export const comments = sqliteTable('comments', {
    id: text('id').primaryKey(),
    articleId: text('article_id')
        .notNull()
        .references(() => articles.id, { onDelete: 'cascade' }),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
}, (table) => [
    index('comments_article_id_idx').on(table.articleId),
    index('comments_user_id_idx').on(table.userId),
    index('comments_status_idx').on(table.status),
]);
// ─── Media Cache ─────────────────────────────────────────────
/**
 * Media cache table — tracks cached images for RSS articles.
 * Maps original external URLs to R2/S3 storage keys.
 * @since 0.1.0
 */
export const mediaCache = sqliteTable('media_cache', {
    id: text('id').primaryKey(),
    articleId: text('article_id')
        .notNull()
        .references(() => articles.id, { onDelete: 'cascade' }),
    originalUrl: text('original_url').notNull(),
    storageKey: text('storage_key').notNull(),
    cachedAt: integer('cached_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
}, (table) => [
    index('media_cache_article_id_idx').on(table.articleId),
    uniqueIndex('media_cache_original_url_idx').on(table.originalUrl),
]);
//# sourceMappingURL=schema.js.map
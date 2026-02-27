/**
 * Admin feed management utilities.
 *
 * Admins can add feeds without domain verification — their admin
 * privilege is sufficient authorization. Feeds are created with
 * `status: 'approved'` immediately.
 *
 * @since 0.3.0
 */
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
/**
 * Validates that a URL points to a reachable RSS/Atom feed.
 *
 * Performs a fetch and checks that:
 * 1. The URL is reachable (HTTP 200)
 * 2. The response contains XML/RSS/Atom content (content-type or body check)
 *
 * @param url - The feed URL to validate
 * @returns Object with `valid` boolean and optional `error` message
 * @since 0.3.0
 */
export declare function validateFeedUrl(url: string): Promise<{
    valid: boolean;
    title?: string;
    error?: string;
}>;
/**
 * Options for submitting an admin feed.
 * @since 0.3.0
 */
export interface SubmitAdminFeedOptions {
    /** Override the auto-detected feed title. */
    title?: string;
    /** Category/tag for the feed. */
    category?: string;
}
/**
 * Submits a feed as an admin user.
 *
 * Validates the URL, then creates an approved feed owned by the admin.
 * No domain verification is required — admin privilege is sufficient.
 *
 * @param db - Drizzle database instance
 * @param adminUserId - The admin user's ID
 * @param feedUrl - The RSS/Atom feed URL
 * @param options - Optional title and category overrides
 * @returns The created/updated feed record
 * @throws Error if the feed URL is invalid
 * @since 0.3.0
 */
export declare function submitAdminFeed(db: BetterSQLite3Database, adminUserId: string, feedUrl: string, options?: SubmitAdminFeedOptions): Promise<{
    status: string;
    title: string | null;
    id: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    feedUrl: string;
    category: string | null;
    consentAt: Date | null;
}>;
//# sourceMappingURL=admin-feeds.d.ts.map
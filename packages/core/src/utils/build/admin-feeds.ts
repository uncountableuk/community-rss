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
import { upsertFeed } from '../../db/queries/feeds';

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
export async function validateFeedUrl(
    url: string,
): Promise<{ valid: boolean; title?: string; error?: string }> {
    // Basic URL format check
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return { valid: false, error: 'Invalid URL format' };
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: 'URL must use http or https protocol' };
    }

    try {
        const response = await fetch(url, {
            headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            return { valid: false, error: `URL returned HTTP ${response.status}` };
        }

        const contentType = response.headers.get('content-type') || '';
        const body = await response.text();

        // Check content-type or body for XML/RSS/Atom markers
        const isXmlContentType = /xml|rss|atom/i.test(contentType);
        const hasXmlMarkers = /<(rss|feed|channel)\b/i.test(body);

        if (!isXmlContentType && !hasXmlMarkers) {
            return { valid: false, error: 'URL does not appear to be an RSS or Atom feed' };
        }

        // Try to extract title from feed
        const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : undefined;

        return { valid: true, title };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { valid: false, error: `Failed to fetch feed: ${message}` };
    }
}

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
export async function submitAdminFeed(
    db: BetterSQLite3Database,
    adminUserId: string,
    feedUrl: string,
    options?: SubmitAdminFeedOptions,
) {
    // Validate the feed URL
    const validation = await validateFeedUrl(feedUrl);
    if (!validation.valid) {
        throw new Error(validation.error || 'Invalid feed URL');
    }

    // Generate a deterministic ID from the feed URL to enable deduplication
    const feedId = `feed-${hashString(feedUrl)}`;

    const result = await upsertFeed(db, {
        id: feedId,
        userId: adminUserId,
        feedUrl,
        title: options?.title || validation.title || feedUrl,
        category: options?.category,
        status: 'approved',
    });

    return result[0];
}

/**
 * Simple string hash for generating feed IDs from URLs.
 * Uses a basic djb2 algorithm — sufficient for deduplication.
 *
 * @param str - The string to hash
 * @returns A hex string hash
 */
function hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash).toString(16);
}

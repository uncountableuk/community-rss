/**
 * E2E test authentication helpers.
 *
 * Provides helpers for authenticating as a test user in Playwright
 * tests. Supports magic link interception via the Mailpit API.
 *
 * @since 0.5.0
 */

import type { Page } from '@playwright/test';

/** Mailpit API base URL (Docker Compose default). */
const MAILPIT_API = process.env.MAILPIT_API_URL ?? 'http://localhost:8025/api';

/**
 * Extracts the most recent magic link URL from Mailpit.
 *
 * Queries the Mailpit API for the latest email sent to the given
 * address and extracts the magic link URL from the HTML body.
 *
 * @param email - The email address to search for
 * @returns The magic link URL, or null if not found
 * @since 0.5.0
 */
export async function getMagicLinkFromMailpit(
    email: string,
): Promise<string | null> {
    try {
        // Search for messages to the test email
        const searchRes = await fetch(
            `${MAILPIT_API}/v1/search?query=to:${encodeURIComponent(email)}`,
        );
        if (!searchRes.ok) return null;

        const searchData = (await searchRes.json()) as {
            messages?: { ID: string }[];
        };
        const messages = searchData.messages;
        if (!messages || messages.length === 0) return null;

        // Get the most recent message
        const messageId = messages[0].ID;
        const msgRes = await fetch(`${MAILPIT_API}/v1/message/${messageId}`);
        if (!msgRes.ok) return null;

        const msgData = (await msgRes.json()) as { HTML?: string; Text?: string };
        const body = msgData.HTML ?? msgData.Text ?? '';

        // Extract the magic link URL from the email body
        const magicLinkMatch = body.match(/href="([^"]*\/api\/auth\/magic-link\/verify[^"]*)"/);
        if (magicLinkMatch?.[1]) {
            return magicLinkMatch[1];
        }

        // Fallback: look for any verification-like URL
        const verifyMatch = body.match(/href="([^"]*verify[^"]*)"/);
        return verifyMatch?.[1] ?? null;
    } catch {
        return null;
    }
}

/**
 * Deletes all messages in Mailpit to ensure a clean state.
 *
 * @since 0.5.0
 */
export async function clearMailpit(): Promise<void> {
    try {
        await fetch(`${MAILPIT_API}/v1/messages`, { method: 'DELETE' });
    } catch {
        // Mailpit may not be running — non-fatal
    }
}

/**
 * Performs a full sign-in flow for a test user via magic link.
 *
 * 1. Navigates to sign-in page
 * 2. Enters email and submits
 * 3. Retrieves magic link from Mailpit
 * 4. Navigates to the magic link URL
 * 5. Returns the authenticated page
 *
 * @param page - Playwright Page instance
 * @param email - Email address to sign in with
 * @returns true if sign-in succeeded
 * @since 0.5.0
 */
export async function signInWithMagicLink(
    page: Page,
    email: string,
): Promise<boolean> {
    await clearMailpit();

    // Navigate to sign-in page
    await page.goto('/auth/signin');
    await page.fill('#crss-email-input', email);
    await page.click('#crss-submit-btn');

    // Wait for the success message
    await page.waitForSelector('#crss-success-msg', {
        state: 'visible',
        timeout: 10_000,
    });

    // Retrieve magic link from Mailpit
    // Give the email a moment to arrive
    await page.waitForTimeout(1_000);
    const magicLink = await getMagicLinkFromMailpit(email);
    if (!magicLink) return false;

    // Navigate to the magic link
    await page.goto(magicLink);

    // Verify we're authenticated (should redirect to profile or home)
    await page.waitForURL(/\/(profile|$)/, { timeout: 10_000 });
    return true;
}

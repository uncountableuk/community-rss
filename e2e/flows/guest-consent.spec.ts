import { test, expect } from '@playwright/test';

/**
 * Guest consent flow E2E test.
 *
 * Tests the consent modal appearance and acceptance for
 * anonymous users interacting with content.
 *
 * @since 0.5.0
 */
test.describe('Guest Consent Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Clear any existing guest cookie
        await page.context().clearCookies();
        await page.goto('/');
    });

    test('consent modal overlay is initially hidden', async ({ page }) => {
        const overlay = page.locator('#crss-consent-overlay');
        // The consent modal should be in the DOM but hidden
        if ((await overlay.count()) > 0) {
            await expect(overlay).toBeHidden();
        }
    });

    test('consent modal has accept and decline buttons', async ({ page }) => {
        const overlay = page.locator('#crss-consent-overlay');
        if ((await overlay.count()) === 0) {
            test.skip();
            return;
        }

        // Show the modal via the framework's API (attaches handlers)
        await page.evaluate(() => {
            (window as any).__crssShowConsentModal();
        });

        await expect(page.locator('#crss-consent-accept')).toBeVisible();
        await expect(page.locator('#crss-consent-decline')).toBeVisible();
    });

    test('accepting consent sets guest cookie', async ({ page }) => {
        const overlay = page.locator('#crss-consent-overlay');
        if ((await overlay.count()) === 0) {
            test.skip();
            return;
        }

        // Use the framework's showConsentModal to properly attach handlers
        await page.evaluate(() => {
            (window as any).__crssShowConsentModal();
        });

        await expect(overlay).toBeVisible({ timeout: 2_000 });
        await page.click('#crss-consent-accept');

        // Wait for the async accept handler (imports guest module + sets cookie)
        await page.waitForTimeout(2_000);

        const cookies = await page.context().cookies();
        const guestCookie = cookies.find((c) => c.name === 'crss_guest');
        expect(guestCookie).toBeDefined();
        expect(guestCookie?.value).toBeTruthy();
    });

    test('declining consent closes modal without cookie', async ({ page }) => {
        const overlay = page.locator('#crss-consent-overlay');
        if ((await overlay.count()) === 0) {
            test.skip();
            return;
        }

        // Use the framework's showConsentModal to properly attach handlers
        await page.evaluate(() => {
            (window as any).__crssShowConsentModal();
        });

        await expect(overlay).toBeVisible({ timeout: 2_000 });
        await page.click('#crss-consent-decline');
        await page.waitForTimeout(500);

        // Modal should be hidden
        await expect(overlay).toBeHidden();

        // No guest cookie should be set
        const cookies = await page.context().cookies();
        const guestCookie = cookies.find((c) => c.name === 'crss_guest');
        expect(guestCookie).toBeUndefined();
    });
});

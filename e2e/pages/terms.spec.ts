import { test, expect } from '@playwright/test';

/**
 * Terms of Service page E2E tests.
 *
 * Verifies the terms page renders with content and is
 * accessible from the sign-up form.
 *
 * @since 0.5.0
 */
test.describe('Terms Page', () => {
    test('terms page renders with content', async ({ page }) => {
        await page.goto('/terms');
        await expect(page.locator('body')).toBeVisible();

        // Should have some text content in the main area
        const mainText = await page.locator('main').textContent();
        expect(mainText?.length).toBeGreaterThan(0);
    });

    test('accessible from sign-up form link', async ({ page }) => {
        await page.goto('/auth/signup');

        const termsLink = page.locator('a[href="/terms"]');
        await expect(termsLink).toBeVisible();

        // Click should open in new tab (target="_blank")
        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            termsLink.click(),
        ]);

        await newPage.waitForLoadState();
        expect(newPage.url()).toContain('/terms');
        await newPage.close();
    });
});

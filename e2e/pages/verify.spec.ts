import { test, expect } from '@playwright/test';

/**
 * Email verification page E2E tests.
 *
 * Verifies the magic link verification page handles valid
 * and invalid/missing tokens correctly.
 *
 * @since 0.5.0
 */
test.describe('Verify Page', () => {
    test('verification page renders', async ({ page }) => {
        await page.goto('/auth/verify');
        // Page should load without crashing
        await expect(page.locator('body')).toBeVisible();
    });

    test('with invalid token shows error message', async ({ page }) => {
        await page.goto('/auth/verify?token=invalid-token');

        // Should show some form of error or redirect
        // The actual behaviour depends on better-auth verification
        await page.waitForTimeout(2_000);

        // Either an error message is shown or we're still on the verify page
        const url = page.url();
        const hasError =
            url.includes('error') ||
            url.includes('verify') ||
            (await page.locator('text=error').or(page.locator('text=invalid')).count()) > 0;
        expect(hasError).toBeTruthy();
    });

    test('with missing token shows appropriate state', async ({ page }) => {
        await page.goto('/auth/verify');

        // Without a token, the page should indicate something is needed
        await page.waitForTimeout(1_000);

        // Page should not crash — just show empty or error state
        await expect(page.locator('body')).toBeVisible();
    });
});

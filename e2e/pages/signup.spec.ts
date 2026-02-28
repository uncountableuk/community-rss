import { test, expect } from '@playwright/test';

/**
 * Sign-up page E2E tests.
 *
 * Verifies the registration form renders correctly, handles
 * pre-filled email from query params, and validates required fields.
 *
 * @since 0.5.0
 */
test.describe('Sign Up Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/signup');
    });

    test('sign-up form renders with all fields', async ({ page }) => {
        await expect(page.locator('#crss-signup-email')).toBeVisible();
        await expect(page.locator('#crss-signup-name')).toBeVisible();
        await expect(page.locator('#crss-signup-terms')).toBeVisible();
        await expect(page.locator('#crss-signup-btn')).toBeVisible();
    });

    test('email field is pre-filled from query parameter', async ({ page }) => {
        await page.goto('/auth/signup?email=prefilled@example.com');

        const emailInput = page.locator('#crss-signup-email');
        await expect(emailInput).toHaveValue('prefilled@example.com');
    });

    test('terms checkbox is required', async ({ page }) => {
        const termsCheckbox = page.locator('#crss-signup-terms');
        const isRequired = await termsCheckbox.evaluate(
            (el: HTMLInputElement) => el.required,
        );
        expect(isRequired).toBe(true);
    });

    test('submitting valid data shows confirmation', async ({ page }) => {
        await page.fill('#crss-signup-email', 'newuser@example.com');
        await page.fill('#crss-signup-name', 'New User');
        await page.check('#crss-signup-terms');
        await page.click('#crss-signup-btn');

        // Should show confirmation panel
        const confirm = page.locator('#crss-signup-confirm');
        await expect(confirm).toBeVisible({ timeout: 10_000 });
    });

    test('footer links to sign-in page', async ({ page }) => {
        const signInLink = page.locator('.crss-form-footer a[href="/auth/signin"]');
        await expect(signInLink).toBeVisible();
        await expect(signInLink).toHaveText('Sign in');
    });

    test('terms link opens in new tab', async ({ page }) => {
        const termsLink = page.locator('a[href="/terms"]');
        await expect(termsLink).toBeVisible();
        await expect(termsLink).toHaveAttribute('target', '_blank');
    });
});

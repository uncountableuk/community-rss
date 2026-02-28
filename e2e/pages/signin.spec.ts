import { test, expect } from '@playwright/test';

/**
 * Sign-in page E2E tests.
 *
 * Verifies the magic link sign-in form renders and processes
 * email submissions correctly.
 *
 * @since 0.5.0
 */
test.describe('Sign In Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/signin');
    });

    test('sign-in form renders with email input', async ({ page }) => {
        const emailInput = page.locator('#crss-email-input');
        await expect(emailInput).toBeVisible();
        await expect(emailInput).toHaveAttribute('type', 'email');
        await expect(emailInput).toHaveAttribute('required', '');
    });

    test('submit button is present with correct text', async ({ page }) => {
        const submitBtn = page.locator('#crss-submit-btn');
        await expect(submitBtn).toBeVisible();
        await expect(submitBtn).toHaveText('Send Magic Link');
    });

    test('submitting a valid email shows success or redirects to signup', async ({ page }) => {
        const emailInput = page.locator('#crss-email-input');
        const submitBtn = page.locator('#crss-submit-btn');

        await emailInput.fill('test@example.com');
        await submitBtn.click();

        // Should either show success message (existing user) or redirect to signup (new user)
        await expect(
            page.locator('#crss-success-msg').or(page.locator('.crss-signup-form')),
        ).toBeVisible({ timeout: 10_000 });
    });

    test('form requires email input', async ({ page }) => {
        const submitBtn = page.locator('#crss-submit-btn');
        await submitBtn.click();

        // Browser native validation should prevent submission
        const emailInput = page.locator('#crss-email-input');
        const isValid = await emailInput.evaluate(
            (el: HTMLInputElement) => el.validity.valid,
        );
        expect(isValid).toBe(false);
    });
});

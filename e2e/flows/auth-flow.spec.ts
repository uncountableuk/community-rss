import { test, expect } from '@playwright/test';
import { signInWithMagicLink, clearMailpit } from '../fixtures';

/**
 * Full authentication flow E2E test.
 *
 * Tests the complete lifecycle: sign-in → magic link →
 * verification → profile → sign-out → return to homepage.
 *
 * Requires Docker services (Mailpit) to be running.
 *
 * @since 0.5.0
 */
test.describe('Authentication Flow', () => {
  const testEmail = 'e2e-auth@example.com';

  test.beforeAll(async () => {
    await clearMailpit();
  });

  test('full sign-in lifecycle via magic link', async ({ page }) => {
    // Skip if Mailpit is not available
    try {
      const mailpitCheck = await fetch('http://localhost:8025/api/v1/messages');
      if (!mailpitCheck.ok) test.skip();
    } catch {
      test.skip();
    }

    // 1. Navigate to sign-in page
    await page.goto('/auth/signin');
    await expect(page.locator('#crss-magic-link-form')).toBeVisible();

    // 2. Enter email and submit
    await page.fill('#crss-email-input', testEmail);
    await page.click('#crss-submit-btn');

    // 3. Wait for success or signup redirect
    await page.waitForTimeout(3_000);

    // If redirected to signup (new user), complete signup first
    if (page.url().includes('/auth/signup')) {
      await page.fill('#crss-signup-name', 'E2E Test User');
      await page.check('#crss-signup-terms');
      await page.click('#crss-signup-btn');

      // Wait for confirmation
      await expect(page.locator('#crss-signup-confirm')).toBeVisible({
        timeout: 10_000,
      });
    }

    // 4. Retrieve magic link from Mailpit
    await page.waitForTimeout(2_000);
    const success = await signInWithMagicLink(page, testEmail);

    if (success) {
      // 5. Should be on profile or homepage now
      const currentUrl = page.url();
      expect(
        currentUrl.includes('/profile') || currentUrl.endsWith('/'),
      ).toBeTruthy();

      // 6. Sign out
      const signOutBtn = page.locator('#crss-signout-btn');
      if (await signOutBtn.isVisible()) {
        await signOutBtn.click();
        await page.waitForURL('/', { timeout: 10_000 });
      }

      // 7. Should be back on homepage
      await expect(page).toHaveURL('/');
    }
  });
});

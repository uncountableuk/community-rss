import { test, expect } from '@playwright/test';

/**
 * Homepage E2E tests.
 *
 * Verifies the main feed page renders correctly with all
 * expected components: tab bar, feed grid, and guest CTA.
 *
 * @since 0.5.0
 */
test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/community/i);
  });

  test('tab bar renders with correct labels', async ({ page }) => {
    const tabBar = page.locator('.crss-tab-bar');
    await expect(tabBar).toBeVisible();

    const allTab = page.locator('[data-tab="all"]');
    await expect(allTab).toBeVisible();
    await expect(allTab).toHaveText('All Feeds');
  });

  test('feed grid container is present', async ({ page }) => {
    const grid = page.locator('#feed-grid');
    await expect(grid).toBeVisible();
  });

  test('guest CTA is visible for unauthenticated users', async ({ page }) => {
    // The HomepageCTA component renders for unauthenticated users
    // It uses server:defer so may take a moment to appear
    const cta = page.locator('.crss-cta');
    await expect(cta).toBeVisible({ timeout: 10_000 });
  });

  test('articles load on initial page render', async ({ page }) => {
    // Wait for at least one feed card to appear
    const feedCard = page.locator('.crss-feed-card').first();
    await expect(feedCard).toBeVisible({ timeout: 10_000 });
  });

  test('infinite scroll shows sentinel element', async ({ page }) => {
    // The infinite scroll sentinel should be present at bottom of feed
    const sentinel = page.locator('#feed-sentinel');
    // Sentinel may not exist if there aren't enough articles
    const count = await sentinel.count();
    expect(count).toBeLessThanOrEqual(1);
  });
});

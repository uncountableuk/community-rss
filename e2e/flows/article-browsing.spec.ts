import { test, expect } from '@playwright/test';

/**
 * Article browsing flow E2E test.
 *
 * Tests the core reading experience: homepage → article list →
 * modal open → navigation → close → tab switch.
 *
 * @since 0.5.0
 */
test.describe('Article Browsing Flow', () => {
    test('load homepage and browse articles', async ({ page }) => {
        // 1. Load homepage
        await page.goto('/');
        await expect(page.locator('#feed-grid')).toBeVisible();

        // 2. Wait for articles to appear
        const firstCard = page.locator('.crss-feed-card').first();
        await expect(firstCard).toBeVisible({ timeout: 10_000 });

        // 3. Click first article — navigates to /article/[id]
        const firstLink = page.locator('.crss-feed-card__link').first();
        await firstLink.click();

        // 4. URL should update to article page
        await expect(page).toHaveURL(/\/article\//, { timeout: 5_000 });

        // 5. Navigate back to homepage
        await page.goBack();
        await expect(page).toHaveURL('/', { timeout: 5_000 });

        // 6. Feed grid should still be visible
        await expect(page.locator('#feed-grid')).toBeVisible();
    });

    test('tab bar shows correct default tabs', async ({ page }) => {
        await page.goto('/');

        const tabBar = page.locator('.crss-tab-bar');
        await expect(tabBar).toBeVisible();

        // "All Feeds" tab should be active
        const allTab = page.locator('[data-tab="all"]');
        await expect(allTab).toHaveAttribute('aria-selected', 'true');

        // Other tabs should be disabled
        const followingTab = page.locator('[data-tab="following"]');
        await expect(followingTab).toBeDisabled();
    });

    test('article cards have expected structure', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.crss-feed-card', { timeout: 10_000 });

        const firstCard = page.locator('.crss-feed-card').first();

        // Card should have title
        const cardTitle = firstCard.locator('.crss-feed-card__title');
        await expect(cardTitle).toBeVisible();
        await expect(cardTitle).not.toBeEmpty();

        // Card should have interaction counts
        const hearts = firstCard.locator('.crss-feed-card__hearts');
        await expect(hearts).toBeVisible();
    });
});

import { test, expect } from '@playwright/test';

/**
 * Article modal E2E tests.
 *
 * Verifies article card interaction behaviour. Currently, cards navigate
 * to /article/[id] via standard links. When the client-side modal
 * integration (initModalHandlers) is wired up, modal-specific tests
 * should be un-skipped.
 *
 * @since 0.5.0
 */
test.describe('Article Modal', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for articles to load via client-side fetch
        await page.waitForSelector('.crss-feed-card', { timeout: 10_000 });
    });

    test('clicking an article card navigates to article page', async ({ page }) => {
        const firstCard = page.locator('.crss-feed-card__link').first();
        await firstCard.click();

        // Card links navigate to /article/[id]
        await expect(page).toHaveURL(/\/article\//, { timeout: 5_000 });
    });

    test('URL updates to /article/[id]', async ({ page }) => {
        const firstCard = page.locator('.crss-feed-card__link').first();
        await firstCard.click();

        await expect(page).toHaveURL(/\/article\//, { timeout: 5_000 });
    });

    // Modal-specific tests — skipped until initModalHandlers() is
    // integrated on the homepage script. See utils/client/modal.ts.
    test.skip('modal displays article content', async ({ page }) => {
        const firstCard = page.locator('.crss-feed-card__link').first();
        await firstCard.click();

        const title = page.locator('#modal-title');
        await expect(title).toBeVisible({ timeout: 5_000 });
        await expect(title).not.toBeEmpty();
    });

    test.skip('close button dismisses modal', async ({ page }) => {
        const firstCard = page.locator('.crss-feed-card__link').first();
        await firstCard.click();

        await page.waitForSelector('#article-modal', { state: 'visible' });
        const closeBtn = page.locator('[data-modal-close]');
        await closeBtn.click();

        const modal = page.locator('#article-modal');
        await expect(modal).not.toBeVisible({ timeout: 5_000 });
    });

    test.skip('next/previous navigation buttons are present', async ({ page }) => {
        const firstCard = page.locator('.crss-feed-card__link').first();
        await firstCard.click();

        await page.waitForSelector('#article-modal', { state: 'visible' });

        const prevBtn = page.locator('[data-modal-prev]');
        const nextBtn = page.locator('[data-modal-next]');
        await expect(prevBtn).toBeVisible();
        await expect(nextBtn).toBeVisible();
    });
});

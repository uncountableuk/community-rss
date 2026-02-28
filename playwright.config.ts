import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for the Community RSS playground.
 *
 * Prerequisites:
 *   1. Scaffold the playground: `npm run reset:playground`
 *   2. Start Docker services: `docker compose up -d` (from playground/)
 *   3. Tests auto-start the dev server (see webServer below)
 *
 * @see https://playwright.dev/docs/test-configuration
 * @since 0.5.0
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }]],

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev -w playground',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});

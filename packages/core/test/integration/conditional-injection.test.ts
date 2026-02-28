import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExistsSync = vi.hoisted(() => vi.fn());

// Mock fs to control existsSync
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: mockExistsSync,
    readdirSync: actual.readdirSync,
    readFileSync: actual.readFileSync,
  };
});

// Mock scheduler and database modules imported by integration.ts
vi.mock('../../src/utils/build/scheduler', () => ({
  startScheduler: vi.fn(),
  stopScheduler: vi.fn(),
}));
vi.mock('../../src/db/connection', () => ({
  createDatabase: vi.fn().mockReturnValue({}),
  closeDatabase: vi.fn(),
}));

import { createIntegration } from '../../src/integration';

/** Helper to invoke setup hook and collect injected routes */
function invokeSetup(
  integration: ReturnType<typeof createIntegration>,
  rootUrl = 'file:///test-project/',
) {
  const injectedRoutes: Array<{ pattern: string; entrypoint: string }> = [];
  const logs: string[] = [];

  const setupHook = integration.hooks['astro:config:setup'] as (params: any) => void;
  setupHook({
    injectRoute: (route: { pattern: string; entrypoint: string }) => {
      injectedRoutes.push(route);
    },
    addMiddleware: vi.fn(),
    injectScript: vi.fn(),
    updateConfig: vi.fn(),
    config: { root: new URL(rootUrl) },
    logger: {
      info: (msg: string) => logs.push(msg),
      warn: vi.fn(),
    },
  });

  return { injectedRoutes, logs };
}

const API_ROUTE_COUNT = 11;
const PAGE_PATTERNS = [
  '/',
  '/profile',
  '/terms',
  '/article/[id]',
  '/auth/signin',
  '/auth/signup',
  '/auth/verify',
  '/auth/verify-email-change',
];

describe('Conditional Page Injection', () => {
  beforeEach(() => {
    mockExistsSync.mockReset();
  });

  it('should inject all 8 page routes when no developer files exist', () => {
    // existsSync returns false for everything (no developer overrides)
    mockExistsSync.mockReturnValue(false);

    const integration = createIntegration();
    const { injectedRoutes } = invokeSetup(integration);

    const apiRoutes = injectedRoutes.filter((r) => r.pattern.startsWith('/api'));
    const pageRoutes = injectedRoutes.filter((r) => !r.pattern.startsWith('/api'));

    expect(apiRoutes).toHaveLength(API_ROUTE_COUNT);
    expect(pageRoutes).toHaveLength(PAGE_PATTERNS.length);

    for (const pattern of PAGE_PATTERNS) {
      expect(
        pageRoutes.some((r) => r.pattern === pattern),
        `Expected page route ${pattern} to be injected`,
      ).toBe(true);
    }
  });

  it('should skip page injection when developer file exists', () => {
    // existsSync returns true for everything (all developer overrides exist)
    mockExistsSync.mockReturnValue(true);

    const integration = createIntegration();
    const { injectedRoutes } = invokeSetup(integration);

    const pageRoutes = injectedRoutes.filter((r) => !r.pattern.startsWith('/api'));
    expect(pageRoutes).toHaveLength(0);
  });

  it('should log skip message for each developer override', () => {
    mockExistsSync.mockReturnValue(true);

    const integration = createIntegration();
    const { logs } = invokeSetup(integration);

    const skipLogs = logs.filter((l) => l.includes('Skipping'));
    expect(skipLogs).toHaveLength(PAGE_PATTERNS.length);
  });

  it('should selectively inject only missing pages', () => {
    // Only /profile and /auth/signin exist as developer files
    mockExistsSync.mockImplementation((pathArg: any) => {
      const path = typeof pathArg === 'string' ? pathArg : pathArg.pathname || String(pathArg);
      return path.includes('profile.astro') || path.includes('auth/signin.astro');
    });

    const integration = createIntegration();
    const { injectedRoutes } = invokeSetup(integration);

    const pageRoutes = injectedRoutes.filter((r) => !r.pattern.startsWith('/api'));
    const pagePatterns = pageRoutes.map((r) => r.pattern);

    // Profile and signin should NOT be injected
    expect(pagePatterns).not.toContain('/profile');
    expect(pagePatterns).not.toContain('/auth/signin');

    // All other pages should be injected
    expect(pagePatterns).toContain('/');
    expect(pagePatterns).toContain('/terms');
    expect(pagePatterns).toContain('/article/[id]');
    expect(pagePatterns).toContain('/auth/signup');
    expect(pagePatterns).toContain('/auth/verify');
    expect(pagePatterns).toContain('/auth/verify-email-change');
  });

  it('should always inject API routes regardless of existsSync', () => {
    mockExistsSync.mockReturnValue(true);

    const integration = createIntegration();
    const { injectedRoutes } = invokeSetup(integration);

    const apiRoutes = injectedRoutes.filter((r) => r.pattern.startsWith('/api'));
    expect(apiRoutes).toHaveLength(API_ROUTE_COUNT);

    expect(apiRoutes.map((r) => r.pattern)).toContain('/api/v1/health');
    expect(apiRoutes.map((r) => r.pattern)).toContain('/api/v1/articles');
    expect(apiRoutes.map((r) => r.pattern)).toContain('/api/auth/[...all]');
  });

  it('should point page entrypoints to package src/pages/', () => {
    mockExistsSync.mockReturnValue(false);

    const integration = createIntegration();
    const { injectedRoutes } = invokeSetup(integration);

    const pageRoutes = injectedRoutes.filter((r) => !r.pattern.startsWith('/api'));
    for (const route of pageRoutes) {
      expect(route.entrypoint, `Entrypoint for ${route.pattern}`).toContain('/pages/');
      expect(route.entrypoint).toMatch(/\.astro$/);
    }
  });
});

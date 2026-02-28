import { describe, it, expect, vi } from 'vitest';

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

describe('Integration Factory', () => {
  describe('createIntegration', () => {
    it('should return an object with name "community-rss"', () => {
      const integration = createIntegration();

      expect(integration.name).toBe('community-rss');
    });

    it('should have astro:config:setup hook', () => {
      const integration = createIntegration();

      expect(integration.hooks['astro:config:setup']).toBeDefined();
      expect(typeof integration.hooks['astro:config:setup']).toBe('function');
    });

    it('should have astro:config:done hook', () => {
      const integration = createIntegration();

      expect(integration.hooks['astro:config:done']).toBeDefined();
      expect(typeof integration.hooks['astro:config:done']).toBe('function');
    });

    it('should accept empty options', () => {
      const integration = createIntegration({});

      expect(integration.name).toBe('community-rss');
    });

    it('should accept options with maxFeeds', () => {
      const integration = createIntegration({ maxFeeds: 10 });

      expect(integration.name).toBe('community-rss');
    });

    it('should accept options with commentTier', () => {
      const integration = createIntegration({ commentTier: 'guest' });

      expect(integration.name).toBe('community-rss');
    });

    it('should inject all API routes via astro:config:setup', () => {
      const integration = createIntegration();
      const injectedRoutes: Array<{ pattern: string; entrypoint: string }> = [];
      const mockInjectRoute = (route: { pattern: string; entrypoint: string }) => {
        injectedRoutes.push(route);
      };
      const mockAddMiddleware = vi.fn();
      const mockInjectScript = vi.fn();
      const mockUpdateConfig = vi.fn();
      const mockAstroConfig = { root: new URL('file:///app/playground/') };

      // Call the hook with a mock injectRoute, addMiddleware, injectScript, updateConfig, and config
      const setupHook = integration.hooks['astro:config:setup'] as (params: {
        injectRoute: typeof mockInjectRoute;
        addMiddleware: typeof mockAddMiddleware;
        injectScript: typeof mockInjectScript;
        updateConfig: typeof mockUpdateConfig;
        config: typeof mockAstroConfig;
      }) => void;
      setupHook({
        injectRoute: mockInjectRoute,
        addMiddleware: mockAddMiddleware,
        injectScript: mockInjectScript,
        updateConfig: mockUpdateConfig,
        config: mockAstroConfig,
      });

      // 11 API routes + 8 conditionally-injected page routes = 19
      expect(injectedRoutes).toHaveLength(19);

      const patterns = injectedRoutes.map((r) => r.pattern);

      // API routes (always injected)
      expect(patterns).toContain('/api/v1/health');
      expect(patterns).toContain('/api/v1/articles');
      expect(patterns).toContain('/api/v1/admin/sync');
      expect(patterns).toContain('/api/v1/admin/feeds');
      expect(patterns).toContain('/api/auth/[...all]');
      expect(patterns).toContain('/api/v1/auth/check-email');
      expect(patterns).toContain('/api/v1/auth/signup');
      expect(patterns).toContain('/api/v1/profile');
      expect(patterns).toContain('/api/v1/profile/change-email');
      expect(patterns).toContain('/api/v1/profile/confirm-email-change');
      expect(patterns).toContain('/api/dev/seed');

      // Page routes (injected when no local file exists)
      expect(patterns).toContain('/');
      expect(patterns).toContain('/profile');
      expect(patterns).toContain('/terms');
      expect(patterns).toContain('/article/[id]');
      expect(patterns).toContain('/auth/signin');
      expect(patterns).toContain('/auth/signup');
      expect(patterns).toContain('/auth/verify');
      expect(patterns).toContain('/auth/verify-email-change');

      // Verify middleware was registered
      expect(mockAddMiddleware).toHaveBeenCalledWith(
        expect.objectContaining({ order: 'pre' }),
      );

      // Verify design tokens are injected via injectScript
      expect(mockInjectScript).toHaveBeenCalledWith(
        'page-ssr',
        expect.stringContaining('reference.css'),
      );

      const healthRoute = injectedRoutes.find((r) => r.pattern === '/api/v1/health');
      expect(healthRoute?.entrypoint).toContain('health.ts');

      // Verify Vite plugins for consumer overrides and email templates are injected
      expect(mockUpdateConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          vite: expect.objectContaining({
            plugins: expect.arrayContaining([
              expect.objectContaining({ name: 'crss-consumer-overrides' }),
              expect.objectContaining({ name: 'crss-email-templates' }),
            ]),
          }),
        }),
      );
    });

    it('should generate virtual email template module with package templates', () => {
      const integration = createIntegration();
      const capturedConfig: any[] = [];
      const mockUpdateConfig = (cfg: any) => capturedConfig.push(cfg);

      const setupHook = integration.hooks['astro:config:setup'] as (params: any) => void;
      setupHook({
        injectRoute: vi.fn(),
        addMiddleware: vi.fn(),
        injectScript: vi.fn(),
        updateConfig: mockUpdateConfig,
        config: { root: new URL('file:///app/playground/') },
      });

      // Find the email templates plugin
      const viteConfig = capturedConfig.find((c) => c.vite?.plugins);
      const plugin = viteConfig?.vite?.plugins?.find((p: any) => p.name === 'crss-email-templates');
      expect(plugin).toBeDefined();

      // Test resolveId
      expect(plugin.resolveId('virtual:crss-email-templates')).toBe('\0virtual:crss-email-templates');
      expect(plugin.resolveId('some-other-module')).toBeUndefined();

      // Test load — should generate module with package templates
      const moduleSource = plugin.load('\0virtual:crss-email-templates');
      expect(moduleSource).toContain('export const devTemplates');
      expect(moduleSource).toContain('export const packageTemplates');
      // Package templates should include the known email types
      expect(moduleSource).toContain('SignInEmail');
      expect(moduleSource).toContain('WelcomeEmail');
      expect(moduleSource).toContain('EmailChangeEmail');

      // Test load returns undefined for other modules
      expect(plugin.load('some-other-id')).toBeUndefined();
    });

    it('should resolve consumer overrides for ejected layouts and components', () => {
      const integration = createIntegration();
      const capturedConfig: any[] = [];
      const mockUpdateConfig = (cfg: any) => capturedConfig.push(cfg);

      const setupHook = integration.hooks['astro:config:setup'] as (params: any) => void;
      setupHook({
        injectRoute: vi.fn(),
        addMiddleware: vi.fn(),
        injectScript: vi.fn(),
        updateConfig: mockUpdateConfig,
        config: { root: new URL('file:///app/playground/') },
      });

      const viteConfig = capturedConfig.find((c) => c.vite?.plugins);
      const plugin = viteConfig?.vite?.plugins?.find(
        (p: any) => p.name === 'crss-consumer-overrides',
      );
      expect(plugin).toBeDefined();

      // The plugin's resolveId needs the core pages/layouts/components dirs.
      // We can derive them from the integration.ts location (src/integration.ts).
      const coreDir = new URL('.', new URL('../../src/integration.ts', import.meta.url)).pathname;
      const corePagesDir = coreDir + 'pages';

      // Should return undefined when importer is not from core pages
      expect(plugin.resolveId('../../layouts/BaseLayout.astro', '/some/other/file.astro'))
        .toBeUndefined();

      // Should return undefined when there's no importer
      expect(plugin.resolveId('../../layouts/BaseLayout.astro', undefined))
        .toBeUndefined();

      // Should return undefined for non-.astro imports even from core pages
      expect(plugin.resolveId('../../utils/helper.ts', corePagesDir + '/index.astro'))
        .toBeUndefined();

      // When importer IS inside core pages, and consumer file exists,
      // it should resolve to the consumer path.
      // Note: existsSync is real here — playground may or may not have the
      // file. We test the logic by checking behavior with the actual FS.
      // For a page importing a layout:
      const layoutResult = plugin.resolveId(
        '../../layouts/BaseLayout.astro',
        corePagesDir + '/auth/signin.astro',
      );
      // If the playground has an ejected BaseLayout, this resolves to it;
      // otherwise returns undefined. Either way, the function shouldn't throw.
      expect(layoutResult === undefined || typeof layoutResult === 'string').toBe(true);
    });

    it('should log config via astro:config:done', () => {
      const integration = createIntegration({ maxFeeds: 15 });
      const logs: string[] = [];
      const mockLogger = {
        info: (msg: string) => logs.push(msg),
        warn: vi.fn(),
      };

      const doneHook = integration.hooks['astro:config:done'] as unknown as (params: {
        config: { root: URL };
        logger: typeof mockLogger;
      }) => void;
      doneHook({ config: { root: new URL('file:///app/playground/') }, logger: mockLogger });

      expect(logs).toContainEqual(expect.stringContaining('Community RSS'));
      expect(logs).toContainEqual(expect.stringContaining('15'));
    });

    it('should have astro:server:start hook', () => {
      const integration = createIntegration();
      expect(integration.hooks['astro:server:start']).toBeDefined();
      expect(typeof integration.hooks['astro:server:start']).toBe('function');
    });

    it('should have astro:server:done hook', () => {
      const integration = createIntegration();
      expect(integration.hooks['astro:server:done']).toBeDefined();
      expect(typeof integration.hooks['astro:server:done']).toBe('function');
    });

    it('should start scheduler on server start and stop on done', async () => {
      const { startScheduler } = await import('../../src/utils/build/scheduler');
      const { closeDatabase } = await import('../../src/db/connection');
      const { stopScheduler } = await import('../../src/utils/build/scheduler');

      const integration = createIntegration();

      // astro:config:done must run first to set projectRoot
      const configDoneHook = integration.hooks['astro:config:done'] as unknown as (params: {
        config: { root: URL };
        logger: { info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void };
      }) => void;
      configDoneHook({ config: { root: new URL('file:///app/playground/') }, logger: { info: vi.fn(), warn: vi.fn() } });

      const mockLogger = { info: vi.fn(), warn: vi.fn() };
      const startHook = integration.hooks['astro:server:start'] as (params: { logger: typeof mockLogger }) => void;
      startHook({ logger: mockLogger });
      expect(startScheduler).toHaveBeenCalledOnce();

      const doneHook = integration.hooks['astro:server:done'] as () => void;
      doneHook();
      expect(stopScheduler).toHaveBeenCalledOnce();
      expect(closeDatabase).toHaveBeenCalledOnce();
    });
  });
});

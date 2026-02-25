import { describe, it, expect, vi } from 'vitest';
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

      // Call the hook with a mock injectRoute and addMiddleware
      const setupHook = integration.hooks['astro:config:setup'] as (params: {
        injectRoute: typeof mockInjectRoute;
        addMiddleware: typeof mockAddMiddleware;
      }) => void;
      setupHook({ injectRoute: mockInjectRoute, addMiddleware: mockAddMiddleware });

      expect(injectedRoutes).toHaveLength(11);

      const patterns = injectedRoutes.map((r) => r.pattern);
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

      // Verify middleware was registered
      expect(mockAddMiddleware).toHaveBeenCalledWith(
        expect.objectContaining({ order: 'pre' }),
      );

      const healthRoute = injectedRoutes.find((r) => r.pattern === '/api/v1/health');
      expect(healthRoute?.entrypoint).toContain('health.ts');
    });

    it('should log config via astro:config:done', () => {
      const integration = createIntegration({ maxFeeds: 15 });
      const logs: string[] = [];
      const mockLogger = {
        info: (msg: string) => logs.push(msg),
      };

      const doneHook = integration.hooks['astro:config:done'] as unknown as (params: {
        logger: typeof mockLogger;
      }) => void;
      doneHook({ logger: mockLogger });

      expect(logs).toContainEqual(expect.stringContaining('Community RSS'));
      expect(logs).toContainEqual(expect.stringContaining('15'));
    });
  });
});

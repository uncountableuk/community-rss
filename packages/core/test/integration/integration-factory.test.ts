import { describe, it, expect } from 'vitest';
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

    it('should inject the health route via astro:config:setup', () => {
      const integration = createIntegration();
      const injectedRoutes: Array<{ pattern: string; entrypoint: string }> = [];
      const mockInjectRoute = (route: { pattern: string; entrypoint: string }) => {
        injectedRoutes.push(route);
      };

      // Call the hook with a mock injectRoute
      const setupHook = integration.hooks['astro:config:setup'] as (params: {
        injectRoute: typeof mockInjectRoute;
      }) => void;
      setupHook({ injectRoute: mockInjectRoute });

      expect(injectedRoutes).toHaveLength(1);
      expect(injectedRoutes[0].pattern).toBe('/api/v1/health');
      expect(injectedRoutes[0].entrypoint).toContain('health.ts');
    });

    it('should log config via astro:config:done', () => {
      const integration = createIntegration({ maxFeeds: 15 });
      const logs: string[] = [];
      const mockLogger = {
        info: (msg: string) => logs.push(msg),
      };

      const doneHook = integration.hooks['astro:config:done'] as (params: {
        logger: typeof mockLogger;
      }) => void;
      doneHook({ logger: mockLogger });

      expect(logs).toContainEqual(expect.stringContaining('Community RSS'));
      expect(logs).toContainEqual(expect.stringContaining('15'));
    });
  });
});

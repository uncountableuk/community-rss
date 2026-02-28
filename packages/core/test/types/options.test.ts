import { describe, it, expect } from 'vitest';
import type { CommunityRssOptions } from '@core-types/options';
import { resolveOptions } from '@core-types/options';
import { DEFAULT_EMAIL_THEME } from '@core-types/email-theme';

describe('CommunityRssOptions', () => {
  describe('resolveOptions', () => {
    it('should return all defaults when no options provided', () => {
      const resolved = resolveOptions();

      expect(resolved.maxFeeds).toBe(5);
      expect(resolved.commentTier).toBe('registered');
    });

    it('should return all defaults when empty object provided', () => {
      const resolved = resolveOptions({});

      expect(resolved.maxFeeds).toBe(5);
      expect(resolved.commentTier).toBe('registered');
    });

    it('should allow overriding maxFeeds', () => {
      const resolved = resolveOptions({ maxFeeds: 10 });

      expect(resolved.maxFeeds).toBe(10);
      expect(resolved.commentTier).toBe('registered');
    });

    it('should allow overriding commentTier to verified', () => {
      const resolved = resolveOptions({ commentTier: 'verified' });

      expect(resolved.maxFeeds).toBe(5);
      expect(resolved.commentTier).toBe('verified');
    });

    it('should allow overriding commentTier to guest', () => {
      const resolved = resolveOptions({ commentTier: 'guest' });

      expect(resolved.commentTier).toBe('guest');
    });

    it('should allow overriding all options simultaneously', () => {
      const options: CommunityRssOptions = {
        maxFeeds: 20,
        commentTier: 'verified',
      };
      const resolved = resolveOptions(options);

      expect(resolved.maxFeeds).toBe(20);
      expect(resolved.commentTier).toBe('verified');
    });

    it('should not mutate the input options object', () => {
      const options: CommunityRssOptions = { maxFeeds: 3 };
      const optionsCopy = { ...options };

      resolveOptions(options);

      expect(options).toEqual(optionsCopy);
    });

    it('should resolve email.theme with defaults when no theme provided', () => {
      const resolved = resolveOptions();
      expect(resolved.email.theme).toEqual(DEFAULT_EMAIL_THEME);
    });

    it('should merge partial email.theme overrides with defaults', () => {
      const resolved = resolveOptions({
        email: {
          theme: {
            colors: { primary: '#e11d48' },
          },
        },
      });
      expect(resolved.email.theme.colors.primary).toBe('#e11d48');
      expect(resolved.email.theme.colors.background).toBe('#f9fafb');
    });

    it('should use appName as default logoAlt in email theme', () => {
      const resolved = resolveOptions({
        email: { appName: 'My Feeds' },
      });
      expect(resolved.email.theme.branding.logoAlt).toBe('My Feeds');
    });

    it('should resolve email.subjects to empty object by default', () => {
      const resolved = resolveOptions();
      expect(resolved.email.subjects).toEqual({});
    });

    it('should pass through email.subjects overrides', () => {
      const subjects = {
        'sign-in': 'Custom subject',
        'welcome': ({ appName }: { appName: string }) => `Welcome to ${appName}`,
      };
      const resolved = resolveOptions({
        email: { subjects },
      });
      expect(resolved.email.subjects['sign-in']).toBe('Custom subject');
      expect(typeof resolved.email.subjects['welcome']).toBe('function');
    });
  });
});

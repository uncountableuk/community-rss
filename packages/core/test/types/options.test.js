import { describe, it, expect } from 'vitest';
import { resolveOptions } from '@core-types/options';
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
            const options = {
                maxFeeds: 20,
                commentTier: 'verified',
            };
            const resolved = resolveOptions(options);
            expect(resolved.maxFeeds).toBe(20);
            expect(resolved.commentTier).toBe('verified');
        });
        it('should not mutate the input options object', () => {
            const options = { maxFeeds: 3 };
            const optionsCopy = { ...options };
            resolveOptions(options);
            expect(options).toEqual(optionsCopy);
        });
    });
});
//# sourceMappingURL=options.test.js.map
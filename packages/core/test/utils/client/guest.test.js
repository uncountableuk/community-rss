/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initGuestSession, getGuestId, isGuest, clearGuestSession } from '@utils/client/guest';
describe('client guest session', () => {
    beforeEach(() => {
        // Clear all cookies
        document.cookie.split(';').forEach((cookie) => {
            const name = cookie.split('=')[0].trim();
            if (name) {
                document.cookie = `${name}=; max-age=0`;
            }
        });
    });
    describe('initGuestSession', () => {
        it('should generate a UUID and set a cookie', () => {
            // Mock crypto.randomUUID
            const mockUUID = '550e8400-e29b-41d4-a716-446655440000';
            vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);
            const guestId = initGuestSession();
            expect(guestId).toBe(mockUUID);
            expect(document.cookie).toContain(`crss_guest=${mockUUID}`);
        });
    });
    describe('getGuestId', () => {
        it('should return the guest ID from the cookie', () => {
            document.cookie = 'crss_guest=test-uuid-123; path=/';
            expect(getGuestId()).toBe('test-uuid-123');
        });
        it('should return null when no guest cookie exists', () => {
            expect(getGuestId()).toBeNull();
        });
    });
    describe('isGuest', () => {
        it('should return true when guest cookie exists', () => {
            document.cookie = 'crss_guest=some-uuid; path=/';
            expect(isGuest()).toBe(true);
        });
        it('should return false when no guest cookie', () => {
            expect(isGuest()).toBe(false);
        });
    });
    describe('clearGuestSession', () => {
        it('should remove the guest cookie', () => {
            document.cookie = 'crss_guest=test-uuid; path=/';
            expect(getGuestId()).toBe('test-uuid');
            clearGuestSession();
            expect(getGuestId()).toBeNull();
        });
        it('should not create a new guest UUID after clearing', () => {
            document.cookie = 'crss_guest=old-uuid; path=/';
            clearGuestSession();
            // After sign-out, no new UUID should be auto-generated
            expect(isGuest()).toBe(false);
        });
    });
});
//# sourceMappingURL=guest.test.js.map
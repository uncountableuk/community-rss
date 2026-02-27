/**
 * Mock auth data for tests.
 * @since 0.3.0
 */
export const mockSessions = {
    user: {
        user: {
            id: 'user-registered-1',
            email: 'reader@example.com',
            name: 'Regular Reader',
            role: 'user',
            isGuest: false,
            emailVerified: true,
        },
        session: {
            id: 'session-user-1',
            token: 'token-user-1',
            expiresAt: new Date('2026-12-31T23:59:59Z'),
        },
    },
    admin: {
        user: {
            id: 'user-admin-1',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
            isGuest: false,
            emailVerified: true,
        },
        session: {
            id: 'session-admin-1',
            token: 'token-admin-1',
            expiresAt: new Date('2026-12-31T23:59:59Z'),
        },
    },
    guest: {
        user: {
            id: 'guest-uuid-123',
            email: null,
            name: null,
            role: 'user',
            isGuest: true,
            emailVerified: false,
        },
        session: {
            id: 'session-guest-1',
            token: 'token-guest-1',
            expiresAt: new Date('2026-12-31T23:59:59Z'),
        },
    },
};
export const mockMagicLinkTokens = {
    valid: 'valid-magic-link-token-abc123',
    expired: 'expired-magic-link-token-xyz789',
    invalid: 'invalid-token',
};
//# sourceMappingURL=auth.js.map
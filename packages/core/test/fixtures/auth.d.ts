/**
 * Mock auth data for tests.
 * @since 0.3.0
 */
export declare const mockSessions: {
    user: {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            isGuest: boolean;
            emailVerified: boolean;
        };
        session: {
            id: string;
            token: string;
            expiresAt: Date;
        };
    };
    admin: {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            isGuest: boolean;
            emailVerified: boolean;
        };
        session: {
            id: string;
            token: string;
            expiresAt: Date;
        };
    };
    guest: {
        user: {
            id: string;
            email: null;
            name: null;
            role: string;
            isGuest: boolean;
            emailVerified: boolean;
        };
        session: {
            id: string;
            token: string;
            expiresAt: Date;
        };
    };
};
export declare const mockMagicLinkTokens: {
    valid: string;
    expired: string;
    invalid: string;
};
//# sourceMappingURL=auth.d.ts.map
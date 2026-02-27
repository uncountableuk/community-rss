/**
 * Mock user data for tests.
 * Covers all user tiers: guest, registered, verified, admin, system.
 * @since 0.1.0
 */
export declare const mockUsers: {
    guest: {
        id: string;
        email: null;
        isGuest: boolean;
        role: "user";
        name: null;
        bio: null;
        avatarUrl: null;
        emailVerified: boolean;
        termsAcceptedAt: null;
        pendingEmail: null;
        pendingEmailToken: null;
        pendingEmailExpiresAt: null;
        createdAt: Date;
        updatedAt: Date;
    };
    registered: {
        id: string;
        email: string;
        isGuest: boolean;
        role: "user";
        name: string;
        bio: string;
        avatarUrl: null;
        emailVerified: boolean;
        termsAcceptedAt: Date;
        pendingEmail: null;
        pendingEmailToken: null;
        pendingEmailExpiresAt: null;
        createdAt: Date;
        updatedAt: Date;
    };
    author: {
        id: string;
        email: string;
        isGuest: boolean;
        role: "user";
        name: string;
        bio: string;
        avatarUrl: string;
        emailVerified: boolean;
        termsAcceptedAt: Date;
        pendingEmail: null;
        pendingEmailToken: null;
        pendingEmailExpiresAt: null;
        createdAt: Date;
        updatedAt: Date;
    };
    admin: {
        id: string;
        email: string;
        isGuest: boolean;
        role: "admin";
        name: string;
        bio: string;
        avatarUrl: null;
        emailVerified: boolean;
        termsAcceptedAt: Date;
        pendingEmail: null;
        pendingEmailToken: null;
        pendingEmailExpiresAt: null;
        createdAt: Date;
        updatedAt: Date;
    };
    system: {
        id: string;
        email: null;
        isGuest: boolean;
        role: "system";
        name: string;
        bio: null;
        avatarUrl: null;
        emailVerified: boolean;
        termsAcceptedAt: null;
        pendingEmail: null;
        pendingEmailToken: null;
        pendingEmailExpiresAt: null;
        createdAt: Date;
        updatedAt: Date;
    };
};
//# sourceMappingURL=users.d.ts.map
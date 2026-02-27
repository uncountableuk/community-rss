/**
 * better-auth configuration factory for Community RSS.
 *
 * Creates a better-auth instance configured for SQLite (better-sqlite3)
 * with magic-link authentication.
 *
 * **CRITICAL:** `baseURL` must be set to `env.PUBLIC_SITE_URL`
 * (e.g., `http://localhost:4321` in local dev). Without this,
 * magic-link URLs and cookie domains will not match the browser
 * origin, causing silent auth failures.
 *
 * @since 0.3.0
 */
import type { AppContext } from '../../types/context';
/**
 * Creates a configured better-auth instance.
 *
 * @param app - Application context containing database and configuration
 * @returns Configured better-auth instance
 * @since 0.3.0
 */
export declare function createAuth(app: AppContext): import("better-auth").Auth<{
    baseURL: string;
    database: (options: import("better-auth").BetterAuthOptions) => import("better-auth").DBAdapter<import("better-auth").BetterAuthOptions>;
    plugins: [{
        id: "magic-link";
        endpoints: {
            signInMagicLink: import("better-call").StrictEndpoint<"/sign-in/magic-link", {
                method: "POST";
                requireHeaders: true;
                body: import("better-auth").ZodObject<{
                    email: import("better-auth").ZodEmail;
                    name: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                    callbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                    newUserCallbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                    errorCallbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                }, import("better-auth").$strip>;
                metadata: {
                    openapi: {
                        operationId: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                status: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                status: boolean;
            }>;
            magicLinkVerify: import("better-call").StrictEndpoint<"/magic-link/verify", {
                method: "GET";
                query: import("better-auth").ZodObject<{
                    token: import("better-auth").ZodString;
                    callbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                    errorCallbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                    newUserCallbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                }, import("better-auth").$strip>;
                use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<void>)[];
                requireHeaders: true;
                metadata: {
                    openapi: {
                        operationId: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                session: {
                                                    $ref: string;
                                                };
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                token: string;
                user: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string;
                    emailVerified: boolean;
                    name: string;
                    image?: string | null | undefined;
                };
            }>;
        };
        rateLimit: {
            pathMatcher(path: string): boolean;
            window: number;
            max: number;
        }[];
        options: import("better-auth/plugins/magic-link").MagicLinkOptions;
    }];
    session: {
        expiresIn: number;
        updateAge: number;
        cookieCache: {
            enabled: false;
        };
    };
    advanced: {
        crossSubDomainCookies: {
            enabled: false;
        };
    };
    user: {
        additionalFields: {
            isGuest: {
                type: "boolean";
                defaultValue: false;
                input: false;
            };
            role: {
                type: "string";
                defaultValue: string;
                input: false;
            };
            bio: {
                type: "string";
                required: false;
                input: false;
            };
            avatarUrl: {
                type: "string";
                required: false;
                input: false;
            };
        };
    };
    databaseHooks: {
        user: {
            create: {
                after: () => Promise<void>;
            };
        };
    };
}>;
/** Type of the auth instance returned by createAuth */
export type AuthInstance = ReturnType<typeof createAuth>;
/**
 * Extracts and validates the session from a request.
 *
 * @param request - The incoming HTTP request
 * @param app - Application context
 * @returns The authenticated session with user data
 * @throws Response with 401 status if not authenticated
 * @since 0.3.0
 */
export declare function requireAuth(request: Request, app: AppContext): Promise<{
    session: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null | undefined | undefined;
        userAgent?: string | null | undefined | undefined;
    };
    user: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string | null | undefined | undefined;
        role: string;
        isGuest: boolean;
        bio?: string | null | undefined;
        avatarUrl?: string | null | undefined;
    };
}>;
/**
 * Extracts session and verifies admin role.
 *
 * @param request - The incoming HTTP request
 * @param app - Application context
 * @returns The authenticated admin session
 * @throws Response with 401 if not authenticated, 403 if not admin
 * @since 0.3.0
 */
export declare function requireAdmin(request: Request, app: AppContext): Promise<{
    session: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null | undefined | undefined;
        userAgent?: string | null | undefined | undefined;
    };
    user: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string | null | undefined | undefined;
        role: string;
        isGuest: boolean;
        bio?: string | null | undefined;
        avatarUrl?: string | null | undefined;
    };
}>;
//# sourceMappingURL=auth.d.ts.map
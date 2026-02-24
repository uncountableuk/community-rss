/**
 * better-auth configuration factory for Community RSS.
 *
 * Creates a better-auth instance configured for D1 (SQLite) with
 * magic-link authentication. Each request needs its own instance
 * because Cloudflare Workers bindings are per-request.
 *
 * **CRITICAL:** `baseURL` must be set to `env.PUBLIC_SITE_URL`
 * (e.g., `http://localhost:4321` in local dev). Without this,
 * magic-link URLs and cookie domains will not match the browser
 * origin, causing silent auth failures.
 *
 * @since 0.3.0
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins/magic-link';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import type { Env } from '../../types/env';
import type { EmailConfig } from '../../types/options';
import { sendMagicLinkEmail } from './email';
import { getPendingSignup } from '../../db/queries/pending-signups';
import { getUserByEmail } from '../../db/queries/users';
import type { EmailUserProfile } from '../../types/email';

/**
 * Creates a configured better-auth instance for the current request.
 *
 * Not a singleton — each request receives fresh env bindings from
 * Cloudflare Workers, so a new auth instance is needed per-request.
 *
 * @param env - Cloudflare environment bindings
 * @param emailConfig - Optional email configuration from integration options
 * @returns Configured better-auth instance
 * @since 0.3.0
 */
export function createAuth(env: Env, emailConfig?: EmailConfig) {
    const db = drizzle(env.DB);

    return betterAuth({
        baseURL: env.PUBLIC_SITE_URL,
        database: drizzleAdapter(db, {
            provider: 'sqlite',
            schema,
            usePlural: true,
        }),
        plugins: [
            magicLink({
                sendMagicLink: async ({ email, url }) => {
                    // Transform the URL to go through the verify page instead of directly to the API
                    const verifyUrl = url.replace('/api/auth/magic-link/verify', '/auth/verify');

                    // Check if this email has a pending sign-up to determine email template
                    let isWelcome = false;
                    let profile: EmailUserProfile | undefined;
                    try {
                        const pending = await getPendingSignup(env.DB, email);
                        isWelcome = pending !== null;
                        if (pending?.name) {
                            profile = { name: pending.name, email };
                        }
                    } catch {
                        // If lookup fails, default to sign-in template
                    }

                    // For returning users, look up their profile for personalisation
                    if (!profile) {
                        try {
                            const user = await getUserByEmail(env.DB, email);
                            if (user?.name) {
                                profile = {
                                    name: user.name,
                                    email,
                                    avatarUrl: user.avatarUrl ?? undefined,
                                };
                            }
                        } catch {
                            // Profile lookup failure is non-critical
                        }
                    }

                    await sendMagicLinkEmail(env, email, verifyUrl, emailConfig, isWelcome, profile);
                },
                expiresIn: 3600, // 60 minutes (increased from 5 for local dev testing)
            }),
        ],
        session: {
            expiresIn: 60 * 60 * 24 * 30, // 30 days
            updateAge: 60 * 60 * 24, // Update session cookie once per day
            cookieCache: {
                enabled: false, // Disable cache to prevent token consumption on failed requests
            },
        },
        advanced: {
            crossSubDomainCookies: {
                enabled: false,
            },
        },
        user: {
            additionalFields: {
                isGuest: {
                    type: 'boolean',
                    defaultValue: false,
                    input: false,
                },
                role: {
                    type: 'string',
                    defaultValue: 'user',
                    input: false,
                },
                bio: {
                    type: 'string',
                    required: false,
                    input: false,
                },
                avatarUrl: {
                    type: 'string',
                    required: false,
                    input: false,
                },
            },
        },
        databaseHooks: {
            user: {
                create: {
                    after: async () => {
                        // Guest migration hook:
                        // When a guest signs up via magic link, their interactions
                        // should be migrated to the new registered user account.
                        // The guestId cookie is read by the auth route handler
                        // and passed via the user metadata. The actual migration
                        // is handled in the auth catch-all route using
                        // migrateGuestToUser() after the user is created.
                        //
                        // Note: We can't access request cookies here directly,
                        // so the migration is triggered from the route handler
                        // that receives the GenericEndpointContext.
                    },
                },
            },
        },
    });
}

/** Type of the auth instance returned by createAuth */
export type AuthInstance = ReturnType<typeof createAuth>;

/**
 * Extracts and validates the session from a request.
 *
 * @param request - The incoming HTTP request
 * @param env - Cloudflare environment bindings
 * @param emailConfig - Optional email configuration
 * @returns The authenticated session with user data
 * @throws Response with 401 status if not authenticated
 * @since 0.3.0
 */
export async function requireAuth(
    request: Request,
    env: Env,
    emailConfig?: EmailConfig,
) {
    const auth = createAuth(env, emailConfig);
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        throw new Response(
            JSON.stringify({ code: 'AUTH_REQUIRED', message: 'Authentication required' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
        );
    }

    return session;
}

/**
 * Extracts session and verifies admin role.
 *
 * @param request - The incoming HTTP request
 * @param env - Cloudflare environment bindings
 * @param emailConfig - Optional email configuration
 * @returns The authenticated admin session
 * @throws Response with 401 if not authenticated, 403 if not admin
 * @since 0.3.0
 */
export async function requireAdmin(
    request: Request,
    env: Env,
    emailConfig?: EmailConfig,
) {
    const session = await requireAuth(request, env, emailConfig);

    const userRole = ((session.user as unknown) as Record<string, string>).role;
    if (userRole !== 'admin') {
        throw new Response(
            JSON.stringify({ code: 'ADMIN_REQUIRED', message: 'Admin access required' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } },
        );
    }

    return session;
}

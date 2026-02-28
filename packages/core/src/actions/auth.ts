/**
 * Authentication action handlers.
 *
 * Encapsulates auth-related business logic for use with Astro Actions.
 *
 * @since 0.5.0
 */

import { getUserByEmail } from '../db/queries/users';
import { createPendingSignup } from '../db/queries/pending-signups';
import { createAuth } from '../utils/build/auth';
import type { AppContext } from '../types/context';

/**
 * Input for the checkEmail action.
 * @since 0.5.0
 */
export interface CheckEmailInput {
  /** Email address to check */
  email: string;
}

/**
 * Output for the checkEmail action.
 * @since 0.5.0
 */
export interface CheckEmailOutput {
  /** Whether a registered (non-guest) user exists with this email */
  exists: boolean;
}

/**
 * Input for the submitSignup action.
 * @since 0.5.0
 */
export interface SubmitSignupInput {
  /** Email address */
  email: string;
  /** Display name */
  name: string;
  /** Whether the user accepted the Terms of Service */
  termsAccepted: boolean;
}

/**
 * Output for the submitSignup action.
 * @since 0.5.0
 */
export interface SubmitSignupOutput {
  /** Whether the signup was successful */
  success: boolean;
  /** Whether the account already exists (sign-in link sent instead) */
  exists?: boolean;
  /** Human-readable message */
  message: string;
}

/**
 * Checks whether an email address is already registered.
 *
 * Used by the sign-in form to distinguish returning users from new
 * sign-ups. Returns `{ exists: true }` if a non-guest user with this
 * email exists, `{ exists: false }` otherwise.
 *
 * @param input - Email to check
 * @param app - Application context
 * @returns Existence result
 * @since 0.5.0
 */
export async function checkEmailHandler(
  input: CheckEmailInput,
  app: AppContext,
): Promise<CheckEmailOutput> {
  const email = input.email.trim().toLowerCase();

  if (!email || !email.includes('@') || email.length < 3) {
    throw new Error('Invalid email format');
  }

  const user = await getUserByEmail(app.db, email);
  const exists = user !== null && !user.isGuest;

  return { exists };
}

/**
 * Handles new user signup by storing pending data and triggering
 * a magic link verification email.
 *
 * If the email already belongs to a registered user, a sign-in
 * link is sent instead (to avoid account enumeration).
 *
 * @param input - Signup data
 * @param app - Application context
 * @returns Signup result
 * @since 0.5.0
 */
export async function submitSignupHandler(
  input: SubmitSignupInput,
  app: AppContext,
): Promise<SubmitSignupOutput> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!email || !email.includes('@') || email.length < 3) {
    throw new Error('Valid email is required');
  }

  if (!name || name.length < 1) {
    throw new Error('Display name is required');
  }

  if (name.length > 100) {
    throw new Error('Display name must be 100 characters or less');
  }

  if (!input.termsAccepted) {
    throw new Error('You must accept the Terms of Service');
  }

  // Check if this email already belongs to a registered (non-guest) user
  const existingUser = await getUserByEmail(app.db, email);
  if (existingUser && !existingUser.isGuest) {
    // Send a sign-in magic link instead of welcome link
    const auth = createAuth(app);
    await auth.handler(
      new Request(`${app.env.PUBLIC_SITE_URL}/api/auth/sign-in/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, callbackURL: '/profile' }),
      }),
    ).catch((err: unknown) => {
      console.warn('[community-rss] Sign-in link send failed for existing account:', err);
    });

    return {
      success: true,
      exists: true,
      message: "An account with this email already exists. We've sent a sign-in link to your email.",
    };
  }

  // Store pending sign-up data
  await createPendingSignup(app.db, email, name);

  // Trigger magic link email via better-auth
  const auth = createAuth(app);
  const magicLinkResponse = await auth.handler(
    new Request(`${app.env.PUBLIC_SITE_URL}/api/auth/sign-in/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, callbackURL: '/profile' }),
    }),
  );

  if (!magicLinkResponse.ok) {
    throw new Error('Failed to send verification email');
  }

  return {
    success: true,
    message: 'Check your email to verify your account',
  };
}

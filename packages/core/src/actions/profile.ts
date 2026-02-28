/**
 * Profile action handlers.
 *
 * Encapsulates profile management business logic for use with
 * Astro Actions.
 *
 * @since 0.5.0
 */

import { getUserByEmail, updateUser, setPendingEmail, confirmEmailChange } from '../db/queries/users';
import { sendEmailChangeEmail } from '../utils/build/email';
import type { AppContext } from '../types/context';
import type { EmailUserProfile } from '../types/email';

/**
 * Input for the updateProfile action.
 * @since 0.5.0
 */
export interface UpdateProfileInput {
    /** User ID (from authenticated session) */
    userId: string;
    /** New display name */
    name?: string;
    /** New bio text */
    bio?: string;
}

/**
 * Output for the updateProfile action.
 * @since 0.5.0
 */
export interface UpdateProfileOutput {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    avatarUrl: string | null;
    role: string;
    emailVerified: boolean;
}

/**
 * Input for the changeEmail action.
 * @since 0.5.0
 */
export interface ChangeEmailInput {
    /** User ID (from authenticated session) */
    userId: string;
    /** Current user email */
    currentEmail: string;
    /** Current user name (for email personalisation) */
    currentName?: string;
    /** New email address */
    newEmail: string;
}

/**
 * Output for the changeEmail action.
 * @since 0.5.0
 */
export interface ChangeEmailOutput {
    /** Human-readable result message */
    message: string;
}

/**
 * Input for the confirmEmailChange action.
 * @since 0.5.0
 */
export interface ConfirmEmailChangeInput {
    /** One-time verification token */
    token: string;
}

/**
 * Output for the confirmEmailChange action.
 * @since 0.5.0
 */
export interface ConfirmEmailChangeOutput {
    /** Human-readable result message */
    message: string;
}

/**
 * Updates a user's profile (name and/or bio).
 *
 * @param input - Profile update data
 * @param app - Application context
 * @returns Updated profile
 * @since 0.5.0
 */
export async function updateProfileHandler(
    input: UpdateProfileInput,
    app: AppContext,
): Promise<UpdateProfileOutput> {
    const updateData: { name?: string; bio?: string } = {};

    if (input.name !== undefined) {
        const name = input.name.trim();
        if (!name || name.length < 1) {
            throw new Error('Display name cannot be empty');
        }
        if (name.length > 100) {
            throw new Error('Display name must be 100 characters or less');
        }
        updateData.name = name;
    }

    if (input.bio !== undefined) {
        if (input.bio.length > 500) {
            throw new Error('Bio must be 500 characters or less');
        }
        updateData.bio = input.bio;
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
    }

    const updated = await updateUser(app.db, input.userId, updateData);

    if (!updated) {
        throw new Error('User not found');
    }

    return {
        id: updated.id,
        email: updated.email ?? '',
        name: updated.name,
        bio: updated.bio ?? null,
        avatarUrl: updated.avatarUrl ?? null,
        role: updated.role,
        emailVerified: updated.emailVerified,
    };
}

/**
 * Initiates an email address change by setting a pending email
 * and sending a verification link.
 *
 * @param input - Email change data
 * @param app - Application context
 * @returns Result message
 * @since 0.5.0
 */
export async function changeEmailHandler(
    input: ChangeEmailInput,
    app: AppContext,
): Promise<ChangeEmailOutput> {
    const newEmail = input.newEmail.trim().toLowerCase();

    if (!newEmail) {
        throw new Error('Email address is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
        throw new Error('Invalid email address format');
    }

    const currentEmail = input.currentEmail.toLowerCase();
    if (newEmail === currentEmail) {
        throw new Error('New email address must differ from the current one');
    }

    // Check if the new address is already taken
    const existing = await getUserByEmail(app.db, newEmail);
    if (existing) {
        throw new Error('That email address is already in use');
    }

    // Generate a one-time token and 24-hour expiry
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await setPendingEmail(app.db, input.userId, newEmail, token, expiresAt);

    const siteUrl = app.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';
    const verificationUrl = `${siteUrl}/auth/verify-email-change?token=${token}`;

    // Fire-and-forget: email failure is logged but not surfaced
    try {
        const profile: EmailUserProfile = {
            name: input.currentName,
            email: currentEmail,
        };
        await sendEmailChangeEmail(app, newEmail, verificationUrl, undefined, profile);
    } catch (emailErr) {
        console.warn('[community-rss] Email change verification email failed to send:', emailErr);
    }

    return {
        message: `Verification link sent to ${newEmail}`,
    };
}

/**
 * Confirms a pending email address change using a verification token.
 *
 * @param input - Token data
 * @param app - Application context
 * @returns Result message
 * @since 0.5.0
 */
export async function confirmEmailChangeHandler(
    input: ConfirmEmailChangeInput,
    app: AppContext,
): Promise<ConfirmEmailChangeOutput> {
    const token = input.token.trim();

    if (!token) {
        throw new Error('Missing verification token');
    }

    const result = await confirmEmailChange(app.db, token);

    if (result === null) {
        throw new Error('Invalid or already-used verification token');
    }

    if ('expired' in result && result.expired) {
        throw new Error('This verification link has expired. Please request a new one from your profile.');
    }

    return {
        message: 'Email address updated successfully',
    };
}

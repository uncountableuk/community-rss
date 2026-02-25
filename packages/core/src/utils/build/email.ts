/**
 * Email sending utilities for Community RSS.
 *
 * Thin facade over the email service. These functions create an
 * `EmailService` per call and delegate to it. Prefer using
 * `createEmailService()` directly when sending multiple emails
 * in the same request to avoid re-creating the service.
 *
 * @since 0.3.0
 */

import type { Env } from '../../types/env';
import type { EmailConfig } from '../../types/options';
import type { EmailUserProfile } from '../../types/email';
import { createEmailService } from './email-service';

/**
 * Sends a magic link email to the specified address.
 *
 * When `isWelcome` is true, uses the welcome email template for new
 * user sign-ups instead of the standard sign-in template.
 *
 * @param env - Cloudflare environment bindings
 * @param email - Recipient email address
 * @param url - Magic link URL (includes token)
 * @param emailConfig - Optional email configuration from integration options
 * @param isWelcome - If true, use welcome email template for new sign-ups
 * @param profile - Optional user profile for personalisation
 * @since 0.3.0
 */
export async function sendMagicLinkEmail(
    env: Env,
    email: string,
    url: string,
    emailConfig?: EmailConfig,
    isWelcome: boolean = false,
    profile?: EmailUserProfile,
): Promise<void> {
    const service = createEmailService(env, emailConfig);
    const type = isWelcome ? 'welcome' : 'sign-in';
    await service.send(type, email, { url }, profile);
}

/**
 * Sends an email change verification email to the new email address.
 *
 * The recipient must click the confirmation link to activate the new address.
 * The original address remains active until the change is confirmed.
 *
 * @param env - Cloudflare environment bindings
 * @param newEmail - The new email address to verify
 * @param verificationUrl - URL the user must visit to confirm the change
 * @param emailConfig - Optional email configuration from integration options
 * @param profile - Optional user profile for personalisation
 * @since 0.3.0
 */
export async function sendEmailChangeEmail(
    env: Env,
    newEmail: string,
    verificationUrl: string,
    emailConfig?: EmailConfig,
    profile?: EmailUserProfile,
): Promise<void> {
    const service = createEmailService(env, emailConfig);
    await service.send('email-change', newEmail, { verificationUrl }, profile);
}

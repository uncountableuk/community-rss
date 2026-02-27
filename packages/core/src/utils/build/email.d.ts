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
import type { AppContext } from '../../types/context';
import type { EmailUserProfile } from '../../types/email';
/**
 * Sends a magic link email to the specified address.
 *
 * When `isWelcome` is true, uses the welcome email template for new
 * user sign-ups instead of the standard sign-in template.
 *
 * @param app - Application context
 * @param email - Recipient email address
 * @param url - Magic link URL (includes token)
 * @param isWelcome - If true, use welcome email template for new sign-ups
 * @param profile - Optional user profile for personalisation
 * @since 0.3.0
 */
export declare function sendMagicLinkEmail(app: AppContext, email: string, url: string, isWelcome?: boolean, profile?: EmailUserProfile): Promise<void>;
/**
 * Sends an email change verification email to the new email address.
 *
 * The recipient must click the confirmation link to activate the new address.
 * The original address remains active until the change is confirmed.
 *
 * @param app - Application context
 * @param newEmail - The new email address to verify
 * @param verificationUrl - URL the user must visit to confirm the change
 * @param emailConfig - Deprecated, ignored — configuration is read from app.config.email
 * @param profile - Optional user profile for personalisation
 * @since 0.3.0
 */
export declare function sendEmailChangeEmail(app: AppContext, newEmail: string, verificationUrl: string, emailConfig?: unknown, profile?: EmailUserProfile): Promise<void>;
//# sourceMappingURL=email.d.ts.map
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
import { createEmailService } from './email-service';
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
export async function sendMagicLinkEmail(app, email, url, isWelcome = false, profile) {
    const service = createEmailService(app);
    const type = isWelcome ? 'welcome' : 'sign-in';
    await service.send(type, email, { url }, profile);
}
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
export async function sendEmailChangeEmail(app, newEmail, verificationUrl, emailConfig, profile) {
    const service = createEmailService(app);
    await service.send('email-change', newEmail, { verificationUrl }, profile);
}
//# sourceMappingURL=email.js.map
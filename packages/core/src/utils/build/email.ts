/**
 * Email sending utilities for Community RSS.
 *
 * Uses Resend API in production (when `RESEND_API_KEY` is set) and
 * SMTP (Mailpit) in local development.
 *
 * @since 0.3.0
 */

import type { Env } from '../../types/env';
import type { EmailConfig } from '../../types/options';

/**
 * Sends a magic link email to the specified address.
 *
 * Automatically selects the transport:
 * - **Resend API** when `env.RESEND_API_KEY` is present
 * - **SMTP** (Mailpit in dev) when Resend is not configured
 *
 * When `isWelcome` is true, uses a welcome email template for new
 * user sign-ups instead of the standard sign-in template.
 *
 * @param env - Cloudflare environment bindings
 * @param email - Recipient email address
 * @param url - Magic link URL (includes token)
 * @param emailConfig - Optional email configuration from integration options
 * @param isWelcome - If true, use welcome email template for new sign-ups
 * @since 0.3.0
 */
export async function sendMagicLinkEmail(
    env: Env,
    email: string,
    url: string,
    emailConfig?: EmailConfig,
    isWelcome: boolean = false,
): Promise<void> {
    const from = emailConfig?.from ?? env.SMTP_FROM ?? 'noreply@localhost';
    const appName = emailConfig?.appName ?? 'Community RSS';

    const subject = isWelcome
        ? `Welcome to ${appName}! Verify your account`
        : `Sign in to ${appName}`;

    const actionLabel = isWelcome ? 'Verify & Get Started' : 'Sign In';

    const textBody = isWelcome
        ? `Welcome to ${appName}!\n\nClick this link to verify your account and get started:\n\n${url}\n\nThis link expires in 60 minutes.\n\nIf you didn't create this account, you can safely ignore this email.`
        : `Click this link to sign in to ${appName}:\n\n${url}\n\nThis link expires in 60 minutes.\n\nIf you didn't request this, you can safely ignore this email.`;

    const htmlHeading = isWelcome
        ? `Welcome to ${appName}!`
        : `Sign in to ${appName}`;

    const htmlIntro = isWelcome
        ? 'Your account is almost ready. Click the button below to verify your email and get started:'
        : 'Click the button below to sign in:';

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #4f46e5;">${htmlHeading}</h2>
  <p>${htmlIntro}</p>
  <p style="margin: 24px 0;">
    <a href="${url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
      ${actionLabel}
    </a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">This link expires in 60 minutes.</p>
  <p style="color: #6b7280; font-size: 14px;">If you didn't ${isWelcome ? 'create this account' : 'request this'}, you can safely ignore this email.</p>
</body>
</html>`.trim();

    if (env.RESEND_API_KEY) {
        await sendViaResend(env.RESEND_API_KEY, from, email, subject, textBody, htmlBody);
    } else {
        await sendViaSmtp(env, from, email, subject, textBody, htmlBody);
    }
}

/**
 * Sends email via the Resend API (production).
 *
 * @since 0.3.0
 */
async function sendViaResend(
    apiKey: string,
    from: string,
    to: string,
    subject: string,
    text: string,
    html: string,
): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, text, html }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Resend email failed (${response.status}): ${errorBody}`);
    }
}

/**
 * Sends email via SMTP (Mailpit in local dev).
 *
 * Uses a minimal SMTP implementation over TCP via fetch to support
 * Cloudflare Workers environment (no Node.js net module).
 * Falls back to a simple HTTP POST to Mailpit's API when available.
 *
 * @since 0.3.0
 */
async function sendViaSmtp(
    env: Env,
    from: string,
    to: string,
    subject: string,
    text: string,
    _html: string,
): Promise<void> {
    // In local dev with Mailpit, use Mailpit's SMTP API endpoint
    // Mailpit accepts SMTP on port 1025 but also has an HTTP API on port 8025
    // Since we can't use raw SMTP in Workers, we construct a minimal
    // email and send via Mailpit's sendmail API
    const smtpHost = env.SMTP_HOST || 'localhost';
    const mailpitApiPort = '8025';

    try {
        const response = await fetch(`http://${smtpHost}:${mailpitApiPort}/api/v1/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                From: { Email: from, Name: 'Community RSS' },
                To: [{ Email: to }],
                Subject: subject,
                Text: text,
            }),
        });

        if (!response.ok) {
            console.warn(`[community-rss] Mailpit send failed (${response.status}), email may not be delivered`);
        }
    } catch (error) {
        // In dev, log warning but don't fail the auth flow
        console.warn('[community-rss] Email delivery failed (SMTP not available):', error);
    }
}

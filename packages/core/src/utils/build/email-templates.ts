/**
 * Default email templates for Community RSS.
 *
 * Each template is a pure function: `(context, data) => EmailContent`.
 * Consumers can import these to extend or wrap them, or replace them
 * entirely via `EmailConfig.templates`.
 *
 * @since 0.3.0
 */

import type {
    EmailTemplateContext,
    EmailContent,
    EmailTemplateFunction,
    SignInEmailData,
    WelcomeEmailData,
    EmailChangeData,
    EmailTemplateMap,
} from '../../types/email';

// ─── Shared Layout ───────────────────────────────────────────

/**
 * Wraps email body content in a consistent HTML layout.
 *
 * Provides the DOCTYPE, charset, and base styling shared by all
 * default email templates. Consumers who override individual
 * templates can import this to maintain visual consistency.
 *
 * @param body - Inner HTML content to wrap
 * @returns Complete HTML document string
 * @since 0.3.0
 */
export function emailLayout(body: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
${body}
</body>
</html>`;
}

/**
 * Renders default greeting text.
 *
 * Uses profile name when available, otherwise falls back to a
 * generic greeting.
 *
 * @param context - Template context with optional profile
 * @returns Greeting string (e.g., "Hi Jim," or "Hi there,")
 * @since 0.3.0
 */
export function greeting(context: EmailTemplateContext): string {
    return context.profile?.name ? `Hi ${context.profile.name},` : 'Hi there,';
}

/**
 * Renders a styled call-to-action button.
 *
 * @param url - Button link URL
 * @param label - Button text
 * @returns HTML string for the button
 * @since 0.3.0
 */
export function actionButton(url: string, label: string): string {
    return `<p style="margin: 24px 0;">
    <a href="${url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
      ${label}
    </a>
  </p>`;
}

/**
 * Renders a muted disclaimer paragraph.
 *
 * @param text - Disclaimer content
 * @returns HTML string
 * @since 0.3.0
 */
export function disclaimer(text: string): string {
    return `<p style="color: #6b7280; font-size: 14px;">${text}</p>`;
}

// ─── Sign-In Template ────────────────────────────────────────

/**
 * Default template for magic link sign-in emails.
 *
 * @param context - Template context (appName, email, profile)
 * @param data - Sign-in data (magic link URL)
 * @returns Rendered email content
 * @since 0.3.0
 */
export const signInTemplate: EmailTemplateFunction<SignInEmailData> = (
    context: EmailTemplateContext,
    data: SignInEmailData,
): EmailContent => {
    const greet = greeting(context);
    const subject = `Sign in to ${context.appName}`;

    const html = emailLayout(`
  <h2 style="color: #4f46e5;">Sign in to ${context.appName}</h2>
  <p>${greet}</p>
  <p>Click the button below to sign in:</p>
  ${actionButton(data.url, 'Sign In')}
  ${disclaimer('This link expires in 60 minutes.')}
  ${disclaimer("If you didn't request this, you can safely ignore this email.")}`);

    const text = `${greet}\n\nClick this link to sign in to ${context.appName}:\n\n${data.url}\n\nThis link expires in 60 minutes.\n\nIf you didn't request this, you can safely ignore this email.`;

    return { subject, html, text };
};

// ─── Welcome Template ────────────────────────────────────────

/**
 * Default template for welcome emails (new user sign-up).
 *
 * @param context - Template context (appName, email, profile)
 * @param data - Welcome data (verification URL)
 * @returns Rendered email content
 * @since 0.3.0
 */
export const welcomeTemplate: EmailTemplateFunction<WelcomeEmailData> = (
    context: EmailTemplateContext,
    data: WelcomeEmailData,
): EmailContent => {
    const greet = greeting(context);
    const subject = `Welcome to ${context.appName}! Verify your account`;

    const html = emailLayout(`
  <h2 style="color: #4f46e5;">Welcome to ${context.appName}!</h2>
  <p>${greet}</p>
  <p>Your account is almost ready. Click the button below to verify your email and get started:</p>
  ${actionButton(data.url, 'Verify & Get Started')}
  ${disclaimer('This link expires in 60 minutes.')}
  ${disclaimer("If you didn't create this account, you can safely ignore this email.")}`);

    const text = `${greet}\n\nWelcome to ${context.appName}!\n\nClick this link to verify your account and get started:\n\n${data.url}\n\nThis link expires in 60 minutes.\n\nIf you didn't create this account, you can safely ignore this email.`;

    return { subject, html, text };
};

// ─── Email Change Template ───────────────────────────────────

/**
 * Default template for email change verification emails.
 *
 * @param context - Template context (appName, email, profile)
 * @param data - Email change data (verification URL)
 * @returns Rendered email content
 * @since 0.3.0
 */
export const emailChangeTemplate: EmailTemplateFunction<EmailChangeData> = (
    context: EmailTemplateContext,
    data: EmailChangeData,
): EmailContent => {
    const greet = greeting(context);
    const subject = `Confirm your new email address — ${context.appName}`;

    const html = emailLayout(`
  <h2 style="color: #4f46e5;">Confirm your new email address</h2>
  <p>${greet}</p>
  <p>You requested an email address change on <strong>${context.appName}</strong>.</p>
  <p>Click the button below to confirm your new address:</p>
  ${actionButton(data.verificationUrl, 'Confirm Email Change')}
  ${disclaimer('This link expires in 24 hours.')}
  ${disclaimer('If you did not request this change, you can safely ignore this email. Your current email remains active.')}`);

    const text = `${greet}\n\nYou requested an email address change on ${context.appName}.\n\nClick the link below to confirm your new address:\n\n${data.verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you did not request this change, you can safely ignore this email. Your current email remains active.`;

    return { subject, html, text };
};

/**
 * Registry of all built-in default templates.
 *
 * Used by the email service as fallback when no custom template
 * is configured for a given email type.
 *
 * @since 0.3.0
 */
export const defaultTemplates: EmailTemplateMap = {
    'sign-in': signInTemplate,
    'welcome': welcomeTemplate,
    'email-change': emailChangeTemplate,
};

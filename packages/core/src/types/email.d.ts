/**
 * Email system type definitions for Community RSS.
 *
 * Defines the interfaces for the adapter-based email architecture:
 * templates, transports, and the email service.
 *
 * @since 0.3.0
 */
/**
 * User profile data available to email templates.
 *
 * Passed to template functions so emails can greet users by name
 * or include other profile information.
 *
 * @since 0.3.0
 */
export interface EmailUserProfile {
    /** Display name (e.g., "Jim"). */
    name?: string;
    /** Email address. */
    email?: string;
    /** Avatar URL. */
    avatarUrl?: string;
}
/**
 * Context passed to all email template functions.
 *
 * Contains app-level settings and optional user profile data.
 * Template functions use this to personalise email content.
 *
 * @since 0.3.0
 */
export interface EmailTemplateContext {
    /** Application name from EmailConfig (default: 'Community RSS'). */
    appName: string;
    /** Recipient email address. */
    email: string;
    /** User profile when available (for personalisation). */
    profile?: EmailUserProfile;
}
/**
 * Rendered email content returned by a template function.
 *
 * @since 0.3.0
 */
export interface EmailContent {
    /** Email subject line. */
    subject: string;
    /** HTML body. */
    html: string;
    /** Plain-text body (fallback for non-HTML clients). */
    text: string;
}
/**
 * Template function signature.
 *
 * Takes a context object (app name, recipient, profile) and
 * type-specific data, returns fully rendered email content.
 *
 * @typeParam TData - Type-specific data payload (e.g., magic link URL)
 * @since 0.3.0
 */
export type EmailTemplateFunction<TData = Record<string, unknown>> = (context: EmailTemplateContext, data: TData) => EmailContent;
/**
 * Data payload for sign-in magic link emails.
 *
 * @since 0.3.0
 */
export interface SignInEmailData {
    /** Magic link URL (includes verification token). */
    url: string;
}
/**
 * Data payload for welcome emails (new user sign-up).
 *
 * @since 0.3.0
 */
export interface WelcomeEmailData {
    /** Magic link URL for account verification. */
    url: string;
}
/**
 * Data payload for email change verification emails.
 *
 * @since 0.3.0
 */
export interface EmailChangeData {
    /** URL for confirming the email address change. */
    verificationUrl: string;
}
/**
 * Maps built-in email type names to their data payload interfaces.
 *
 * Consumers can extend this via declaration merging to register
 * custom email types:
 *
 * ```typescript
 * declare module '@community-rss/core' {
 *   interface EmailTypeDataMap {
 *     'comment-notification': { articleTitle: string; commentUrl: string };
 *   }
 * }
 * ```
 *
 * @since 0.3.0
 */
export interface EmailTypeDataMap {
    'sign-in': SignInEmailData;
    'welcome': WelcomeEmailData;
    'email-change': EmailChangeData;
}
/**
 * Name of a registered email type.
 *
 * @since 0.3.0
 */
export type EmailType = keyof EmailTypeDataMap;
/**
 * Map of email type names to their template functions.
 *
 * Used in `EmailConfig.templates` to override default templates.
 * Allows any template function to be registered for custom email types.
 *
 * @since 0.3.0
 */
export type EmailTemplateMap = Record<string, EmailTemplateFunction<any>>;
/**
 * A fully-rendered email message ready for transport.
 *
 * @since 0.3.0
 */
export interface EmailMessage {
    /** Sender address. */
    from: string;
    /** Recipient address. */
    to: string;
    /** Subject line. */
    subject: string;
    /** Plain-text body. */
    text: string;
    /** HTML body. */
    html: string;
}
/**
 * Transport adapter interface.
 *
 * Implement this to add custom email providers (SendGrid, Postmark, etc.).
 *
 * @example
 * ```typescript
 * const sendGridTransport: EmailTransport = {
 *   async send(message) {
 *     await sgMail.send({
 *       to: message.to,
 *       from: message.from,
 *       subject: message.subject,
 *       text: message.text,
 *       html: message.html,
 *     });
 *   },
 * };
 * ```
 *
 * @since 0.3.0
 */
export interface EmailTransport {
    /** Send a fully-rendered email message. */
    send(message: EmailMessage): Promise<void>;
}
/**
 * Unified email service interface.
 *
 * Combines template rendering with transport delivery.
 * Created via `createEmailService(env, emailConfig)`.
 *
 * @since 0.3.0
 */
export interface EmailService {
    /**
     * Render and send an email of the given type.
     *
     * @param type - Email type name (must have a registered template)
     * @param to - Recipient email address
     * @param data - Type-specific data payload
     * @param profile - Optional user profile for personalisation
     * @since 0.3.0
     */
    send<K extends string>(type: K, to: string, data: K extends keyof EmailTypeDataMap ? EmailTypeDataMap[K] : Record<string, unknown>, profile?: EmailUserProfile): Promise<void>;
}
//# sourceMappingURL=email.d.ts.map
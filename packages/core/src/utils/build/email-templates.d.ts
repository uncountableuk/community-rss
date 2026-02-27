/**
 * Default email templates for Community RSS.
 *
 * Each template is a pure function: `(context, data) => EmailContent`.
 * Consumers can import these to extend or wrap them, or replace them
 * entirely via `EmailConfig.templates`.
 *
 * @since 0.3.0
 */
import type { EmailTemplateContext, EmailTemplateFunction, SignInEmailData, WelcomeEmailData, EmailChangeData, EmailTemplateMap } from '../../types/email';
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
export declare function emailLayout(body: string): string;
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
export declare function greeting(context: EmailTemplateContext): string;
/**
 * Renders a styled call-to-action button.
 *
 * @param url - Button link URL
 * @param label - Button text
 * @returns HTML string for the button
 * @since 0.3.0
 */
export declare function actionButton(url: string, label: string): string;
/**
 * Renders a muted disclaimer paragraph.
 *
 * @param text - Disclaimer content
 * @returns HTML string
 * @since 0.3.0
 */
export declare function disclaimer(text: string): string;
/**
 * Default template for magic link sign-in emails.
 *
 * @param context - Template context (appName, email, profile)
 * @param data - Sign-in data (magic link URL)
 * @returns Rendered email content
 * @since 0.3.0
 */
export declare const signInTemplate: EmailTemplateFunction<SignInEmailData>;
/**
 * Default template for welcome emails (new user sign-up).
 *
 * @param context - Template context (appName, email, profile)
 * @param data - Welcome data (verification URL)
 * @returns Rendered email content
 * @since 0.3.0
 */
export declare const welcomeTemplate: EmailTemplateFunction<WelcomeEmailData>;
/**
 * Default template for email change verification emails.
 *
 * @param context - Template context (appName, email, profile)
 * @param data - Email change data (verification URL)
 * @returns Rendered email content
 * @since 0.3.0
 */
export declare const emailChangeTemplate: EmailTemplateFunction<EmailChangeData>;
/**
 * Registry of all built-in default templates.
 *
 * Used by the email service as fallback when no custom template
 * is configured for a given email type.
 *
 * @since 0.3.0
 */
export declare const defaultTemplates: EmailTemplateMap;
//# sourceMappingURL=email-templates.d.ts.map
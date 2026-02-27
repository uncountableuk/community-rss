/**
 * File-based email template renderer.
 *
 * Resolves HTML template files from the developer's project directory
 * first, then falls back to the package's built-in templates. Supports
 * `{{variable}}` substitution and subject extraction from HTML comments.
 *
 * @since 0.4.0
 */
import type { EmailContent } from '../../types/email';
/**
 * Resolves a template file path, checking the developer's directory first,
 * then falling back to the package's built-in templates.
 *
 * @param name - Template name (e.g., 'sign-in', 'welcome')
 * @param developerDir - Optional developer-provided template directory
 * @returns Resolved file path, or null if not found
 * @since 0.4.0
 */
export declare function resolveTemplatePath(name: string, developerDir?: string): string | null;
/**
 * Extracts the subject line from an HTML comment at the start of a template.
 *
 * Expected format: `<!-- subject: Your subject here -->`
 *
 * @param html - Template HTML string
 * @returns Extracted subject, or null if no subject comment found
 * @since 0.4.0
 */
export declare function extractSubject(html: string): string | null;
/**
 * Replaces `{{variable}}` placeholders in a template string.
 *
 * @param template - Template string with `{{variable}}` placeholders
 * @param data - Key-value pairs to substitute
 * @returns Template with placeholders replaced
 * @since 0.4.0
 */
export declare function substituteVariables(template: string, data: Record<string, string>): string;
/**
 * Generates a plain text version from HTML by stripping tags.
 *
 * Preserves link URLs by converting `<a href="url">text</a>` to `text (url)`.
 * Converts `<br>`, `</p>`, and `</h*>` to newlines.
 *
 * @param html - HTML string to convert
 * @returns Plain text version
 * @since 0.4.0
 */
export declare function htmlToPlainText(html: string): string;
/**
 * Renders a file-based email template.
 *
 * Resolution order:
 * 1. Developer's template directory (if configured)
 * 2. Package's built-in templates
 *
 * @param name - Email template name (e.g., 'sign-in', 'welcome', 'email-change')
 * @param data - Template variables to substitute
 * @param developerDir - Optional developer-provided template directory
 * @returns Rendered email content (subject, html, text), or null if template not found
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * const content = renderEmailTemplate('sign-in', {
 *   appName: 'My Community',
 *   greeting: 'Hi Jim,',
 *   url: 'https://example.com/auth/verify?token=abc',
 * });
 * ```
 */
export declare function renderEmailTemplate(name: string, data: Record<string, string>, developerDir?: string): EmailContent | null;
//# sourceMappingURL=email-renderer.d.ts.map
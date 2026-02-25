/**
 * File-based email template renderer.
 *
 * Resolves HTML template files from the developer's project directory
 * first, then falls back to the package's built-in templates. Supports
 * `{{variable}}` substitution and subject extraction from HTML comments.
 *
 * @since 0.4.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { EmailContent } from '../../types/email';

/**
 * Default template directory inside the package.
 * @internal
 */
const PACKAGE_TEMPLATE_DIR = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '../../templates/email',
);

/**
 * Resolves a template file path, checking the developer's directory first,
 * then falling back to the package's built-in templates.
 *
 * @param name - Template name (e.g., 'sign-in', 'welcome')
 * @param developerDir - Optional developer-provided template directory
 * @returns Resolved file path, or null if not found
 * @since 0.4.0
 */
export function resolveTemplatePath(
  name: string,
  developerDir?: string,
): string | null {
  // Check developer directory first
  if (developerDir) {
    const devPath = path.resolve(developerDir, `${name}.html`);
    if (fs.existsSync(devPath)) {
      return devPath;
    }
  }

  // Fall back to package templates
  const packagePath = path.join(PACKAGE_TEMPLATE_DIR, `${name}.html`);
  if (fs.existsSync(packagePath)) {
    return packagePath;
  }

  return null;
}

/**
 * Extracts the subject line from an HTML comment at the start of a template.
 *
 * Expected format: `<!-- subject: Your subject here -->`
 *
 * @param html - Template HTML string
 * @returns Extracted subject, or null if no subject comment found
 * @since 0.4.0
 */
export function extractSubject(html: string): string | null {
  const match = html.match(/<!--\s*subject:\s*(.+?)\s*-->/i);
  return match ? match[1].trim() : null;
}

/**
 * Replaces `{{variable}}` placeholders in a template string.
 *
 * @param template - Template string with `{{variable}}` placeholders
 * @param data - Key-value pairs to substitute
 * @returns Template with placeholders replaced
 * @since 0.4.0
 */
export function substituteVariables(
  template: string,
  data: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return data[key] ?? match;
  });
}

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
export function htmlToPlainText(html: string): string {
  return html
    // Remove subject comment
    .replace(/<!--\s*subject:.*?-->/gi, '')
    // Convert links to text (url) — use [\s\S] to match across newlines
    .replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, url: string, text: string) => {
      return `${text.trim()} (${url})`;
    })
    // Convert block-level closers to newlines
    .replace(/<\/(p|h[1-6]|div|li|tr)>/gi, '\n')
    // Convert <br> to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode common entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim();
}

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
export function renderEmailTemplate(
  name: string,
  data: Record<string, string>,
  developerDir?: string,
): EmailContent | null {
  const templatePath = resolveTemplatePath(name, developerDir);
  if (!templatePath) {
    return null;
  }

  const rawHtml = fs.readFileSync(templatePath, 'utf-8');

  // Extract subject before variable substitution so we can substitute in subject too
  const rawSubject = extractSubject(rawHtml);
  const subject = rawSubject ? substituteVariables(rawSubject, data) : name;

  const html = substituteVariables(rawHtml, data);
  const text = htmlToPlainText(html);

  return { subject, html, text };
}

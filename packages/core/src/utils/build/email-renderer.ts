/**
 * File-based and Astro Container API email template renderer.
 *
 * Supports two rendering paths:
 * 1. **Astro templates** (`.astro`) — loaded via the `virtual:crss-email-templates`
 *    Vite virtual module, rendered via the Astro Container API, and post-processed
 *    with `juice` for CSS inlining. Developer templates take priority over package
 *    built-ins. Preferred for new emails.
 * 2. **HTML templates** (`.html`) — traditional `{{variable}}` substitution.
 *    Maintained for backward compatibility.
 *
 * Resolution order for each email type:
 * 1. Developer Astro template (via virtual module)
 * 2. Package Astro template (via virtual module)
 * 3. Developer HTML template (if exists in emailTemplateDir)
 * 4. Package HTML template (fallback)
 * 5. Code-based default template (last resort)
 *
 * @since 0.4.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { EmailContent } from '../../types/email';
import type { ResolvedEmailTheme } from '../../types/email-theme';

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

/**
 * Maps email type names to their Astro component subject lines.
 * @internal
 * @since 0.5.0
 */
const ASTRO_EMAIL_SUBJECTS: Record<string, (data: Record<string, string>) => string> = {
  'sign-in': (data) => `Sign in to ${data.appName ?? 'Community RSS'}`,
  'welcome': (data) => `Welcome to ${data.appName ?? 'Community RSS'}! Verify your account`,
  'email-change': (data) => `Confirm your new email address — ${data.appName ?? 'Community RSS'}`,
};

/**
 * Maps email type names to their Astro component file names.
 * @internal
 * @since 0.5.0
 */
const ASTRO_EMAIL_COMPONENTS: Record<string, string> = {
  'sign-in': 'SignInEmail.astro',
  'welcome': 'WelcomeEmail.astro',
  'email-change': 'EmailChangeEmail.astro',
};

/**
 * Resolves the path to a developer's Astro email template, if it exists.
 *
 * Uses the `ASTRO_EMAIL_COMPONENTS` naming convention: email type
 * `sign-in` → file `SignInEmail.astro`.
 *
 * @param name - Email type name (e.g., 'sign-in')
 * @param developerDir - Developer's email template directory
 * @returns Absolute path to the developer's `.astro` template, or null
 * @since 0.5.0
 */
export function resolveDeveloperAstroTemplatePath(
  name: string,
  developerDir?: string,
): string | null {
  if (!developerDir) {
    return null;
  }

  const componentFile = ASTRO_EMAIL_COMPONENTS[name];
  if (!componentFile) {
    return null;
  }

  const devPath = path.resolve(developerDir, componentFile);
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  return null;
}

/**
 * Renders an Astro email template via the Container API with `juice`
 * CSS inlining.
 *
 * Templates are loaded from the `virtual:crss-email-templates` Vite virtual
 * module, which is populated by the integration's Vite plugin at startup.
 * Developer templates (from `emailTemplateDir`) take priority over the
 * package's built-in Astro templates.
 *
 * @param name - Email type name (e.g., 'sign-in')
 * @param props - Props to pass to the Astro component
 * @param theme - Optional resolved email theme (colours, typography, spacing, branding)
 * @param _developerDir - Deprecated: developer directory is now resolved via the virtual module.
 *                         Parameter retained for backward compatibility.
 * @returns Rendered email content, or null if the template is unavailable
 * @since 0.5.0
 */
export async function renderAstroEmail(
  name: string,
  props: Record<string, string>,
  theme?: ResolvedEmailTheme,
  _developerDir?: string,
): Promise<EmailContent | null> {
  // Quick bail-out for unknown template types (avoids pointless import attempts)
  if (!ASTRO_EMAIL_SUBJECTS[name]) {
    return null;
  }

  try {
    const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
    const juice = (await import('juice')).default;

    // Import templates from the virtual module (populated by Vite plugin in integration.ts).
    // Developer templates take priority over package built-in templates.
    let Component: any = null;
    try {
      const { devTemplates, packageTemplates } = await import('virtual:crss-email-templates');
      Component = devTemplates[name] ?? packageTemplates[name] ?? null;
    } catch {
      // Virtual module not available (e.g., test environment without Vite plugin)
      return null;
    }

    if (!Component) {
      return null;
    }

    const container = await AstroContainer.create();
    const rawHtml = await container.renderToString(Component, {
      props: { ...props, ...(theme ? { theme } : {}) },
    });

    // Inline CSS for email client compatibility
    const html = juice(rawHtml);
    const text = htmlToPlainText(html);

    const subjectFn = ASTRO_EMAIL_SUBJECTS[name];
    const subject = subjectFn ? subjectFn(props) : name;

    return { subject, html, text };
  } catch (err) {
    // Container API not available or rendering failed — fall through
    console.warn(`[community-rss] Astro email rendering failed for "${name}":`, err);
    return null;
  }
}

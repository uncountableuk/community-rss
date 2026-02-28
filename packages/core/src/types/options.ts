/**
 * Configuration options for the Community RSS framework.
 *
 * All properties are optional with sensible defaults.
 * Consumers pass this to `communityRss(options)` in their `astro.config.mjs`.
 *
 * @since 0.1.0
 */
export interface CommunityRssOptions {
  /**
   * Maximum number of feeds a verified author can submit.
   * @default 5
   * @since 0.1.0
   */
  maxFeeds?: number;

  /**
   * Minimum user tier required to leave comments.
   * - `'verified'` — Only verified authors can comment
   * - `'registered'` — Registered users and above can comment
   * - `'guest'` — All users including guests can comment (moderated)
   * @default 'registered'
   * @since 0.1.0
   */
  commentTier?: 'verified' | 'registered' | 'guest';

  /**
   * Email configuration for magic links and notifications.
   * @since 0.3.0
   */
  email?: EmailConfig;

  /**
   * Path to SQLite database file.
   * @default './data/community.db'
   * @since 0.4.0
   */
  databasePath?: string;

  /**
   * Cron expression for feed sync schedule.
   * Defaults to every 30 minutes (`STAR/30 * * * *` where STAR = asterisk).
   * @since 0.4.0
   */
  syncSchedule?: string;

  /**
   * Directory containing email template overrides.
   * Relative to the project root.
   * @default './src/email-templates'
   * @since 0.4.0
   */
  emailTemplateDir?: string;
}

/**
 * Email configuration for transactional emails.
 *
 * Controls the transport adapter, sender address, and template
 * overrides for all emails sent by the framework.
 *
 * @since 0.3.0
 */
export interface EmailConfig {
  /**
   * Email sender address (e.g., 'noreply@example.com').
   * Falls back to `env.SMTP_FROM` if not set.
   * @since 0.3.0
   */
  from?: string;

  /**
   * Application name shown in email subject/body.
   * @default 'Community RSS'
   * @since 0.3.0
   */
  appName?: string;

  /**
   * Transport adapter configuration.
   *
   * - `'smtp'` — Uses Mailpit HTTP API (requires `SMTP_HOST` env var)
   * - `'resend'` — Uses Resend API (requires `RESEND_API_KEY` env var)
   * - `EmailTransport` object — Custom transport implementation
   *
   * When not set, emails are not sent and a warning is logged.
   *
   * @since 0.3.0
   */
  transport?: 'smtp' | 'resend' | import('./email').EmailTransport;

  /**
   * Override default email templates by type.
   *
   * Each key is an email type name (e.g., `'sign-in'`, `'welcome'`,
   * `'email-change'`). The value is a template function that receives
   * an `EmailTemplateContext` and type-specific data, returning
   * `{ subject, html, text }`.
   *
   * @example
   * ```typescript
   * templates: {
   *   'sign-in': (ctx, data) => ({
   *     subject: `Log in to ${ctx.appName}`,
   *     html: `<h1>Hi ${ctx.profile?.name ?? 'there'}!</h1><a href="${data.url}">Sign In</a>`,
   *     text: `Hi ${ctx.profile?.name ?? 'there'}, click here: ${data.url}`,
   *   }),
   * }
   * ```
   *
   * @since 0.3.0
   */
  templates?: import('./email').EmailTemplateMap;

  /**
   * Directory containing HTML email template files.
   * @default './src/email-templates'
   * @since 0.4.0
   */
  templateDir?: string;

  /**
   * Email theme configuration for colours, typography, spacing, and branding.
   *
   * All properties are optional — unspecified values use sensible defaults
   * matching the framework's built-in email styles.
   *
   * @since 0.5.0
   *
   * @example
   * ```typescript
   * theme: {
   *   colors: { primary: '#e11d48', background: '#0f172a' },
   *   branding: { logoUrl: 'https://example.com/logo.png' },
   * }
   * ```
   */
  theme?: import('./email-theme').EmailThemeConfig;
}

import type { ResolvedEmailTheme } from './email-theme';
import { mergeEmailTheme } from './email-theme';

/**
 * Fully resolved configuration with all defaults applied.
 *
 * @since 0.4.0
 */
export type ResolvedCommunityRssOptions = Required<Pick<CommunityRssOptions, 'maxFeeds' | 'commentTier' | 'databasePath' | 'syncSchedule' | 'emailTemplateDir'>> & {
  email: {
    from: string | undefined;
    appName: string;
    transport: CommunityRssOptions['email'] extends { transport?: infer T } ? T : undefined;
    templates: import('./email').EmailTemplateMap | undefined;
    templateDir: string;
    theme: ResolvedEmailTheme;
  };
};

/**
 * Resolves a partial options object into a fully-populated config
 * with all defaults applied.
 *
 * @param options - Partial user-supplied configuration
 * @returns Fully resolved configuration with defaults
 * @since 0.1.0
 */
export function resolveOptions(options: CommunityRssOptions = {}): ResolvedCommunityRssOptions {
  const appName = options.email?.appName ?? 'Community RSS';
  return {
    maxFeeds: options.maxFeeds ?? 5,
    commentTier: options.commentTier ?? 'registered',
    databasePath: options.databasePath ?? './data/community.db',
    syncSchedule: options.syncSchedule ?? '*/30 * * * *',
    emailTemplateDir: options.emailTemplateDir ?? './src/email-templates',
    email: {
      from: options.email?.from,
      appName,
      transport: options.email?.transport,
      templates: options.email?.templates,
      templateDir: options.email?.templateDir ?? './src/email-templates',
      theme: mergeEmailTheme(options.email?.theme, appName),
    },
  };
}

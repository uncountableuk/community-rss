/**
 * @community-rss/core — White-label Astro Integration for community
 * content aggregation.
 *
 * @packageDocumentation
 * @since 0.1.0
 * @license GPL-3.0
 */

import type { AstroIntegration } from 'astro';
import type { CommunityRssOptions } from './src/types/options';
import { createIntegration } from './src/integration';

/**
 * Configures and returns the Community RSS Astro integration.
 *
 * @param options - Framework configuration
 * @returns Astro integration instance
 * @since 0.1.0
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import communityRss from '@community-rss/core';
 *
 * export default defineConfig({
 *   integrations: [communityRss({ maxFeeds: 10 })],
 * });
 * ```
 */
export default function communityRss(options?: CommunityRssOptions): AstroIntegration {
  return createIntegration(options);
}

// Public type exports
export type { CommunityRssOptions, EmailConfig, ResolvedCommunityRssOptions } from './src/types/options';
export type { AppContext, EnvironmentVariables } from './src/types/context';
export type {
  UserTier,
  UserRole,
  FeedStatus,
  CommentStatus,
  InteractionType,
  CommunityRssError,
} from './src/types/models';
export type {
  EmailTransport,
  EmailMessage,
  EmailTemplateContext,
  EmailContent,
  EmailUserProfile,
  EmailType,
  EmailTemplateFunction,
  EmailTemplateMap,
  EmailTypeDataMap,
  EmailService,
  SignInEmailData,
  WelcomeEmailData,
  EmailChangeData,
} from './src/types/email';

// Default email templates (consumers can import to extend/wrap)
export {
  signInTemplate,
  welcomeTemplate,
  emailChangeTemplate,
  emailLayout,
  greeting,
  actionButton,
  disclaimer,
  defaultTemplates,
} from './src/utils/build/email-templates';

// Built-in email transport factories
export {
  createResendTransport,
  createSmtpTransport,
} from './src/utils/build/email-transports';

// Email service factory
export { createEmailService } from './src/utils/build/email-service';

// Email template renderer
export { renderEmailTemplate } from './src/utils/build/email-renderer';

// Database exports
export { createDatabase, closeDatabase } from './src/db/connection';

// Scheduler exports
export { startScheduler, stopScheduler, isSchedulerRunning } from './src/utils/build/scheduler';

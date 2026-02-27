/**
 * Unified email service for Community RSS.
 *
 * Combines template rendering with transport delivery via a single
 * `send()` method. Created per-request via `createEmailService()`.
 *
 * @since 0.3.0
 */
import type { AppContext } from '../../types/context';
import type { EnvironmentVariables } from '../../types/context';
import type { EmailConfig } from '../../types/options';
import type { EmailService, EmailTransport, EmailTemplateFunction } from '../../types/email';
/**
 * Resolves the transport adapter from configuration.
 *
 * @param env - Environment variables
 * @param emailConfig - Email configuration from integration options
 * @returns Resolved EmailTransport or null if not configured
 * @since 0.3.0
 */
export declare function resolveTransport(env: EnvironmentVariables, emailConfig?: EmailConfig): EmailTransport | null;
/**
 * Resolves the template function for a given email type.
 *
 * Checks custom templates first, then falls back to built-in defaults.
 *
 * @param type - Email type name
 * @param emailConfig - Email configuration (may contain custom templates)
 * @returns Template function or null if no template is registered
 * @since 0.3.0
 */
export declare function resolveTemplate(type: string, emailConfig?: EmailConfig): EmailTemplateFunction<Record<string, unknown>> | null;
/**
 * Creates a unified email service instance.
 *
 * The service resolves templates and transport from the provided
 * application context, then exposes a single `send()` method for all
 * email types.
 *
 * @param app - Application context
 * @returns EmailService instance
 * @since 0.3.0
 *
 * @example
 * ```typescript
 * const emailService = createEmailService(app);
 * await emailService.send('sign-in', 'user@example.com', { url }, { name: 'Jim' });
 * ```
 */
export declare function createEmailService(app: AppContext): EmailService;
//# sourceMappingURL=email-service.d.ts.map
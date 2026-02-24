/**
 * Unified email service for Community RSS.
 *
 * Combines template rendering with transport delivery via a single
 * `send()` method. Created per-request via `createEmailService()`.
 *
 * @since 0.3.0
 */

import type { Env } from '../../types/env';
import type { EmailConfig } from '../../types/options';
import type {
    EmailService,
    EmailTransport,
    EmailUserProfile,
    EmailTemplateContext,
    EmailTemplateFunction,
} from '../../types/email';
import { defaultTemplates } from './email-templates';
import { createResendTransport, createSmtpTransport } from './email-transports';

/**
 * Resolves the transport adapter from configuration.
 *
 * @param env - Cloudflare environment bindings
 * @param emailConfig - Email configuration from integration options
 * @returns Resolved EmailTransport or null if not configured
 * @since 0.3.0
 */
export function resolveTransport(
    env: Env,
    emailConfig?: EmailConfig,
): EmailTransport | null {
    // 1. EmailConfig.transport (integration options) has highest priority
    const configTransport = emailConfig?.transport;

    if (configTransport && typeof configTransport === 'object') {
        // Custom EmailTransport implementation
        return configTransport;
    }

    // 2. Fall back to EMAIL_TRANSPORT env var when config doesn't specify a string
    const transportName = (typeof configTransport === 'string' ? configTransport : undefined)
        ?? env.EMAIL_TRANSPORT;

    if (!transportName) {
        return null;
    }

    if (transportName === 'resend') {
        const apiKey = env.RESEND_API_KEY;
        if (!apiKey) {
            console.warn(
                '[community-rss] Email transport is "resend" but RESEND_API_KEY is not set. Emails will not be sent.',
            );
            return null;
        }
        return createResendTransport(apiKey);
    }

    if (transportName === 'smtp') {
        const host = env.SMTP_HOST || 'localhost';
        return createSmtpTransport(host);
    }

    console.warn(
        `[community-rss] Unknown email transport "${transportName}". Emails will not be sent.`,
    );
    return null;
}

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
export function resolveTemplate(
    type: string,
    emailConfig?: EmailConfig,
): EmailTemplateFunction<Record<string, unknown>> | null {
    // Check consumer overrides first
    const customTemplate = emailConfig?.templates?.[type];
    if (customTemplate) {
        return customTemplate as EmailTemplateFunction<Record<string, unknown>>;
    }

    // Fall back to built-in default
    return defaultTemplates[type] ?? null;
}

/**
 * Creates a unified email service instance.
 *
 * The service resolves templates and transport from the provided
 * configuration, then exposes a single `send()` method for all
 * email types.
 *
 * @param env - Cloudflare environment bindings
 * @param emailConfig - Optional email configuration from integration options
 * @returns EmailService instance
 * @since 0.3.0
 *
 * @example
 * ```typescript
 * const emailService = createEmailService(env, options.email);
 * await emailService.send('sign-in', 'user@example.com', { url }, { name: 'Jim' });
 * ```
 */
export function createEmailService(
    env: Env,
    emailConfig?: EmailConfig,
): EmailService {
    const transport = resolveTransport(env, emailConfig);
    const from = emailConfig?.from ?? env.SMTP_FROM ?? 'noreply@localhost';
    const appName = emailConfig?.appName ?? 'Community RSS';

    return {
        async send<K extends string>(
            type: K,
            to: string,
            data: Record<string, unknown>,
            profile?: EmailUserProfile,
        ): Promise<void> {
            if (!transport) {
                console.warn(
                    `[community-rss] No email transport configured. Skipping "${type}" email to ${to}.`,
                );
                return;
            }

            const template = resolveTemplate(type, emailConfig);
            if (!template) {
                console.warn(
                    `[community-rss] No template registered for email type "${type}". Skipping email to ${to}.`,
                );
                return;
            }

            const context: EmailTemplateContext = {
                appName,
                email: to,
                profile,
            };

            const content = template(context, data);

            await transport.send({
                from,
                to,
                subject: content.subject,
                text: content.text,
                html: content.html,
            });
        },
    };
}

/**
 * Built-in email transport adapters for Community RSS.
 *
 * Two adapters are provided:
 * - **Resend** — Production email via the Resend REST API
 * - **SMTP** — Local development via Mailpit's HTTP API
 *
 * Consumers can implement their own `EmailTransport` for other
 * providers (SendGrid, Postmark, etc.).
 *
 * @since 0.3.0
 */

import type { EmailTransport, EmailMessage } from '../../types/email';

/**
 * Creates a Resend transport adapter.
 *
 * Sends email via the Resend REST API (`https://api.resend.com/emails`).
 * Throws on non-2xx responses with the error body for debugging.
 *
 * @param apiKey - Resend API key
 * @returns EmailTransport instance
 * @since 0.3.0
 */
export function createResendTransport(apiKey: string): EmailTransport {
    return {
        async send(message: EmailMessage): Promise<void> {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: message.from,
                    to: message.to,
                    subject: message.subject,
                    text: message.text,
                    html: message.html,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Resend email failed (${response.status}): ${errorBody}`);
            }
        },
    };
}

/**
 * Creates an SMTP transport adapter for local development.
 *
 * Uses Mailpit's HTTP API (`/api/v1/send`) for local email capture.
 * Falls back gracefully on
 * connection failure — logs a warning but does not throw.
 *
 * @param host - Mailpit hostname (e.g., 'mailpit' in Docker)
 * @param port - Mailpit HTTP API port (default: '8025')
 * @returns EmailTransport instance
 * @since 0.3.0
 */
export function createSmtpTransport(host: string, port: string = '8025'): EmailTransport {
    return {
        async send(message: EmailMessage): Promise<void> {
            try {
                const response = await fetch(`http://${host}:${port}/api/v1/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        From: { Email: message.from, Name: 'Community RSS' },
                        To: [{ Email: message.to }],
                        Subject: message.subject,
                        Text: message.text,
                    }),
                });

                if (!response.ok) {
                    console.warn(
                        `[community-rss] Mailpit send failed (${response.status}), email may not be delivered`,
                    );
                }
            } catch (error) {
                // In dev, log warning but don't fail the caller
                console.warn('[community-rss] Email delivery failed (SMTP not available):', error);
            }
        },
    };
}

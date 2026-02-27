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
import type { EmailTransport } from '../../types/email';
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
export declare function createResendTransport(apiKey: string): EmailTransport;
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
export declare function createSmtpTransport(host: string, port?: string): EmailTransport;
//# sourceMappingURL=email-transports.d.ts.map
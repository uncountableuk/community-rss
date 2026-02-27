import type { APIRoute } from 'astro';
/**
 * Request an email address change.
 *
 * Accepts the new email address, stores a pending change record, and sends
 * a verification link to the new address. The current email remains active
 * until the user confirms by following the link.
 *
 * Tokens expire after 24 hours. Submitting a new request overwrites any
 * existing pending change.
 *
 * - `POST /api/v1/profile/change-email` — body: `{ email: string }`
 *
 * @route /api/v1/profile/change-email
 * @since 0.3.0
 */
export declare const POST: APIRoute;
//# sourceMappingURL=change-email.d.ts.map
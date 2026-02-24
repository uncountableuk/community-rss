import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMagicLinkEmail, sendEmailChangeEmail } from '@utils/build/email';
import type { Env } from '@core-types/env';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const baseEnv: Env = {
    DB: {} as D1Database,
    MEDIA_BUCKET: {} as R2Bucket,
    ARTICLE_QUEUE: {} as Queue,
    FRESHRSS_URL: 'http://freshrss:80',
    FRESHRSS_USER: 'admin',
    FRESHRSS_API_PASSWORD: 'password',
    PUBLIC_SITE_URL: 'http://localhost:4321',
    SMTP_HOST: 'mailpit',
    SMTP_PORT: '1025',
    SMTP_FROM: 'noreply@localhost',
    S3_ENDPOINT: 'http://minio:9000',
    S3_ACCESS_KEY: 'key',
    S3_SECRET_KEY: 'secret',
    S3_BUCKET: 'bucket',
    MEDIA_BASE_URL: 'http://localhost:9000/bucket',
};

describe('email', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('sendMagicLinkEmail', () => {
        it('should use Resend API when RESEND_API_KEY is set', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            const env = { ...baseEnv, RESEND_API_KEY: 'test-key-123' };
            await sendMagicLinkEmail(env, 'user@example.com', 'https://example.com/verify?token=abc');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.resend.com/emails',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-key-123',
                    }),
                }),
            );

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.to).toBe('user@example.com');
            expect(body.subject).toContain('Sign in');
        });

        it('should use SMTP/Mailpit when no RESEND_API_KEY', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            await sendMagicLinkEmail(baseEnv, 'user@example.com', 'https://example.com/verify?token=abc');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://mailpit:8025/api/v1/send',
                expect.objectContaining({
                    method: 'POST',
                }),
            );
        });

        it('should use emailConfig.from when provided', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            const env = { ...baseEnv, RESEND_API_KEY: 'key' };
            await sendMagicLinkEmail(env, 'user@example.com', 'https://example.com/verify', {
                from: 'custom@example.com',
                appName: 'My App',
            });

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.from).toBe('custom@example.com');
            expect(body.subject).toContain('My App');
        });

        it('should fall back to SMTP_FROM when no emailConfig.from', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            const env = { ...baseEnv, RESEND_API_KEY: 'key' };
            await sendMagicLinkEmail(env, 'user@example.com', 'https://example.com/verify');

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.from).toBe('noreply@localhost');
        });

        it('should throw on Resend API error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 422,
                text: () => Promise.resolve('Invalid email'),
            });

            const env = { ...baseEnv, RESEND_API_KEY: 'key' };

            await expect(
                sendMagicLinkEmail(env, 'bad', 'https://example.com/verify'),
            ).rejects.toThrow('Resend email failed (422)');
        });

        it('should not throw on SMTP failure in dev (graceful degradation)', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            // Should not throw
            await sendMagicLinkEmail(baseEnv, 'user@example.com', 'https://example.com/verify');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Email delivery failed'),
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });

        it('should include magic link URL in email body', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            const env = { ...baseEnv, RESEND_API_KEY: 'key' };
            const url = 'https://example.com/verify?token=secret123';
            await sendMagicLinkEmail(env, 'user@example.com', url);

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.text).toContain(url);
            expect(body.html).toContain(url);
        });
    });

    describe('sendEmailChangeEmail', () => {
        it('should send via Resend when RESEND_API_KEY is set', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            const env = { ...baseEnv, RESEND_API_KEY: 'key' };
            await sendEmailChangeEmail(env, 'new@example.com', 'https://example.com/verify-change?token=abc');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.resend.com/emails',
                expect.objectContaining({ method: 'POST' }),
            );

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.to).toBe('new@example.com');
            expect(body.subject).toContain('Confirm');
        });

        it('should send via SMTP when no RESEND_API_KEY', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            await sendEmailChangeEmail(baseEnv, 'new@example.com', 'https://example.com/verify-change?token=abc');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://mailpit:8025/api/v1/send',
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should include verification URL in email body', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            const env = { ...baseEnv, RESEND_API_KEY: 'key' };
            const url = 'https://example.com/verify-change?token=tok123';
            await sendEmailChangeEmail(env, 'new@example.com', url);

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.text).toContain(url);
            expect(body.html).toContain(url);
        });

        it('should use emailConfig.appName in subject when provided', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            const env = { ...baseEnv, RESEND_API_KEY: 'key' };
            await sendEmailChangeEmail(env, 'new@example.com', 'https://example.com/verify', {
                from: 'hello@myapp.com',
                appName: 'My App',
            });

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.subject).toContain('My App');
            expect(body.from).toBe('hello@myapp.com');
        });
    });
});

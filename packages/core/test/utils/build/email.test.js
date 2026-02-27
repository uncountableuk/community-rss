import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMagicLinkEmail, sendEmailChangeEmail } from '@utils/build/email';
// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
const baseEnv = {
    DATABASE_PATH: './data/test.db',
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
function makeApp(emailConfig, envOverrides) {
    return {
        db: {},
        config: { email: emailConfig },
        env: { ...baseEnv, ...envOverrides },
    };
}
describe('email (facade)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('sendMagicLinkEmail', () => {
        it('should send via Resend when transport is "resend" and RESEND_API_KEY is set', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ transport: 'resend' }, { RESEND_API_KEY: 'test-key-123' });
            await sendMagicLinkEmail(app, 'user@example.com', 'https://example.com/verify?token=abc');
            expect(mockFetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer test-key-123',
                }),
            }));
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.to).toBe('user@example.com');
            expect(body.subject).toContain('Sign in');
        });
        it('should send via SMTP when transport is "smtp"', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ transport: 'smtp' });
            await sendMagicLinkEmail(app, 'user@example.com', 'https://example.com/verify?token=abc');
            expect(mockFetch).toHaveBeenCalledWith('http://mailpit:8025/api/v1/send', expect.objectContaining({
                method: 'POST',
            }));
        });
        it('should use EMAIL_TRANSPORT env var as fallback', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp(undefined, { EMAIL_TRANSPORT: 'smtp' });
            await sendMagicLinkEmail(app, 'user@example.com', 'https://example.com/verify');
            expect(mockFetch).toHaveBeenCalledWith('http://mailpit:8025/api/v1/send', expect.any(Object));
        });
        it('should use emailConfig.from when provided', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ from: 'custom@example.com', appName: 'My App', transport: 'resend' }, { RESEND_API_KEY: 'key' });
            await sendMagicLinkEmail(app, 'user@example.com', 'https://example.com/verify');
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.from).toBe('custom@example.com');
            expect(body.subject).toContain('My App');
        });
        it('should fall back to SMTP_FROM when no emailConfig.from', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ transport: 'resend' }, { RESEND_API_KEY: 'key' });
            await sendMagicLinkEmail(app, 'user@example.com', 'https://example.com/verify');
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.from).toBe('noreply@localhost');
        });
        it('should throw on Resend API error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 422,
                text: () => Promise.resolve('Invalid email'),
            });
            const app = makeApp({ transport: 'resend' }, { RESEND_API_KEY: 'key' });
            await expect(sendMagicLinkEmail(app, 'bad', 'https://example.com/verify')).rejects.toThrow('Resend email failed (422)');
        });
        it('should not throw on SMTP failure (graceful degradation)', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const app = makeApp({ transport: 'smtp' });
            await sendMagicLinkEmail(app, 'user@example.com', 'https://example.com/verify');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Email delivery failed'), expect.any(Error));
            consoleSpy.mockRestore();
        });
        it('should include magic link URL in email body', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ transport: 'resend' }, { RESEND_API_KEY: 'key' });
            const url = 'https://example.com/verify?token=secret123';
            await sendMagicLinkEmail(app, 'user@example.com', url);
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.text).toContain(url);
            expect(body.html).toContain(url);
        });
        it('should use welcome template when isWelcome is true', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ transport: 'resend' }, { RESEND_API_KEY: 'key' });
            await sendMagicLinkEmail(app, 'user@example.com', 'https://example.com/verify', true);
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.subject).toContain('Welcome');
        });
        it('should pass profile data for email personalisation', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ transport: 'resend' }, { RESEND_API_KEY: 'key' });
            await sendMagicLinkEmail(app, 'jim@example.com', 'https://example.com/verify', false, { name: 'Jim', email: 'jim@example.com' });
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.html).toContain('Hi Jim,');
            expect(body.text).toContain('Hi Jim,');
        });
        it('should skip sending when no transport configured', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const app = makeApp();
            await sendMagicLinkEmail(app, 'user@example.com', 'https://example.com/verify');
            expect(mockFetch).not.toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No email transport configured'));
            warnSpy.mockRestore();
        });
    });
    describe('sendEmailChangeEmail', () => {
        it('should send via Resend when transport is "resend"', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ transport: 'resend' }, { RESEND_API_KEY: 'key' });
            await sendEmailChangeEmail(app, 'new@example.com', 'https://example.com/confirm?token=abc');
            expect(mockFetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({ method: 'POST' }));
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.to).toBe('new@example.com');
            expect(body.subject).toContain('Confirm');
        });
        it('should send via SMTP when transport is "smtp"', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ transport: 'smtp' });
            await sendEmailChangeEmail(app, 'new@example.com', 'https://example.com/confirm');
            expect(mockFetch).toHaveBeenCalledWith('http://mailpit:8025/api/v1/send', expect.objectContaining({ method: 'POST' }));
        });
        it('should include verification URL in email body', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ transport: 'resend' }, { RESEND_API_KEY: 'key' });
            const url = 'https://example.com/confirm?token=tok123';
            await sendEmailChangeEmail(app, 'new@example.com', url);
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.text).toContain(url);
            expect(body.html).toContain(url);
        });
        it('should use emailConfig.appName in subject when provided', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ from: 'hello@myapp.com', appName: 'My App', transport: 'resend' }, { RESEND_API_KEY: 'key' });
            await sendEmailChangeEmail(app, 'new@example.com', 'https://example.com/verify');
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.subject).toContain('My App');
            expect(body.from).toBe('hello@myapp.com');
        });
        it('should pass profile data for email personalisation', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const app = makeApp({ transport: 'resend' }, { RESEND_API_KEY: 'key' });
            await sendEmailChangeEmail(app, 'new@example.com', 'https://example.com/verify', undefined, { name: 'Sarah', email: 'sarah@example.com' });
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.html).toContain('Hi Sarah,');
            expect(body.text).toContain('Hi Sarah,');
        });
    });
});
//# sourceMappingURL=email.test.js.map
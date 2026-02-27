import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEmailService, resolveTransport, resolveTemplate, } from '@utils/build/email-service';
import { signInTemplate, welcomeTemplate, emailChangeTemplate } from '@utils/build/email-templates';
// Mock global fetch (needed by transport adapters)
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
describe('email-service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    // ─── resolveTransport ────────────────────────────────────
    describe('resolveTransport', () => {
        it('should return null when no transport configured and no env var', () => {
            const result = resolveTransport(baseEnv);
            expect(result).toBeNull();
        });
        it('should return SMTP transport when emailConfig.transport is "smtp"', () => {
            const config = { transport: 'smtp' };
            const result = resolveTransport(baseEnv, config);
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('send');
        });
        it('should return Resend transport when emailConfig.transport is "resend"', () => {
            const env = { ...baseEnv, RESEND_API_KEY: 'test-key' };
            const config = { transport: 'resend' };
            const result = resolveTransport(env, config);
            expect(result).not.toBeNull();
        });
        it('should return null for "resend" when RESEND_API_KEY is missing', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const config = { transport: 'resend' };
            const result = resolveTransport(baseEnv, config);
            expect(result).toBeNull();
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('RESEND_API_KEY is not set'));
            warnSpy.mockRestore();
        });
        it('should return custom transport when an object is provided', () => {
            const customTransport = {
                send: vi.fn().mockResolvedValue(undefined),
            };
            const config = { transport: customTransport };
            const result = resolveTransport(baseEnv, config);
            expect(result).toBe(customTransport);
        });
        it('should fall back to EMAIL_TRANSPORT env var when config has no transport', () => {
            const env = { ...baseEnv, EMAIL_TRANSPORT: 'smtp' };
            const result = resolveTransport(env);
            expect(result).not.toBeNull();
        });
        it('should prefer emailConfig.transport over EMAIL_TRANSPORT env var', () => {
            const customTransport = {
                send: vi.fn().mockResolvedValue(undefined),
            };
            const env = { ...baseEnv, EMAIL_TRANSPORT: 'smtp' };
            const config = { transport: customTransport };
            const result = resolveTransport(env, config);
            expect(result).toBe(customTransport);
        });
        it('should warn for unknown transport string', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const env = { ...baseEnv, EMAIL_TRANSPORT: 'sendgrid' };
            const result = resolveTransport(env);
            expect(result).toBeNull();
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown email transport "sendgrid"'));
            warnSpy.mockRestore();
        });
    });
    // ─── resolveTemplate ─────────────────────────────────────
    describe('resolveTemplate', () => {
        it('should return built-in sign-in template by default', () => {
            const result = resolveTemplate('sign-in');
            expect(result).toBe(signInTemplate);
        });
        it('should return built-in welcome template by default', () => {
            const result = resolveTemplate('welcome');
            expect(result).toBe(welcomeTemplate);
        });
        it('should return built-in email-change template by default', () => {
            const result = resolveTemplate('email-change');
            expect(result).toBe(emailChangeTemplate);
        });
        it('should return null for unregistered email type', () => {
            const result = resolveTemplate('unknown-type');
            expect(result).toBeNull();
        });
        it('should return custom template when configured', () => {
            const customTemplate = (ctx, data) => ({
                subject: `Custom: ${ctx.appName}`,
                html: `<p>${data.url}</p>`,
                text: data.url,
            });
            const config = {
                templates: { 'sign-in': customTemplate },
            };
            const result = resolveTemplate('sign-in', config);
            expect(result).toBe(customTemplate);
        });
        it('should fall back to default when custom template not set for type', () => {
            const config = {
                templates: { 'sign-in': () => ({ subject: '', html: '', text: '' }) },
            };
            const result = resolveTemplate('welcome', config);
            expect(result).toBe(welcomeTemplate);
        });
    });
    // ─── createEmailService ──────────────────────────────────
    describe('createEmailService', () => {
        it('should skip sending and warn when no transport configured', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const service = createEmailService(makeApp());
            await service.send('sign-in', 'user@example.com', { url: 'https://example.com' });
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No email transport configured'));
            expect(mockFetch).not.toHaveBeenCalled();
            warnSpy.mockRestore();
        });
        it('should skip sending and warn for unknown email type', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const service = createEmailService(makeApp({ transport: 'smtp' }));
            await service.send('nonexistent', 'user@example.com', {});
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No template registered for email type "nonexistent"'));
            warnSpy.mockRestore();
        });
        it('should send sign-in email via configured transport', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const service = createEmailService(makeApp({ transport: 'smtp', appName: 'Test App' }));
            await service.send('sign-in', 'user@example.com', { url: 'https://example.com/verify' });
            expect(mockFetch).toHaveBeenCalledWith('http://mailpit:8025/api/v1/send', expect.objectContaining({ method: 'POST' }));
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.To[0].Email).toBe('user@example.com');
            expect(body.Subject).toContain('Sign in');
            expect(body.Subject).toContain('Test App');
        });
        it('should send welcome email with profile personalisation', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const service = createEmailService(makeApp({ transport: 'resend' }, { RESEND_API_KEY: 'key' }));
            await service.send('welcome', 'jim@example.com', { url: 'https://example.com/verify' }, { name: 'Jim', email: 'jim@example.com' });
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.subject).toContain('Welcome');
            expect(body.html).toContain('Hi Jim,');
            expect(body.text).toContain('Hi Jim,');
        });
        it('should send email-change email via transport', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const service = createEmailService(makeApp({ transport: 'smtp' }));
            await service.send('email-change', 'new@example.com', {
                verificationUrl: 'https://example.com/confirm?token=abc',
            });
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.Subject).toContain('Confirm');
            expect(body.Text).toContain('https://example.com/confirm?token=abc');
        });
        it('should use emailConfig.from for sender address', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const service = createEmailService(makeApp({ transport: 'resend', from: 'custom@example.com' }, { RESEND_API_KEY: 'key' }));
            await service.send('sign-in', 'user@example.com', { url: 'https://example.com' });
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.from).toBe('custom@example.com');
        });
        it('should fall back to SMTP_FROM when emailConfig.from is not set', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const service = createEmailService(makeApp({ transport: 'resend' }, { RESEND_API_KEY: 'key' }));
            await service.send('sign-in', 'user@example.com', { url: 'https://example.com' });
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.from).toBe('noreply@localhost');
        });
        it('should use custom template when configured', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const customTemplate = (ctx, data) => ({
                subject: `Custom sign-in for ${ctx.appName}`,
                html: `<p>Custom: ${data.url}</p>`,
                text: `Custom: ${data.url}`,
            });
            const service = createEmailService(makeApp({ transport: 'resend', appName: 'My App', templates: { 'sign-in': customTemplate } }, { RESEND_API_KEY: 'key' }));
            await service.send('sign-in', 'user@example.com', { url: 'https://example.com/magic' });
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.subject).toBe('Custom sign-in for My App');
            expect(body.html).toBe('<p>Custom: https://example.com/magic</p>');
        });
        it('should send via custom transport adapter', async () => {
            const customSend = vi.fn().mockResolvedValue(undefined);
            const customTransport = { send: customSend };
            const service = createEmailService(makeApp({ transport: customTransport }));
            await service.send('sign-in', 'user@example.com', { url: 'https://example.com' });
            expect(customSend).toHaveBeenCalledWith(expect.objectContaining({
                from: 'noreply@localhost',
                to: 'user@example.com',
                subject: expect.stringContaining('Sign in'),
            }));
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=email-service.test.js.map
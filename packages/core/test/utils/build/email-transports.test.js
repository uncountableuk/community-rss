import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createResendTransport, createSmtpTransport, } from '@utils/build/email-transports';
// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
const testMessage = {
    from: 'noreply@example.com',
    to: 'user@example.com',
    subject: 'Test Subject',
    text: 'Plain text body',
    html: '<h1>HTML body</h1>',
};
describe('email-transports', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    // ─── Resend Transport ────────────────────────────────────
    describe('createResendTransport', () => {
        it('should POST to Resend API with correct headers and body', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const transport = createResendTransport('test-api-key');
            await transport.send(testMessage);
            expect(mockFetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer test-api-key',
                    'Content-Type': 'application/json',
                }),
            }));
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.from).toBe('noreply@example.com');
            expect(body.to).toBe('user@example.com');
            expect(body.subject).toBe('Test Subject');
            expect(body.text).toBe('Plain text body');
            expect(body.html).toBe('<h1>HTML body</h1>');
        });
        it('should throw on non-2xx Resend response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 422,
                text: () => Promise.resolve('Validation error'),
            });
            const transport = createResendTransport('bad-key');
            await expect(transport.send(testMessage)).rejects.toThrow('Resend email failed (422): Validation error');
        });
        it('should throw on network error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network unreachable'));
            const transport = createResendTransport('key');
            await expect(transport.send(testMessage)).rejects.toThrow('Network unreachable');
        });
    });
    // ─── SMTP Transport ──────────────────────────────────────
    describe('createSmtpTransport', () => {
        it('should POST to Mailpit HTTP API with correct body', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const transport = createSmtpTransport('mailpit', '8025');
            await transport.send(testMessage);
            expect(mockFetch).toHaveBeenCalledWith('http://mailpit:8025/api/v1/send', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            }));
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.From.Email).toBe('noreply@example.com');
            expect(body.To[0].Email).toBe('user@example.com');
            expect(body.Subject).toBe('Test Subject');
            expect(body.Text).toBe('Plain text body');
        });
        it('should use default port 8025 when not specified', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const transport = createSmtpTransport('localhost');
            await transport.send(testMessage);
            expect(mockFetch).toHaveBeenCalledWith('http://localhost:8025/api/v1/send', expect.any(Object));
        });
        it('should log warning on non-2xx response but not throw', async () => {
            mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const transport = createSmtpTransport('mailpit');
            await transport.send(testMessage); // Should not throw
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Mailpit send failed (500)'));
            warnSpy.mockRestore();
        });
        it('should log warning on connection error but not throw', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const transport = createSmtpTransport('mailpit');
            await transport.send(testMessage); // Should not throw
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Email delivery failed'), expect.any(Error));
            warnSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=email-transports.test.js.map